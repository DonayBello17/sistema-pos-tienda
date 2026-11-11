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
        `SELECT dv.*, p.nombre AS producto_nombre, p.codigo_barras, l.numero_lote
         FROM detalle_ventas dv
         JOIN productos p ON dv.id_producto = p.id_producto
         JOIN lotes l ON dv.id_lote = l.id_lote
         WHERE dv.id_venta = ?`,
        [id]
      );

      res.json({
        factura,
        items
      });
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar factura: ' + err.message });
    }
  }
}

module.exports = VentasController;
