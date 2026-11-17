const pool = require('../config/db');

/**
 * Servicio de Inventarios, Valoración PEPS, Semáforo de Vencimiento y Mermas/Bajas
 */
class InventarioService {
  /**
   * Obtiene las métricas clave para el Dashboard corporativo
   */
  static async obtenerMetricasDashboard() {
    const [[ventasHoy]] = await pool.query(
      `SELECT IFNULL(SUM(total_pagar), 0) AS total_ventas, COUNT(id_venta) AS num_transacciones 
       FROM ventas_facturas WHERE DATE(fecha_venta) = CURDATE()`
    );

    const [[inventarioValor]] = await pool.query(
      `SELECT IFNULL(SUM(cantidad_disponible * costo_unitario), 0) AS valor_inventario,
              IFNULL(SUM(cantidad_disponible), 0) AS total_unidades
       FROM lotes WHERE cantidad_disponible > 0 AND estado_lote != 'Dado de Baja'`
    );

    const [[semaforo]] = await pool.query(
      `SELECT 
         COUNT(CASE WHEN DATEDIFF(fecha_vencimiento, CURDATE()) < 0 THEN 1 END) AS rojos,
         COUNT(CASE WHEN DATEDIFF(fecha_vencimiento, CURDATE()) BETWEEN 0 AND 30 THEN 1 END) AS amarillos,
         COUNT(CASE WHEN DATEDIFF(fecha_vencimiento, CURDATE()) > 30 THEN 1 END) AS verdes
       FROM lotes 
       WHERE cantidad_disponible > 0 AND estado_lote != 'Dado de Baja'`
    );

    const [[bajasKardex]] = await pool.query(
      `SELECT IFNULL(SUM(costo_total), 0) AS perdidas_caducidad,
              COUNT(id_movimiento) AS total_eventos_baja
       FROM kardex_movimientos 
       WHERE tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño')`
    );

    // Métricas Contables PEPS: Ingreso base real, costo histórico de lotes y utilidad neta
    const [[utilidadPeps]] = await pool.query(
      `SELECT IFNULL(SUM(dv.subtotal_linea), 0) AS total_venta_base,
              IFNULL(SUM(dv.cantidad * dv.costo_unitario_compra), 0) AS costo_peps,
              IFNULL(SUM(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra)), 0) AS utilidad_neta
       FROM detalle_ventas dv`
    );

    const [[utilidadHoy]] = await pool.query(
      `SELECT IFNULL(SUM(dv.subtotal_linea), 0) AS total_venta_base_hoy,
              IFNULL(SUM(dv.cantidad * dv.costo_unitario_compra), 0) AS costo_peps_hoy,
              IFNULL(SUM(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra)), 0) AS utilidad_neta_hoy
       FROM detalle_ventas dv
       JOIN ventas_facturas vf ON dv.id_venta = vf.id_venta
       WHERE DATE(vf.fecha_venta) = CURDATE()`
    );

    // KPI: Lotes próximos a vencer en 7 días o menos
    const [[vencen7d]] = await pool.query(
      `SELECT COUNT(id_lote) AS total_vencen_7d
       FROM lotes 
       WHERE cantidad_disponible > 0 
         AND estado_lote != 'Dado de Baja'
         AND DATEDIFF(fecha_vencimiento, CURDATE()) BETWEEN 0 AND 7`
    );

    // KPI: Productos con Stock Crítico (stock_total <= stock_minimo o 0)
    const [[stockCritico]] = await pool.query(
      `SELECT COUNT(id_producto) AS total_stock_critico
       FROM productos 
       WHERE estado = 'Activo' AND (stock_total <= stock_minimo OR stock_total = 0)`
    );

    // Gráfica Dashboard 1: Ingresos de los últimos 30 días
    const [ingresos30d] = await pool.query(
      `SELECT 
         DATE_FORMAT(fecha_venta, '%Y-%m-%d') AS fecha,
         IFNULL(SUM(total_pagar), 0) AS ingresos,
         COUNT(id_venta) AS transacciones
       FROM ventas_facturas
       WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE_FORMAT(fecha_venta, '%Y-%m-%d')
       ORDER BY fecha ASC`
    );

    // Gráfica Dashboard 2: Horas pico de ventas
    const [horasPico] = await pool.query(
      `SELECT 
         HOUR(fecha_venta) AS hora,
         COUNT(id_venta) AS transacciones,
         IFNULL(SUM(total_pagar), 0) AS ingresos
       FROM ventas_facturas
       WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY HOUR(fecha_venta)
       ORDER BY hora ASC`
    );

    // Lista de Próximos Vencimientos y Alertas de Inventario
    const [proximosVencimientos] = await pool.query(
      `SELECT 
         l.id_lote,
         p.id_producto,
         p.nombre AS producto,
         p.codigo_barras,
         l.numero_lote,
         l.cantidad_disponible,
         l.costo_unitario,
         DATE_FORMAT(l.fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
         DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
         CASE 
           WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) < 0 THEN 'CADUCADO'
           WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 7 THEN 'CRITICO'
           WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 8 AND 30 THEN 'PROXIMO'
           ELSE 'VIGENTE'
         END AS estado_alerta
       FROM lotes l
       JOIN productos p ON l.id_producto = p.id_producto
       WHERE l.cantidad_disponible > 0 AND l.estado_lote != 'Dado de Baja'
         AND DATEDIFF(l.fecha_vencimiento, CURDATE()) <= 30
       ORDER BY l.fecha_vencimiento ASC
       LIMIT 8`
    );

    return {
      ventas_hoy: Number(ventasHoy.total_ventas),
      transacciones_hoy: Number(ventasHoy.num_transacciones),
      valor_inventario: Number(inventarioValor.valor_inventario),
      unidades_bodega: Number(inventarioValor.total_unidades),
      semaforo: {
        rojos: Number(semaforo.rojos || 0),
        amarillos: Number(semaforo.amarillos || 0),
        verdes: Number(semaforo.verdes || 0)
      },
      perdidas_bajas: Number(bajasKardex.perdidas_caducidad),
      total_eventos_baja: Number(bajasKardex.total_eventos_baja),
      // Métricas PEPS
      total_venta: Number(utilidadPeps.total_venta_base),
      costo_peps: Number(utilidadPeps.costo_peps),
      utilidad_neta: Number(utilidadPeps.utilidad_neta),
      utilidad_hoy: Number(utilidadHoy.utilidad_neta_hoy),
      costo_peps_hoy: Number(utilidadHoy.costo_peps_hoy),
      // Nuevos KPIs ejecutivos
      por_vencer_7_dias: Number(vencen7d?.total_vencen_7d || 0),
      stock_critico: Number(stockCritico?.total_stock_critico || 0),
      serie_ultimos_30_dias: ingresos30d.map(r => ({
        fecha: r.fecha,
        ingresos: Number(r.ingresos || 0),
        transacciones: Number(r.transacciones || 0)
      })),
      horas_pico: horasPico.map(r => ({
        hora: Number(r.hora),
        transacciones: Number(r.transacciones || 0),
        ingresos: Number(r.ingresos || 0)
      })),
      proximos_vencimientos: proximosVencimientos.map(r => ({
        ...r,
        cantidad_disponible: Number(r.cantidad_disponible || 0),
        costo_unitario: Number(r.costo_unitario || 0),
        dias_para_vencer: Number(r.dias_para_vencer || 0)
      }))
    };
  }

  /**
   * Consulta el catálogo de productos enriquecido con su semáforo de alerta temprana
   */
  static async obtenerProductosConSemaforo() {
    const [productos] = await pool.query(
      `SELECT 
         p.id_producto,
         p.codigo_barras,
         p.nombre,
         p.id_categoria,
         c.nombre_categoria,
         IFNULL(c.margen_defecto, 30.00) AS categoria_margen_defecto,
         IFNULL(p.margen_ganancia, IFNULL(c.margen_defecto, 30.00)) AS margen_ganancia,
         p.precio_base,
         p.tarifa_iva,
         p.precio_venta_final,
         p.stock_total,
         p.stock_minimo,
         IFNULL((
           SELECT MIN(DATEDIFF(l.fecha_vencimiento, CURDATE()))
           FROM lotes l 
           WHERE l.id_producto = p.id_producto AND l.cantidad_disponible > 0 AND l.estado_lote != 'Dado de Baja'
         ), 999) AS dias_minimos_vencer,
         IFNULL((
           SELECT SUM(l.cantidad_disponible)
           FROM lotes l
           WHERE l.id_producto = p.id_producto AND l.cantidad_disponible > 0 AND l.fecha_vencimiento >= CURDATE() AND l.estado_lote != 'Dado de Baja'
         ), 0) AS stock_vigente_no_vencido,
         IFNULL((
           SELECT MAX(l.costo_unitario)
           FROM lotes l 
           WHERE l.id_producto = p.id_producto AND l.cantidad_disponible > 0 AND l.estado_lote != 'Dado de Baja'
         ), IFNULL((
           SELECT l.costo_unitario 
           FROM lotes l 
           WHERE l.id_producto = p.id_producto 
           ORDER BY l.fecha_ingreso DESC, l.id_lote DESC 
           LIMIT 1
         ), 0)) AS costo_lote_vigente,
         IFNULL((
           SELECT l.costo_unitario 
           FROM lotes l 
           WHERE l.id_producto = p.id_producto 
           ORDER BY l.fecha_ingreso DESC, l.id_lote DESC 
           LIMIT 1
         ), 0) AS ultimo_costo_compra
       FROM productos p
       LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
       WHERE p.estado = 'Activo'
       ORDER BY p.nombre ASC`
    );

    return productos.map(prod => {
      const dias = Number(prod.dias_minimos_vencer);
      const stockVigente = Number(prod.stock_vigente_no_vencido);
      const ultimoCosto = Number(prod.ultimo_costo_compra || 0);

      let estadoSemaforo = 'VERDE';
      let bloqueadoPOS = false;

      if (stockVigente <= 0) {
        estadoSemaforo = 'ROJO';
        bloqueadoPOS = true;
      } else if (dias < 0) {
        // Tiene existencias vencidas
        estadoSemaforo = 'ROJO';
        bloqueadoPOS = stockVigente === 0;
      } else if (dias >= 0 && dias <= 30) {
        estadoSemaforo = 'AMARILLO';
      }

      return {
        ...prod,
        dias_minimos_vencer: dias,
        stock_vigente_no_vencido: stockVigente,
        ultimo_costo_compra: ultimoCosto,
        estado_semaforo: estadoSemaforo,
        bloqueado_pos: bloqueadoPOS
      };
    });
  }

  /**
   * Obtiene la trazabilidad detallada de lotes y su clasificación de semáforo
   */
  static async obtenerLotesDetallados() {
    const [lotes] = await pool.query(
      `SELECT 
         l.id_lote,
         p.id_producto,
         p.nombre AS producto,
         p.codigo_barras,
         l.numero_lote,
         l.cantidad_inicial,
         l.cantidad_disponible,
         l.costo_unitario,
         DATE_FORMAT(l.fecha_ingreso, '%Y-%m-%d %H:%i') AS fecha_ingreso,
         DATE_FORMAT(l.fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
         DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_para_vencer,
         CASE 
           WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) < 0 THEN 'ROJO'
           WHEN DATEDIFF(l.fecha_vencimiento, CURDATE()) BETWEEN 0 AND 30 THEN 'AMARILLO'
           ELSE 'VERDE'
         END AS semaforo,
         l.estado_lote
       FROM lotes l
       JOIN productos p ON l.id_producto = p.id_producto
       WHERE l.cantidad_disponible > 0
       ORDER BY l.fecha_vencimiento ASC, l.fecha_ingreso ASC`
    );
    return lotes;
  }

  /**
   * Ejecuta la baja contable de mercancía caducada o dañada dentro de una transacción
   */
  static async registrarBajaInventario(conn, { id_lote, id_usuario, cantidad, motivo, tipo_movimiento = 'Salida por Baja de Caducidad' }) {
    const cantBaja = parseInt(cantidad, 10);
    if (isNaN(cantBaja) || cantBaja <= 0) {
      throw new Error('La cantidad a dar de baja debe ser un número entero mayor a cero.');
    }

    // 1. Bloqueo pesimista del lote
    const [[lote]] = await conn.query(
      `SELECT id_lote, id_producto, numero_lote, cantidad_disponible, costo_unitario, fecha_vencimiento 
       FROM lotes 
       WHERE id_lote = ? 
       FOR UPDATE`,
      [id_lote]
    );

    if (!lote) {
      throw new Error(`El lote con ID ${id_lote} no existe.`);
    }

    if (lote.cantidad_disponible < cantBaja) {
      throw new Error(`La cantidad a dar de baja (${cantBaja}) excede el saldo disponible del lote (${lote.cantidad_disponible}).`);
    }

    // 2. Bloqueo pesimista del producto
    const [[prod]] = await conn.query(
      `SELECT id_producto, nombre, stock_total FROM productos WHERE id_producto = ? FOR UPDATE`,
      [lote.id_producto]
    );

    const nuevoDisponibleLote = lote.cantidad_disponible - cantBaja;
    const nuevoEstadoLote = nuevoDisponibleLote === 0 ? 'Dado de Baja' : 'Vigente';

    // 3. Actualizar Lote
    await conn.query(
      `UPDATE lotes SET cantidad_disponible = ?, estado_lote = ? WHERE id_lote = ?`,
      [nuevoDisponibleLote, nuevoEstadoLote, lote.id_lote]
    );

    // 4. Actualizar Stock del Producto
    const nuevoStockTotal = Math.max(0, prod.stock_total - cantBaja);
    await conn.query(
      `UPDATE productos SET stock_total = ? WHERE id_producto = ?`,
      [nuevoStockTotal, prod.id_producto]
    );

    // 5. Asiento Contable en Kardex
    const costoTotalBaja = cantBaja * lote.costo_unitario;
    const observacion = motivo && motivo.trim().length > 0 
      ? motivo.trim() 
      : `Baja contable por caducidad (Lote ${lote.numero_lote})`;

    await conn.query(
      `INSERT INTO kardex_movimientos 
       (id_producto, id_lote, id_usuario, tipo_movimiento, cantidad, costo_unitario, costo_total, saldo_stock_resultante, motivo_observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.id_producto,
        lote.id_lote,
        id_usuario,
        tipo_movimiento,
        cantBaja,
        lote.costo_unitario,
        Number(costoTotalBaja.toFixed(2)),
        nuevoStockTotal,
        observacion
      ]
    );

    return {
      id_lote: lote.id_lote,
      producto: prod.nombre,
      numero_lote: lote.numero_lote,
      cantidad_baja: cantBaja,
      costo_unitario: lote.costo_unitario,
      perdida_economica: Number(costoTotalBaja.toFixed(2)),
      saldo_lote_restante: nuevoDisponibleLote,
      saldo_producto_restante: nuevoStockTotal
    };
  }

  /**
   * Registra una novedad de inventario (Devolución en buen estado o Cambio por avería/defecto)
   * garantizando transacciones ACID.
   */
  static async registrarNovedadInventario(conn, { id_producto, id_lote, id_usuario, cantidad, tipo_novedad, motivo }) {
    const cant = parseInt(cantidad, 10);
    if (isNaN(cant) || cant <= 0) {
      throw new Error('La cantidad debe ser un número entero mayor a cero.');
    }

    if (!tipo_novedad || !['DEVOLUCION_BUEN_ESTADO', 'CAMBIO_AVERIA_DEFECTO'].includes(tipo_novedad)) {
      throw new Error('El tipo de novedad debe ser DEVOLUCION_BUEN_ESTADO o CAMBIO_AVERIA_DEFECTO.');
    }

    // 1. Bloqueo pesimista del lote
    const [[lote]] = await conn.query(
      'SELECT id_lote, id_producto, numero_lote, cantidad_inicial, cantidad_disponible, costo_unitario, estado_lote FROM lotes WHERE id_lote = ? FOR UPDATE',
      [id_lote]
    );

    if (!lote) {
      throw new Error(`El lote ID ${id_lote} no existe.`);
    }

    // 2. Bloqueo pesimista del producto
    const [[prod]] = await conn.query(
      'SELECT id_producto, nombre, stock_total FROM productos WHERE id_producto = ? FOR UPDATE',
      [lote.id_producto]
    );

    if (!prod) {
      throw new Error(`El producto ID ${lote.id_producto} no existe.`);
    }

    let nuevoDisponibleLote = lote.cantidad_disponible;
    let nuevoEstadoLote = lote.estado_lote;
    let nuevoStockProducto = prod.stock_total;
    let tipoMovimientoKardex = '';
    let observacion = '';
    const costoTotal = cant * lote.costo_unitario;

    if (tipo_novedad === 'DEVOLUCION_BUEN_ESTADO') {
      // Cliente devuelve producto intacto: reingreso a lote y stock
      nuevoDisponibleLote += cant;
      nuevoEstadoLote = 'Vigente';
      nuevoStockProducto += cant;
      tipoMovimientoKardex = 'Entrada por Devolución Cliente';
      observacion = motivo && motivo.trim() 
        ? `Devolución Cliente (Buen Estado): ${motivo.trim()} - Lote: ${lote.numero_lote}` 
        : `Devolución de cliente en buen estado - Lote: ${lote.numero_lote}`;

      await conn.query(
        'UPDATE lotes SET cantidad_disponible = ?, estado_lote = ? WHERE id_lote = ?',
        [nuevoDisponibleLote, nuevoEstadoLote, lote.id_lote]
      );

      await conn.query(
        'UPDATE productos SET stock_total = ? WHERE id_producto = ?',
        [nuevoStockProducto, prod.id_producto]
      );
    } else {
      // CAMBIO_AVERIA_DEFECTO: salida por avería/daño
      if (lote.cantidad_disponible < cant) {
        throw new Error(`La cantidad para avería (${cant}) supera el saldo disponible del lote (${lote.cantidad_disponible}).`);
      }

      nuevoDisponibleLote -= cant;
      nuevoEstadoLote = nuevoDisponibleLote === 0 ? 'Dado de Baja' : lote.estado_lote;
      nuevoStockProducto = Math.max(0, prod.stock_total - cant);
      tipoMovimientoKardex = 'Salida por Daño';
      observacion = motivo && motivo.trim() 
        ? `Baja por Avería/Defecto: ${motivo.trim()} - Lote: ${lote.numero_lote}` 
        : `Salida de inventario por avería/daño de producto - Lote: ${lote.numero_lote}`;

      await conn.query(
        'UPDATE lotes SET cantidad_disponible = ?, estado_lote = ? WHERE id_lote = ?',
        [nuevoDisponibleLote, nuevoEstadoLote, lote.id_lote]
      );

      await conn.query(
        'UPDATE productos SET stock_total = ? WHERE id_producto = ?',
        [nuevoStockProducto, prod.id_producto]
      );
    }

    // 3. Registrar asiento contable en kardex_movimientos
    await conn.query(
      `INSERT INTO kardex_movimientos 
       (id_producto, id_lote, id_usuario, tipo_movimiento, cantidad, costo_unitario, costo_total, saldo_stock_resultante, motivo_observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.id_producto,
        lote.id_lote,
        id_usuario || 1,
        tipoMovimientoKardex,
        cant,
        lote.costo_unitario,
        Number(costoTotal.toFixed(2)),
        nuevoStockProducto,
        observacion
      ]
    );

    return {
      id_producto: prod.id_producto,
      producto: prod.nombre,
      id_lote: lote.id_lote,
      numero_lote: lote.numero_lote,
      tipo_novedad,
      tipo_movimiento_kardex: tipoMovimientoKardex,
      cantidad: cant,
      costo_unitario: lote.costo_unitario,
      costo_total: Number(costoTotal.toFixed(2)),
      saldo_lote_disponible: nuevoDisponibleLote,
      stock_total_resultante: nuevoStockProducto
    };
  }
}

module.exports = InventarioService;
