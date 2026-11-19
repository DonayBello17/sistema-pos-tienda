const pool = require('../config/db');
const PepsService = require('../services/peps.service');

/**
 * Controlador de Ventas POS, Facturación Electrónica DIAN y Ejecución Transaccional PEPS
 */
class VentasController {
  static async procesarVenta(req, res) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const resultado = await PepsService.procesarVentaPEPS(conn, req.body);
      await conn.commit();

      res.status(201).json({
        ok: true,
        mensaje: 'Venta procesada con éxito bajo método PEPS e interoperabilidad DIAN',
        data: resultado
      });
    } catch (err) {
      await conn.rollback();
      res.status(400).json({
        ok: false,
        error: err.message
      });
    } finally {
      conn.release();
    }
  }

  static async obtenerClientes(req, res) {
    try {
      const [clientes] = await pool.query(
        'SELECT id_cliente, cedula_nit, nombre_completo, correo, telefono, direccion FROM clientes ORDER BY nombre_completo ASC'
      );
      res.json(clientes);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar clientes: ' + err.message });
    }
  }

  static async crearCliente(req, res) {
    const { cedula_nit, nombre_completo, correo, telefono, direccion } = req.body;

    if (!cedula_nit || !nombre_completo) {
      return res.status(400).json({
        ok: false,
        error: 'Cédula/NIT y Nombre Completo son obligatorios.'
      });
    }

    try {
      const [existentes] = await pool.query(
        'SELECT id_cliente FROM clientes WHERE cedula_nit = ?',
        [cedula_nit.trim()]
      );

      if (existentes.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `Ya existe un cliente con Cédula/NIT ${cedula_nit}.`
        });
      }

      const [resInsert] = await pool.query(
        `INSERT INTO clientes (cedula_nit, nombre_completo, correo, telefono, direccion)
         VALUES (?, ?, ?, ?, ?)`,
        [cedula_nit.trim(), nombre_completo.trim(), correo ? correo.trim() : null, telefono ? telefono.trim() : null, direccion ? direccion.trim() : null]
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Cliente registrado exitosamente.',
        data: {
          id_cliente: resInsert.insertId,
          cedula_nit: cedula_nit.trim(),
          nombre_completo: nombre_completo.trim(),
          correo,
          telefono,
          direccion
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al registrar cliente: ' + err.message
      });
    }
  }

  static async obtenerVentas(req, res) {
    try {
      const [ventas] = await pool.query(
        `SELECT vf.id_venta,
                vf.numero_factura,
                DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_venta,
                c.nombre_completo AS cliente_nombre,
                c.cedula_nit AS cliente_nit,
                u.nombre_completo AS cajero_nombre,
                vf.subtotal_base AS total_venta,
                vf.total_iva_19,
                vf.total_iva_5,
                vf.total_pagar,
                vf.metodo_pago,
                vf.tipo_comprobante,
                IFNULL(SUM(dv.cantidad * dv.costo_unitario_compra), 0) AS costo_peps,
                IFNULL(vf.subtotal_base - SUM(dv.cantidad * dv.costo_unitario_compra), 0) AS utilidad_neta
         FROM ventas_facturas vf
         JOIN clientes c ON vf.id_cliente = c.id_cliente
         JOIN usuarios u ON vf.id_usuario = u.id_usuario
         LEFT JOIN detalle_ventas dv ON vf.id_venta = dv.id_venta
         GROUP BY vf.id_venta, vf.numero_factura, vf.fecha_venta, c.nombre_completo, c.cedula_nit, u.nombre_completo, vf.subtotal_base, vf.total_iva_19, vf.total_iva_5, vf.total_pagar, vf.metodo_pago, vf.tipo_comprobante
         ORDER BY vf.fecha_venta DESC, vf.id_venta DESC`
      );

      res.json(ventas.map(v => {
        const totalVenta = Number(v.total_venta || 0);
        const costoPeps = Number(v.costo_peps || 0);
        const utilidadNeta = Number(v.utilidad_neta || 0);
        return {
          ...v,
          total_venta: totalVenta,
          costo_peps: costoPeps,
          utilidad_neta: utilidadNeta,
          margen_porcentaje: costoPeps > 0 ? Number(((utilidadNeta / costoPeps) * 100).toFixed(2)) : 0
        };
      }));
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar historial de ventas: ' + err.message });
    }
  }

  static async obtenerVentaPorId(req, res) {
    const { id } = req.params;
    try {
      const [[factura]] = await pool.query(
        `SELECT vf.*, c.nombre_completo AS cliente_nombre, c.cedula_nit AS cliente_nit, 
                c.correo AS cliente_correo, c.direccion AS cliente_direccion,
                u.nombre_completo AS cajero_nombre,
                DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_formateada
         FROM ventas_facturas vf
         JOIN clientes c ON vf.id_cliente = c.id_cliente
         JOIN usuarios u ON vf.id_usuario = u.id_usuario
         WHERE vf.id_venta = ?`,
        [id]
      );

      if (!factura) {
        return res.status(404).json({ error: 'Factura no encontrada.' });
      }

      const [items] = await pool.query(
        `SELECT dv.*, p.nombre AS producto_nombre, p.codigo_barras, l.numero_lote,
                ROUND(dv.cantidad * dv.costo_unitario_compra, 2) AS costo_total_lote,
                ROUND(dv.subtotal_linea - (dv.cantidad * dv.costo_unitario_compra), 2) AS utilidad_tramo
         FROM detalle_ventas dv
         JOIN productos p ON dv.id_producto = p.id_producto
         JOIN lotes l ON dv.id_lote = l.id_lote
         WHERE dv.id_venta = ?`,
        [id]
      );

      const itemsFormateados = items.map(it => ({
        ...it,
        producto: it.producto_nombre || '',
        lote: it.numero_lote || 'N/A',
        cantidad: Number(it.cantidad || 0),
        precio_unitario: Number(it.precio_unitario_base || 0),
        iva: Number(it.valor_iva_linea || 0),
        subtotal: Number(it.subtotal_linea || 0),
        costo_unitario_compra: Number(it.costo_unitario_compra || 0),
        precio_unitario_base: Number(it.precio_unitario_base || 0),
        subtotal_linea: Number(it.subtotal_linea || 0),
        costo_total_lote: Number(it.costo_total_lote || 0),
        utilidad_tramo: Number(it.utilidad_tramo || 0)
      }));

      const costo_peps = itemsFormateados.reduce((acc, it) => acc + it.costo_total_lote, 0);
      const total_venta = Number(factura.subtotal_base || 0);
      const utilidad_neta = Number((total_venta - costo_peps).toFixed(2));

      res.json({
        factura: {
          ...factura,
          total_venta,
          costo_peps: Number(costo_peps.toFixed(2)),
          utilidad_neta,
          margen_porcentaje: costo_peps > 0 ? Number(((utilidad_neta / costo_peps) * 100).toFixed(2)) : 0
        },
        items: itemsFormateados
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar factura: ' + err.message });
    }
  }

  static async obtenerVentasHoy(req, res) {
    try {
      const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
      const [ventas] = await pool.query(
        `SELECT 
           vf.id_venta,
           vf.numero_factura,
           DATE_FORMAT(vf.fecha_venta, '%H:%i:%s') AS hora,
           DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_completa,
           IFNULL(c.nombre_completo, 'Consumidor Final') AS cliente,
           IFNULL(c.cedula_nit, '222222222222') AS cliente_nit,
           TRIM(IFNULL(vf.metodo_pago, 'Efectivo')) AS metodo_pago,
           CAST(vf.total_pagar AS DECIMAL(12, 2)) AS total
         FROM ventas_facturas vf
         LEFT JOIN clientes c ON vf.id_cliente = c.id_cliente
         WHERE DATE(vf.fecha_venta) = ?
         ORDER BY vf.fecha_venta DESC, vf.id_venta DESC`,
        [fecha]
      );

      res.json({
        ok: true,
        fecha,
        total_ventas: ventas.length,
        gran_total: ventas.reduce((acc, v) => acc + Number(v.total || 0), 0),
        ventas: ventas.map(v => ({
          id_venta: v.id_venta,
          numero_factura: v.numero_factura,
          hora: v.hora,
          fecha_completa: v.fecha_completa,
          cliente: v.cliente,
          cliente_nit: v.cliente_nit,
          metodo_pago: v.metodo_pago,
          total: Number(v.total || 0)
        }))
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Error al consultar ventas de hoy: ' + err.message });
    }
  }

  static async consultarFacturaPublica(req, res) {
    const { codigo } = req.params;
    if (!codigo) {
      return res.status(400).json({ ok: false, error: 'Código de factura requerido.' });
    }

    try {
      const [[factura]] = await pool.query(
        `SELECT vf.id_venta,
                vf.numero_factura,
                DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d') AS fecha,
                DATE_FORMAT(vf.fecha_venta, '%H:%i:%s') AS hora,
                DATE_FORMAT(vf.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_completa,
                vf.subtotal_base,
                vf.total_iva_19,
                vf.total_iva_5,
                vf.descuento,
                vf.total_pagar,
                TRIM(IFNULL(vf.metodo_pago, 'Efectivo')) AS metodo_pago,
                IFNULL(vf.tipo_comprobante, 'Factura Electrónica de Venta') AS tipo_comprobante,
                vf.cufe,
                IFNULL(c.nombre_completo, 'Consumidor Final') AS cliente,
                IFNULL(c.cedula_nit, '222222222222') AS cliente_nit,
                IFNULL(c.correo, '') AS cliente_correo,
                IFNULL(c.direccion, '') AS cliente_direccion,
                IFNULL(u.nombre_completo, 'Caja Principal') AS cajero
         FROM ventas_facturas vf
         LEFT JOIN clientes c ON vf.id_cliente = c.id_cliente
         LEFT JOIN usuarios u ON vf.id_usuario = u.id_usuario
         WHERE vf.numero_factura = ? OR vf.id_venta = ?`,
        [codigo.trim(), isNaN(codigo) ? -1 : parseInt(codigo, 10)]
      );

      if (!factura) {
        return res.status(404).json({ ok: false, error: 'Factura no encontrada o código inválido.' });
      }

      const [items] = await pool.query(
        `SELECT p.nombre AS producto,
                p.codigo_barras,
                SUM(dv.cantidad) AS cantidad,
                dv.precio_unitario_base AS precio_unitario,
                dv.tarifa_iva_aplicada AS tarifa_iva,
                SUM(dv.valor_iva_linea) AS iva,
                SUM(dv.subtotal_linea) AS subtotal
         FROM detalle_ventas dv
         JOIN productos p ON dv.id_producto = p.id_producto
         WHERE dv.id_venta = ?
         GROUP BY p.id_producto, p.nombre, p.codigo_barras, dv.precio_unitario_base, dv.tarifa_iva_aplicada
         ORDER BY MIN(dv.id_detalle_venta) ASC`,
        [factura.id_venta]
      );

      const subtotalBase = Number(factura.subtotal_base || 0);
      const iva19 = Number(factura.total_iva_19 || 0);
      const iva5 = Number(factura.total_iva_5 || 0);
      const descuento = Number(factura.descuento || 0);
      const totalPagar = Number(factura.total_pagar || 0);
      const base0 = (iva19 === 0 && iva5 === 0) ? subtotalBase : 0;

      res.json({
        ok: true,
        factura: {
          id_venta: factura.id_venta,
          numero_factura: factura.numero_factura,
          resolucion_dian: 'Resolución DIAN No. 18764000001 de 2026',
          fecha: factura.fecha,
          hora: factura.hora,
          fecha_completa: factura.fecha_completa,
          cajero: factura.cajero,
          cliente: factura.cliente,
          cliente_nit: factura.cliente_nit,
          cliente_correo: factura.cliente_correo,
          cliente_direccion: factura.cliente_direccion,
          metodo_pago: factura.metodo_pago,
          tipo_comprobante: factura.tipo_comprobante,
          cufe: factura.cufe,
          subtotal_base: subtotalBase,
          iva_19: iva19,
          iva_5: iva5,
          base_0: base0,
          descuento: descuento,
          total_pagar: totalPagar
        },
        items: items.map(it => ({
          producto: it.producto,
          codigo_barras: it.codigo_barras,
          cantidad: Number(it.cantidad || 0),
          precio_unitario: Number(it.precio_unitario || 0),
          tarifa_iva: Number(it.tarifa_iva || 0),
          iva: Number(it.iva || 0),
          subtotal: Number(it.subtotal || 0)
        }))
      });
    } catch (err) {
      console.error('Error al consultar factura pública:', err);
      res.status(500).json({ ok: false, error: 'Error interno al consultar factura: ' + err.message });
    }
  }
}

module.exports = VentasController;
