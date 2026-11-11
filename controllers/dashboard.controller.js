const InventarioService = require('../services/inventario.service');

/**
 * Controlador de Métricas y KPIs Ejecutivos para el Dashboard Principal
 */
class DashboardController {
  static async obtenerMetricas(req, res) {
    try {
      const metricas = await InventarioService.obtenerMetricasDashboard();
      res.json(metricas);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar métricas del dashboard: ' + err.message });
    }
  }
}

module.exports = DashboardController;
