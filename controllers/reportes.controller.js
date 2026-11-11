const pool = require('../config/db');

/**
 * Controlador de Reportes Contables, Kardex Mayor y Arqueo de Caja
 */
class ReportesController {
  static async obtenerKardex(req, res) {
    const { id_producto, tipo_movimiento, fecha_inicio, fecha_fin, busqueda, limite = 500 } = req.query;

    try {
      let query = `
        SELECT km.id_movimiento,
               km.id_producto,
               p.nombre AS producto,
               p.codigo_barras,
               l.numero_lote,
               u.nombre_completo AS usuario,
               km.tipo_movimiento,
               km.cantidad,
               km.costo_unitario,
               km.costo_total,
               km.saldo_stock_resultante,
               km.motivo_observacion,
               DATE_FORMAT(km.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha
        FROM kardex_movimientos km
        JOIN productos p ON km.id_producto = p.id_producto
        JOIN lotes l ON km.id_lote = l.id_lote
        JOIN usuarios u ON km.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params = [];

      if (id_producto) {
        query += ' AND km.id_producto = ?';
        params.push(id_producto);
      }

      if (tipo_movimiento) {
        query += ' AND km.tipo_movimiento = ?';
        params.push(tipo_movimiento);
      }

      if (fecha_inicio) {
        query += ' AND DATE(km.fecha_movimiento) >= ?';
        params.push(fecha_inicio);
      }

      if (fecha_fin) {
        query += ' AND DATE(km.fecha_movimiento) <= ?';
        params.push(fecha_fin);
      }

      if (busqueda && busqueda.trim()) {
        query += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR l.numero_lote LIKE ? OR km.motivo_observacion LIKE ?)';
        const term = `%${busqueda.trim()}%`;
        params.push(term, term, term, term);
      }

      query += ' ORDER BY km.fecha_movimiento DESC, km.id_movimiento DESC LIMIT ?';
      params.push(parseInt(limite, 10) || 500);

      const [movimientos] = await pool.query(query, params);
      res.json(movimientos);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar libro mayor de Kardex: ' + err.message });
    }
  }

  /**
   * Reporte Consolidado de Devoluciones, Averías, Caducidad y Dinero Perdido
   */
  static async obtenerReporteMermas(req, res) {
    const { tipo, id_producto, fecha_inicio, fecha_fin, busqueda } = req.query;

    try {
      let baseWhere = ` WHERE km.tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño', 'Entrada por Devolución Cliente')`;
      const params = [];

      if (tipo === 'CADUCIDAD' || tipo === 'Salida por Baja de Caducidad') {
        baseWhere += ` AND km.tipo_movimiento = 'Salida por Baja de Caducidad'`;
      } else if (tipo === 'DANO' || tipo === 'Salida por Daño') {
        baseWhere += ` AND km.tipo_movimiento = 'Salida por Daño'`;
      } else if (tipo === 'DEVOLUCION' || tipo === 'Entrada por Devolución Cliente') {
        baseWhere += ` AND km.tipo_movimiento = 'Entrada por Devolución Cliente'`;
      }

      if (id_producto) {
        baseWhere += ' AND km.id_producto = ?';
        params.push(id_producto);
      }

      if (fecha_inicio) {
        baseWhere += ' AND DATE(km.fecha_movimiento) >= ?';
        params.push(fecha_inicio);
      }

      if (fecha_fin) {
        baseWhere += ' AND DATE(km.fecha_movimiento) <= ?';
        params.push(fecha_fin);
      }

      if (busqueda && busqueda.trim()) {
        baseWhere += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR l.numero_lote LIKE ? OR km.motivo_observacion LIKE ?)';
        const term = `%${busqueda.trim()}%`;
        params.push(term, term, term, term);
      }

      // 1. KPI acumulado de dinero perdido en mercancía (solo Bajas y Daños) y eventos
      const [[resumen]] = await pool.query(
        `SELECT IFNULL(SUM(CASE WHEN km.tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño') THEN km.costo_total ELSE 0 END), 0) AS total_dinero_perdido,
                COUNT(km.id_movimiento) AS total_eventos,
                IFNULL(SUM(km.cantidad), 0) AS total_unidades_afectadas
         FROM kardex_movimientos km
         JOIN productos p ON km.id_producto = p.id_producto
         JOIN lotes l ON km.id_lote = l.id_lote
         ${baseWhere}`,
        params
      );

      // 2. Detalle histórico
      const [historial] = await pool.query(
        `SELECT km.id_movimiento,
                p.id_producto,
                p.nombre AS producto,
                p.codigo_barras,
                l.numero_lote,
                u.nombre_completo AS usuario,
                km.tipo_movimiento,
                km.cantidad,
                km.costo_unitario,
                km.costo_total,
                CASE 
                  WHEN km.tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño') THEN km.costo_total 
                  ELSE 0 
                END AS dinero_perdido,
                km.motivo_observacion,
                DATE_FORMAT(km.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha
         FROM kardex_movimientos km
         JOIN productos p ON km.id_producto = p.id_producto
         JOIN lotes l ON km.id_lote = l.id_lote
         JOIN usuarios u ON km.id_usuario = u.id_usuario
         ${baseWhere}
         ORDER BY km.fecha_movimiento DESC, km.id_movimiento DESC`,
        params
      );

      res.json({
        total_dinero_perdido: Number(resumen.total_dinero_perdido || 0),
        total_eventos: Number(resumen.total_eventos || 0),
        total_unidades_afectadas: Number(resumen.total_unidades_afectadas || 0),
        historial
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al generar reporte de novedades y mermas: ' + err.message });
    }
  }

  static async obtenerArqueoCaja(req, res) {
    const { id_usuario } = req.params;
    try {
      // Obtener datos del usuario
      const [[usuario]] = await pool.query(
        'SELECT u.id_usuario, u.nombre_completo, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = ?',
        [id_usuario]
      );

      const [totales] = await pool.query(
        `SELECT metodo_pago, 
                COUNT(id_venta) AS transacciones, 
                IFNULL(SUM(total_pagar), 0) AS total_recaudado,
                IFNULL(SUM(subtotal_base), 0) AS base_total,
                IFNULL(SUM(total_iva_19), 0) AS iva_19_total,
                IFNULL(SUM(total_iva_5), 0) AS iva_5_total
         FROM ventas_facturas
         WHERE id_usuario = ? AND DATE(fecha_venta) = CURDATE()
         GROUP BY metodo_pago`,
        [id_usuario]
      );

      const [[resumenGlobal]] = await pool.query(
        `SELECT COUNT(id_venta) AS total_ventas_dia,
                IFNULL(SUM(total_pagar), 0) AS gran_total,
                IFNULL(SUM(subtotal_base), 0) AS gran_subtotal,
                IFNULL(SUM(total_iva_19 + total_iva_5), 0) AS gran_iva,
                IFNULL(SUM(descuento), 0) AS total_descuentos
         FROM ventas_facturas
         WHERE id_usuario = ? AND DATE(fecha_venta) = CURDATE()`,
        [id_usuario]
      );

      // Normalizar desglose asegurando Efectivo, Tarjeta y Transferencia
      const metodosEstandar = ['Efectivo', 'Tarjeta', 'Transferencia'];
      const desgloseCompleto = metodosEstandar.map(m => {
        const encontrado = totales.find(t => t.metodo_pago === m);
        return {
          metodo_pago: m,
          transacciones: encontrado ? Number(encontrado.transacciones) : 0,
          total_recaudado: encontrado ? Number(encontrado.total_recaudado) : 0,
          base_total: encontrado ? Number(encontrado.base_total) : 0,
          iva_19_total: encontrado ? Number(encontrado.iva_19_total) : 0,
          iva_5_total: encontrado ? Number(encontrado.iva_5_total) : 0
        };
      });

      const totalEfectivo = desgloseCompleto.find(m => m.metodo_pago === 'Efectivo')?.total_recaudado || 0;
      const totalTarjeta = desgloseCompleto.find(m => m.metodo_pago === 'Tarjeta')?.total_recaudado || 0;
      const totalTransferencia = desgloseCompleto.find(m => m.metodo_pago === 'Transferencia')?.total_recaudado || 0;

      res.json({
        usuario: usuario || { id_usuario, nombre_completo: 'Usuario', nombre_rol: 'Cajero' },
        fecha: new Date().toISOString().slice(0, 10),
        resumen: {
          total_ventas_dia: Number(resumenGlobal?.total_ventas_dia || 0),
          gran_total: Number(resumenGlobal?.gran_total || 0),
          gran_subtotal: Number(resumenGlobal?.gran_subtotal || 0),
          gran_iva: Number(resumenGlobal?.gran_iva || 0),
          total_descuentos: Number(resumenGlobal?.total_descuentos || 0),
          total_efectivo: totalEfectivo,
          total_tarjeta: totalTarjeta,
          total_transferencia: totalTransferencia
        },
        desglose_metodos: desgloseCompleto
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al generar arqueo de caja: ' + err.message });
    }
  }
}

module.exports = ReportesController;
