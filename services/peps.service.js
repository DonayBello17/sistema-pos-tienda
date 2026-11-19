const DianService = require('./dian.service');

/**
 * Servicio de Dominio: Motor de Asignación y Valoración de Inventarios PEPS (FIFO)
 * Cumplimiento estricto de transacciones ACID y trazabilidad de lotes.
 */
class PepsService {
  /**
   * Ejecuta la venta transaccional bajo la metodología PEPS / FIFO
   * @param {Object} conn - Conexión activa de MySQL con transacción iniciada
   * @param {Object} datosVenta - { id_cliente, id_usuario, items, metodo_pago, tipo_comprobante, descuento_porcentaje }
   */
  static async procesarVentaPEPS(conn, datosVenta) {
    const {
      id_cliente,
      id_usuario,
      items, // [{ id_producto, cantidad }]
      metodo_pago = 'Efectivo',
      tipo_comprobante = 'Factura Electronica DIAN',
      descuento_porcentaje = 0
    } = datosVenta;

    if (!items || items.length === 0) {
      throw new Error('El carrito de venta no contiene ningún producto.');
    }

    // 1. Obtener cliente para la factura y CUFE
    const [[cliente]] = await conn.query(
      `SELECT id_cliente, cedula_nit, nombre_completo, correo, direccion FROM clientes WHERE id_cliente = ?`,
      [id_cliente || 1]
    );

    if (!cliente) {
      throw new Error(`Cliente ID ${id_cliente} no encontrado en el sistema.`);
    }

    // 2. Pre-validar productos y calcular base gravable
    const productosParaVenta = [];
    for (const item of items) {
      const cantidad = parseInt(item.cantidad, 10);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error(`Cantidad inválida para el producto ID ${item.id_producto}`);
      }

      // Bloqueo pesimista del producto
      const [[prod]] = await conn.query(
        `SELECT id_producto, codigo_barras, nombre, precio_base, tarifa_iva, precio_venta_final, stock_total 
         FROM productos 
         WHERE id_producto = ? AND estado = 'Activo' 
         FOR UPDATE`,
        [item.id_producto]
      );

      if (!prod) {
        throw new Error(`Producto ID ${item.id_producto} no encontrado o inactivo.`);
      }

      productosParaVenta.push({
        ...prod,
        cantidadSolicitada: cantidad
      });
    }

    // 3. Cálculo de impuestos y totales fiscales DIAN
    const liquidacionFiscal = DianService.calcularImpuestos(
      productosParaVenta.map(p => ({
        precio_base: p.precio_base,
        tarifa_iva: p.tarifa_iva,
        cantidad: p.cantidadSolicitada
      })),
      descuento_porcentaje
    );

    // 4. Generar consecutivo fiscal DIAN
    const numeroFactura = await DianService.obtenerSiguienteConsecutivo(conn);

    // Fecha y hora en formato estándar
    const ahora = new Date();
    const fechaStr = ahora.toISOString().slice(0, 10); // YYYY-MM-DD
    const horaStr = ahora.toTimeString().slice(0, 8);  // HH:mm:ss

    // 5. Generar CUFE y QR DIAN
    const { cufe } = DianService.generarCUFE({
      numeroFactura,
      fecha: fechaStr,
      hora: horaStr,
      subtotalBase: liquidacionFiscal.subtotal_base,
      iva19: liquidacionFiscal.iva_19,
      iva5: liquidacionFiscal.iva_5,
      totalPagar: liquidacionFiscal.total_pagar,
      docAdquiriente: cliente.cedula_nit
    });

    const qrData = DianService.generarQRPayload({
      numeroFactura,
      fecha: fechaStr,
      docAdquiriente: cliente.cedula_nit,
      subtotalBase: liquidacionFiscal.subtotal_base,
      ivaTotal: liquidacionFiscal.total_impuestos,
      totalPagar: liquidacionFiscal.total_pagar,
      cufe
    });

    // 6. Insertar Cabecera de Venta / Factura en `ventas_facturas`
    const [resVenta] = await conn.query(
      `INSERT INTO ventas_facturas 
       (numero_factura, id_cliente, id_usuario, subtotal_base, total_iva_19, total_iva_5, descuento, total_pagar, metodo_pago, tipo_comprobante, cufe, qr_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numeroFactura,
        cliente.id_cliente,
        id_usuario,
        liquidacionFiscal.subtotal_base,
        liquidacionFiscal.iva_19,
        liquidacionFiscal.iva_5,
        liquidacionFiscal.descuento,
        liquidacionFiscal.total_pagar,
        metodo_pago,
        tipo_comprobante,
        cufe,
        qrData
      ]
    );
    const id_venta = resVenta.insertId;

    // 7. DESCUENTO DE INVENTARIO SEGÚN REGLA PEPS ESTRICTA
    // Orden cronológico: ORDER BY fecha_ingreso ASC
    // Filtro estricto: cantidad_disponible > 0 AND fecha_vencimiento >= CURDATE()
    const tramosDetalleVenta = [];

    for (const prod of productosParaVenta) {
      let restante = prod.cantidadSolicitada;
      let stockActualProducto = prod.stock_total;

      // Obtener y bloquear los lotes vigentes no vencidos según orden de ingreso (FIFO)
      const [lotesValidos] = await conn.query(
        `SELECT id_lote, numero_lote, cantidad_disponible, costo_unitario, fecha_ingreso, fecha_vencimiento,
                DATEDIFF(fecha_vencimiento, CURDATE()) AS dias_para_vencer
         FROM lotes 
         WHERE id_producto = ? AND cantidad_disponible > 0 AND fecha_vencimiento >= CURDATE()
         ORDER BY fecha_ingreso ASC 
         FOR UPDATE`,
        [prod.id_producto]
      );

      const stockDisponibleVigente = lotesValidos.reduce((acc, l) => acc + l.cantidad_disponible, 0);

      if (stockDisponibleVigente < restante) {
        throw new Error(
          `Bloqueo por Semáforo / Stock: No hay suficiente inventario vigente para "${prod.nombre}". ` +
          `Demanda: ${restante} unidad(es), Stock vigente disponible: ${stockDisponibleVigente} unidad(es). ` +
          `Lotes restantes vencidos o no existentes.`
        );
      }

      // Consumir iterativamente los lotes PEPS
      for (const lote of lotesValidos) {
        if (restante <= 0) break;

        const aDescontar = Math.min(lote.cantidad_disponible, restante);
        const nuevoDisponibleLote = lote.cantidad_disponible - aDescontar;
        const nuevoEstadoLote = nuevoDisponibleLote === 0 ? 'Agotado' : 'Vigente';

        // 7.1. Actualizar Lote
        await conn.query(
          `UPDATE lotes 
           SET cantidad_disponible = ?, estado_lote = ?
           WHERE id_lote = ?`,
          [nuevoDisponibleLote, nuevoEstadoLote, lote.id_lote]
        );

        // 7.2. Cálculo de IVA para la línea del tramo
        let valorIvaTramo = 0;
        if (prod.tarifa_iva === '19') {
          valorIvaTramo = prod.precio_base * aDescontar * 0.19;
        } else if (prod.tarifa_iva === '5') {
          valorIvaTramo = prod.precio_base * aDescontar * 0.05;
        }
        const subtotalTramo = prod.precio_base * aDescontar;

        // 7.3. Insertar Detalle de Venta asociando el lote y su costo histórico
        await conn.query(
          `INSERT INTO detalle_ventas 
           (id_venta, id_producto, id_lote, costo_unitario_compra, cantidad, precio_unitario_base, tarifa_iva_aplicada, valor_iva_linea, subtotal_linea)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id_venta,
            prod.id_producto,
            lote.id_lote,
            lote.costo_unitario,
            aDescontar,
            prod.precio_base,
            prod.tarifa_iva,
            Number(valorIvaTramo.toFixed(2)),
            Number(subtotalTramo.toFixed(2))
          ]
        );

        // 7.4. Calcular saldo contable resultante y asentar en Kardex PEPS
        stockActualProducto -= aDescontar;
        const costoTotalTramo = aDescontar * lote.costo_unitario;
        const utilidadTramo = subtotalTramo - costoTotalTramo;

        await conn.query(
          `INSERT INTO kardex_movimientos 
           (id_producto, id_lote, id_usuario, tipo_movimiento, cantidad, costo_unitario, costo_total, saldo_stock_resultante, motivo_observacion)
           VALUES (?, ?, ?, 'Salida por Venta PEPS', ?, ?, ?, ?, ?)`,
          [
            prod.id_producto,
            lote.id_lote,
            id_usuario,
            aDescontar,
            lote.costo_unitario,
            Number(costoTotalTramo.toFixed(2)),
            stockActualProducto,
            `Venta ${numeroFactura} (Lote: ${lote.numero_lote}, Costo: $${Number(lote.costo_unitario).toFixed(2)})`
          ]
        );

        tramosDetalleVenta.push({
          id_producto: prod.id_producto,
          nombre: prod.nombre,
          lote: lote.numero_lote,
          cantidad: aDescontar,
          costo_unitario_compra: Number(lote.costo_unitario),
          costo_total_peps: Number(costoTotalTramo.toFixed(2)),
          precio_base: Number(prod.precio_base),
          tarifa_iva: Number(prod.tarifa_iva || 0),
          iva: Number(valorIvaTramo.toFixed(2)),
          subtotal: Number(subtotalTramo.toFixed(2)),
          utilidad_tramo: Number(utilidadTramo.toFixed(2))
        });

        restante -= aDescontar;
      }

      // 7.5. Actualizar stock_total en la tabla `productos`
      await conn.query(
        `UPDATE productos SET stock_total = ? WHERE id_producto = ?`,
        [stockActualProducto, prod.id_producto]
      );
    }

    const costoTotalPeps = tramosDetalleVenta.reduce((acc, t) => acc + t.costo_total_peps, 0);
    const totalVentaBase = Number(liquidacionFiscal.subtotal_base || 0);
    const utilidadNeta = Number((totalVentaBase - costoTotalPeps).toFixed(2));

    return {
      id_venta,
      numero_factura: numeroFactura,
      cliente: cliente.nombre_completo,
      cedula_nit: cliente.cedula_nit,
      fecha: fechaStr,
      hora: horaStr,
      metodo_pago,
      liquidacion: liquidacionFiscal,
      cufe,
      qr_data: qrData,
      total_venta: totalVentaBase,
      costo_peps: Number(costoTotalPeps.toFixed(2)),
      utilidad_neta: utilidadNeta,
      tramos: tramosDetalleVenta
    };
  }
}

module.exports = PepsService;
