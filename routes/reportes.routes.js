const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Rutas protegidas exclusivamente para Administrador
router.get('/gerenciales', soloAdmin, ReportesController.obtenerReportesGerenciales);
router.get('/kardex', soloAdmin, ReportesController.obtenerKardex);
router.get('/mermas', soloAdmin, ReportesController.obtenerReporteMermas);
router.get('/novedades', soloAdmin, ReportesController.obtenerReporteMermas);

// Arqueo y cierre de caja: accesible tanto para Cajero como Administrador
router.get('/arqueo/:id_usuario', ReportesController.obtenerArqueoCaja);

module.exports = router;
