/**
 * Servicio de Entrada de Mercancías, Recepción Formal y Creación de Lotes
 */
class ComprasService {
  /**
   * Registra una compra y crea los lotes asociados garantizando consistencia contable
   * @param {Object} conn - Conexión activa MySQL transaccional
   * @param {Object} datos - { id_proveedor, id_usuario, productos_comprados }
   */
  static async registrarCompraYLotes(conn, datos) {
    const { id_proveedor, id_usuario, productos_comprados } = datos;

    if (!productos_comprados || productos_comprados.length === 0) {
      throw new Error('Debe especificar al menos un producto para la recepción de compra.');
    }

    // 1. Validar proveedor
    const [[proveedor]] = await conn.query(
      `SELECT id_proveedor, razon_social, nit FROM proveedores WHERE id_proveedor = ? AND estado = 'Activo'`,
      [id_proveedor]
    );

    if (!proveedor) {
      throw new Error(`Proveedor ID ${id_proveedor} no encontrado o inactivo.`);
    }

    // 2. Calcular total de la compra y validar ítems
    let totalCompra = 0;
    for (const item of productos_comprados) {
      const cant = parseInt(item.cantidad, 10);
      const costo = parseFloat(item.costo_unitario);
      if (isNaN(cant) || cant <= 0) {
        throw new Error(`Cantidad inválida para producto ID ${item.id_producto}`);
      }
      if (isNaN(costo) || costo <= 0) {
        throw new Error(`Costo unitario inválido para producto ID ${item.id_producto}`);
      }
      if (!item.fecha_vencimiento) {
        throw new Error(`La fecha de vencimiento es obligatoria para el producto ID ${item.id_producto}`);
      }
      if (!item.numero_lote || item.numero_lote.trim().length === 0) {
        throw new Error(`El número de lote es obligatorio para el producto ID ${item.id_producto}`);
      }
      totalCompra += (cant * costo);
    }

    // 3. Insertar Cabecera de Compra
    const [resCompra] = await conn.query(
      `INSERT INTO compras (id_proveedor, id_usuario, total_compra) VALUES (?, ?, ?)`,
      [proveedor.id_proveedor, id_usuario, Number(totalCompra.toFixed(2))]
    );
    const id_compra = resCompra.insertId;

    const lotesCreados = [];

    // 4. Procesar cada producto, crear lote, registrar detalle y asentar Kardex
    for (const item of productos_comprados) {
      const cant = parseInt(item.cantidad, 10);
      const costo = parseFloat(item.costo_unitario);

      // Bloqueo pesimista del producto
      const [[prod]] = await conn.query(
        `SELECT id_producto, nombre, stock_total, precio_base, tarifa_iva, 
                IFNULL(margen_ganancia, 30.00) AS margen_ganancia 
         FROM productos WHERE id_producto = ? FOR UPDATE`,
        [item.id_producto]
      );

      if (!prod) {
        throw new Error(`Producto ID ${item.id_producto} no existe.`);
      }

      // 4.1. Crear el nuevo lote
      const [resLote] = await conn.query(
        `INSERT INTO lotes 
         (id_producto, id_compra, numero_lote, cantidad_inicial, cantidad_disponible, costo_unitario, fecha_vencimiento, estado_lote)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Vigente')`,
        [
          prod.id_producto,
          id_compra,
          item.numero_lote.trim().toUpperCase(),
          cant,
          cant,
          costo,
          item.fecha_vencimiento
        ]
      );
      const id_lote = resLote.insertId;

      // 4.2. Registrar en detalle_compras
      const subtotalItem = cant * costo;
      await conn.query(
        `INSERT INTO detalle_compras (id_compra, id_producto, id_lote, cantidad, costo_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_compra, prod.id_producto, id_lote, cant, costo, Number(subtotalItem.toFixed(2))]
      );

      // 4.3. Calcular nuevo saldo resultante contable
      const nuevoStockTotal = prod.stock_total + cant;

      // 4.4. Asentar en Kardex Movimientos
      await conn.query(
        `INSERT INTO kardex_movimientos 
         (id_producto, id_lote, id_usuario, tipo_movimiento, cantidad, costo_unitario, costo_total, saldo_stock_resultante, motivo_observacion)
         VALUES (?, ?, ?, 'Entrada por Compra', ?, ?, ?, ?, ?)`,
        [
          prod.id_producto,
          id_lote,
          id_usuario,
          cant,
          costo,
          Number(subtotalItem.toFixed(2)),
          nuevoStockTotal,
          `Compra Ref #${id_compra} - Proveedor: ${proveedor.razon_social} (Lote: ${item.numero_lote.trim().toUpperCase()})`
        ]
      );

      // 4.5. Actualizar stock_total en productos
      await conn.query(
        `UPDATE productos SET stock_total = ? WHERE id_producto = ?`,
        [nuevoStockTotal, prod.id_producto]
      );

      // 4.6. Regla de Margen Automático y Protección de Reposición (Anti-Pérdidas)
      const margenProd = parseFloat(prod.margen_ganancia) || 30.00;
      let tasaIva = 0;
      if (String(prod.tarifa_iva) === '19') tasaIva = 0.19;
      else if (String(prod.tarifa_iva) === '5') tasaIva = 0.05;

      const precioBaseSugerido = Number((costo * (1 + (margenProd / 100))).toFixed(2));
      const precioBaseActual = parseFloat(prod.precio_base) || 0;
      let precioActualizado = false;

      // Si el costo nuevo empuja un precio base mayor o si se solicita forzar precio
      if (precioBaseSugerido > precioBaseActual || item.forzar_precio) {
        const nuevoPrecioBase = precioBaseSugerido;
        const nuevoPvp = Number((nuevoPrecioBase * (1 + tasaIva)).toFixed(2));
        await conn.query(
          `UPDATE productos SET precio_base = ?, precio_venta_final = ? WHERE id_producto = ?`,
          [nuevoPrecioBase, nuevoPvp, prod.id_producto]
        );
        precioActualizado = true;
      }

      lotesCreados.push({
        id_lote,
        id_producto: prod.id_producto,
        producto: prod.nombre,
        numero_lote: item.numero_lote.trim().toUpperCase(),
        cantidad: cant,
        costo_unitario: costo,
        fecha_vencimiento: item.fecha_vencimiento,
        stock_resultante: nuevoStockTotal,
        precio_actualizado: precioActualizado,
        precio_base_anterior: precioBaseActual,
        precio_base_nuevo: precioActualizado ? precioBaseSugerido : precioBaseActual
      });
    }

    return {
      id_compra,
      proveedor: proveedor.razon_social,
      total_compra: Number(totalCompra.toFixed(2)),
      lotes: lotesCreados
    };
  }
}

module.exports = ComprasService;
