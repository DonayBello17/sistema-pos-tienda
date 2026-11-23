const pool = require('../config/db');
const ComprasService = require('../services/compras.service');

/**
 * Controlador de Entrada de Compras y Proveedores
 */
class ComprasController {
  static async registrarCompra(req, res) {
    const { id_proveedor, productos_comprados } = req.body || {};

    // 1. Validar proveedor
    if (!id_proveedor || isNaN(parseInt(id_proveedor, 10)) || parseInt(id_proveedor, 10) <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debe especificar un proveedor válido con ID mayor a cero.'
      });
    }

    // 2. Validar array de productos comprados
    if (!productos_comprados || !Array.isArray(productos_comprados) || productos_comprados.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debe especificar al menos un producto para registrar la recepción de compra.'
      });
    }

    // 3. Validar explícitamente cada producto (cantidades > 0 y costos/precios >= 0)
    for (let i = 0; i < productos_comprados.length; i++) {
      const it = productos_comprados[i];
      if (!it || typeof it !== 'object') {
        return res.status(400).json({
          ok: false,
          error: `El producto en la posición ${i + 1} no tiene un formato válido.`
        });
      }

      if (!it.id_producto || isNaN(parseInt(it.id_producto, 10)) || parseInt(it.id_producto, 10) <= 0) {
        return res.status(400).json({
          ok: false,
          error: `El producto en la posición ${i + 1} debe tener un ID de producto válido mayor a cero.`
        });
      }

      const cantidad = Number(it.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({
          ok: false,
          error: `Cantidad inválida para el producto ID ${it.id_producto}. La cantidad debe ser un número positivo mayor a cero (recibido: ${it.cantidad}).`
        });
      }

      const costo = Number(it.costo_unitario);
      if (isNaN(costo) || costo < 0) {
        return res.status(400).json({
          ok: false,
          error: `Costo unitario inválido para el producto ID ${it.id_producto}. El costo no puede ser un valor negativo (recibido: ${it.costo_unitario}).`
        });
      }

      if (it.margen_ganancia !== undefined && it.margen_ganancia !== null && it.margen_ganancia !== '') {
        const margen = Number(it.margen_ganancia);
        if (isNaN(margen) || margen < 0) {
          return res.status(400).json({
            ok: false,
            error: `Margen de ganancia inválido para el producto ID ${it.id_producto}. El margen no puede ser negativo (recibido: ${it.margen_ganancia}).`
          });
        }
      }

      if (!it.numero_lote || String(it.numero_lote).trim().length === 0) {
        return res.status(400).json({
          ok: false,
          error: `El número de lote es obligatorio para el producto ID ${it.id_producto}.`
        });
      }

      if (!it.fecha_vencimiento) {
        return res.status(400).json({
          ok: false,
          error: `La fecha de vencimiento es obligatoria para el producto ID ${it.id_producto}.`
        });
      }
    }

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
