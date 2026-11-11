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
