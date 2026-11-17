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
               DATE_FORMAT(km.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha,
               CASE 
                 WHEN km.tipo_movimiento = 'Salida por Venta PEPS' THEN IFNULL(dv.subtotal_linea, p.precio_base * km.cantidad)
                 ELSE NULL 
               END AS total_venta,
               CASE 
                 WHEN km.tipo_movimiento = 'Salida por Venta PEPS' THEN km.costo_total
                 ELSE NULL 
               END AS costo_peps,
               CASE 
                 WHEN km.tipo_movimiento = 'Salida por Venta PEPS' THEN ROUND(IFNULL(dv.subtotal_linea, p.precio_base * km.cantidad) - km.costo_total, 2)
                 ELSE NULL 
               END AS utilidad_neta
        FROM kardex_movimientos km
        JOIN productos p ON km.id_producto = p.id_producto
        JOIN lotes l ON km.id_lote = l.id_lote
        JOIN usuarios u ON km.id_usuario = u.id_usuario
        LEFT JOIN ventas_facturas vf ON vf.numero_factura = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(km.motivo_observacion, ' (', 1), 'Venta ', -1))
        LEFT JOIN detalle_ventas dv ON dv.id_venta = vf.id_venta AND dv.id_lote = km.id_lote AND dv.id_producto = km.id_producto
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

  /**
   * Reporte Gerencial Ejecutivo Consolidado (Filtros por Fecha)
   * KPIs, Serie Diaria para Gráficas, Recaudo por Método y Top Productos Rentables
   */
  static async obtenerReportesGerenciales(req, res) {
    try {
      let { desde, hasta } = req.query;

      // Por defecto últimos 30 días
      if (!hasta) {
        const d = new Date();
        hasta = d.toISOString().slice(0, 10);
      }
      if (!desde) {
        const d = new Date(hasta);
        d.setDate(d.getDate() - 30);
        desde = d.toISOString().slice(0, 10);
      }

      // 1. KPIs Generales en el periodo (Consulta directa a ventas_facturas para evitar duplicación por JOIN)
      const [[kpisVentas]] = await pool.query(
        `SELECT 
           IFNULL(SUM(total_pagar), 0) AS total_ingresos,
           COUNT(id_venta) AS cantidad_ventas
         FROM ventas_facturas
         WHERE DATE(fecha_venta) BETWEEN ? AND ?`,
        [desde, hasta]
      );

      const [[kpisDetalle]] = await pool.query(
        `SELECT 
           IFNULL(SUM(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra)), 0) AS utilidad_neta_peps,
           IFNULL(SUM(dv.cantidad), 0) AS unidades_vendidas
         FROM detalle_ventas dv
         JOIN ventas_facturas vf ON dv.id_venta = vf.id_venta
         WHERE DATE(vf.fecha_venta) BETWEEN ? AND ?`,
        [desde, hasta]
      );

      const [[kpisMermas]] = await pool.query(
        `SELECT IFNULL(SUM(costo_total), 0) AS total_mermas
         FROM kardex_movimientos
         WHERE tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño')
           AND DATE(fecha_movimiento) BETWEEN ? AND ?`,
        [desde, hasta]
      );

      const totalIngresos = Number(Number(kpisVentas?.total_ingresos || 0).toFixed(2));
      const cantVentas = Number(kpisVentas?.cantidad_ventas || 0);
      const utilidadPeps = Number(Number(kpisDetalle?.utilidad_neta_peps || 0).toFixed(2));
      const unidadesVendidas = Number(kpisDetalle?.unidades_vendidas || 0);
      const totalMermas = Number(Number(kpisMermas?.total_mermas || 0).toFixed(2));
      const ticketPromedio = cantVentas > 0 ? Number((totalIngresos / cantVentas).toFixed(2)) : 0;

      // 2. Serie diaria en el periodo (Agrupación limpia de ingresos y utilidad sin duplicidad)
      const [serieDiariaRaw] = await pool.query(
        `SELECT 
           v.fecha,
           v.ingresos,
           v.transacciones,
           IFNULL(u.utilidad, 0) AS utilidad
         FROM (
           SELECT 
             DATE_FORMAT(fecha_venta, '%Y-%m-%d') AS fecha,
             IFNULL(SUM(total_pagar), 0) AS ingresos,
             COUNT(id_venta) AS transacciones
           FROM ventas_facturas
           WHERE DATE(fecha_venta) BETWEEN ? AND ?
           GROUP BY DATE_FORMAT(fecha_venta, '%Y-%m-%d')
         ) v
         LEFT JOIN (
           SELECT 
             DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d') AS fecha,
             IFNULL(SUM(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra)), 0) AS utilidad
           FROM detalle_ventas dv
           JOIN ventas_facturas vf ON dv.id_venta = vf.id_venta
           WHERE DATE(vf.fecha_venta) BETWEEN ? AND ?
           GROUP BY DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d')
         ) u ON v.fecha = u.fecha
         ORDER BY v.fecha ASC`,
        [desde, hasta, desde, hasta]
      );

      const serieDiaria = serieDiariaRaw.map(r => ({
        fecha: r.fecha,
        ingresos: Number(Number(r.ingresos || 0).toFixed(2)),
        utilidad: Number(Number(r.utilidad || 0).toFixed(2)),
        transacciones: Number(r.transacciones || 0)
      }));

      // 3. Por Método de Pago (Misma tabla ventas_facturas, mismo filtro WHERE y misma columna total_pagar)
      const [metodosRaw] = await pool.query(
        `SELECT 
           TRIM(IFNULL(metodo_pago, 'Efectivo')) AS metodo_pago,
           IFNULL(SUM(total_pagar), 0) AS total,
           COUNT(id_venta) AS transacciones
         FROM ventas_facturas
         WHERE DATE(fecha_venta) BETWEEN ? AND ?
         GROUP BY TRIM(IFNULL(metodo_pago, 'Efectivo'))`,
        [desde, hasta]
      );

      // Normalizar nombres con TRIM / LOWER para clasificar todas las operaciones
      const acumulador = {
        'Efectivo': { total: 0, transacciones: 0 },
        'Tarjeta': { total: 0, transacciones: 0 },
        'Transferencia': { total: 0, transacciones: 0 }
      };

      for (const item of metodosRaw) {
        const metodoLower = String(item.metodo_pago || '').trim().toLowerCase();
        const monto = Number(item.total || 0);
        const trans = Number(item.transacciones || 0);

        if (metodoLower.includes('tarjeta') || metodoLower.includes('debito') || metodoLower.includes('credito') || metodoLower.includes('card')) {
          acumulador['Tarjeta'].total += monto;
          acumulador['Tarjeta'].transacciones += trans;
        } else if (metodoLower.includes('transfer') || metodoLower.includes('transf') || metodoLower.includes('nequi') || metodoLower.includes('daviplata') || metodoLower.includes('banc')) {
          acumulador['Transferencia'].total += monto;
          acumulador['Transferencia'].transacciones += trans;
        } else {
          acumulador['Efectivo'].total += monto;
          acumulador['Efectivo'].transacciones += trans;
        }
      }

      const metodosEstandar = ['Efectivo', 'Tarjeta', 'Transferencia'];
      const porMetodoPago = metodosEstandar.map(m => {
        const total = Number(acumulador[m].total.toFixed(2));
        const porcentaje = totalIngresos > 0 ? Number(((total / totalIngresos) * 100).toFixed(1)) : 0;
        return {
          metodo_pago: m,
          total,
          porcentaje,
          transacciones: acumulador[m].transacciones
        };
      });

      // 4. Top 5 Productos más Vendidos / Rentables
      const [topProductosRaw] = await pool.query(
        `SELECT 
           p.id_producto,
           p.nombre,
           p.codigo_barras,
           IFNULL(SUM(dv.cantidad), 0) AS unidades_vendidas,
           IFNULL(SUM(dv.subtotal_linea + dv.valor_iva_linea), 0) AS ingresos_totales,
           IFNULL(SUM(dv.cantidad * dv.costo_unitario_compra), 0) AS costo_peps,
           IFNULL(SUM(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra)), 0) AS utilidad_peps,
           ROUND(AVG(IFNULL(p.margen_ganancia, 30)), 1) AS margen_promedio
         FROM detalle_ventas dv
         JOIN ventas_facturas vf ON dv.id_venta = vf.id_venta
         JOIN productos p ON dv.id_producto = p.id_producto
         WHERE DATE(vf.fecha_venta) BETWEEN ? AND ?
         GROUP BY p.id_producto, p.nombre, p.codigo_barras
         ORDER BY utilidad_peps DESC, unidades_vendidas DESC
         LIMIT 5`,
        [desde, hasta]
      );

      const topProductos = topProductosRaw.map((p, idx) => ({
        posicion: idx + 1,
        id_producto: p.id_producto,
        nombre: p.nombre,
        codigo_barras: p.codigo_barras,
        unidades_vendidas: Number(p.unidades_vendidas || 0),
        ingresos_totales: Number(p.ingresos_totales || 0),
        costo_peps: Number(p.costo_peps || 0),
        utilidad_peps: Number(p.utilidad_peps || 0),
        margen_promedio: Number(p.margen_promedio || 30)
      }));

      res.json({
        ok: true,
        periodo: { desde, hasta },
        kpis: {
          total_ingresos: totalIngresos,
          cantidad_ventas: cantVentas,
          utilidad_neta_peps: utilidadPeps,
          ticket_promedio: ticketPromedio,
          unidades_vendidas: unidadesVendidas,
          total_mermas: totalMermas
        },
        serie_diaria: serieDiaria,
        por_metodo_pago: porMetodoPago,
        top_productos: topProductos
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al generar reporte gerencial: ' + err.message
      });
    }
  }
}

module.exports = ReportesController;
