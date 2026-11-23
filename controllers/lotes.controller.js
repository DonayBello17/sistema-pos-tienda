const pool = require('../config/db');
const InventarioService = require('../services/inventario.service');

/**
 * Controlador de Lotes, Semáforo de Vencimientos y Módulo de Bajas Contables
 */
class LotesController {
  static async obtenerLotes(req, res) {
    try {
      const lotes = await InventarioService.obtenerLotesDetallados();
      res.json(lotes);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar lotes: ' + err.message });
    }
  }

  static async registrarBaja(req, res) {
    const { id_lote, cantidad } = req.body || {};
    const cantBaja = Number(cantidad);

    if (!id_lote || isNaN(parseInt(id_lote, 10)) || parseInt(id_lote, 10) <= 0) {
      return res.status(400).json({ ok: false, error: 'Debe especificar un ID de lote válido mayor a cero.' });
    }

    if (isNaN(cantBaja) || cantBaja <= 0) {
      return res.status(400).json({ ok: false, error: 'La cantidad a dar de baja debe ser un número positivo mayor a cero.' });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const resultado = await InventarioService.registrarBajaInventario(conn, req.body);
      await conn.commit();

      res.json({
        ok: true,
        mensaje: 'Baja asentada correctamente en Kardex y saldo de inventario actualizado',
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

  static async registrarNovedad(req, res) {
    const { id_producto, id_lote, cantidad, tipo_novedad } = req.body || {};
    const cant = Number(cantidad);

    if (!id_producto || isNaN(parseInt(id_producto, 10)) || parseInt(id_producto, 10) <= 0) {
      return res.status(400).json({ ok: false, error: 'Debe especificar un ID de producto válido mayor a cero.' });
    }

    if (!id_lote || isNaN(parseInt(id_lote, 10)) || parseInt(id_lote, 10) <= 0) {
      return res.status(400).json({ ok: false, error: 'Debe especificar un ID de lote válido mayor a cero.' });
    }

    if (isNaN(cant) || cant <= 0) {
      return res.status(400).json({ ok: false, error: 'La cantidad debe ser un número positivo mayor a cero.' });
    }

    if (!tipo_novedad || !['DEVOLUCION_BUEN_ESTADO', 'CAMBIO_AVERIA_DEFECTO'].includes(tipo_novedad)) {
      return res.status(400).json({ ok: false, error: 'El tipo de novedad debe ser DEVOLUCION_BUEN_ESTADO o CAMBIO_AVERIA_DEFECTO.' });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      const resultado = await InventarioService.registrarNovedadInventario(conn, req.body);
      await conn.commit();

      res.status(201).json({
        ok: true,
        mensaje: resultado.tipo_novedad === 'DEVOLUCION_BUEN_ESTADO'
          ? 'Reingreso por devolución asentado exitosamente en Kardex y saldo de inventario'
          : 'Baja por avería/defecto asentada exitosamente en Kardex',
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
}

module.exports = LotesController;
