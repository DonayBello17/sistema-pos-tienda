const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Métricas de rentabilidad y dashboard ejecutivo: exclusivo Administrador
router.get('/metricas', soloAdmin, DashboardController.obtenerMetricas);

module.exports = router;
