const pool = require('../config/db');
const ComprasService = require('../services/compras.service');

/**
 * Controlador de Entrada de Compras y Proveedores
 */
class ComprasController {
  static async registrarCompra(req, res) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const resultado = await ComprasService.registrarCompraYLotes(conn, req.body);
      await conn.commit();

      res.status(201).json({
        ok: true,
        mensaje: 'Compra registrada formalmente, lotes creados y Kardex actualizado',
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

  static async obtenerProveedores(req, res) {
    try {
      const [proveedores] = await pool.query(
        'SELECT id_proveedor, nit, razon_social, telefono, direccion, correo FROM proveedores WHERE estado = "Activo" ORDER BY razon_social ASC'
      );
      res.json(proveedores);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar proveedores: ' + err.message });
    }
  }

  static async crearProveedor(req, res) {
    const { nit, razon_social, telefono, direccion, correo } = req.body;

    if (!nit || !razon_social) {
      return res.status(400).json({
        ok: false,
        error: 'El NIT y la Razón Social son campos requeridos.'
      });
    }

    try {
      const [existentes] = await pool.query(
        'SELECT id_proveedor FROM proveedores WHERE nit = ?',
        [nit.trim()]
      );

      if (existentes.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `Ya existe un proveedor registrado con el NIT ${nit}.`
        });
      }

      const [resInsert] = await pool.query(
        `INSERT INTO proveedores (nit, razon_social, telefono, direccion, correo, estado)
         VALUES (?, ?, ?, ?, ?, 'Activo')`,
        [nit.trim(), razon_social.trim(), telefono ? telefono.trim() : null, direccion ? direccion.trim() : null, correo ? correo.trim() : null]
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Proveedor registrado exitosamente.',
        data: {
          id_proveedor: resInsert.insertId,
          nit: nit.trim(),
          razon_social: razon_social.trim(),
          telefono,
          direccion,
          correo
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al registrar proveedor: ' + err.message
      });
    }
  }
}

module.exports = ComprasController;
