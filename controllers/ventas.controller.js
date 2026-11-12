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
}

module.exports = VentasController;
