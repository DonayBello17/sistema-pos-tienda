const express = require('express');
const router = express.Router();
const ReportesController = require('../controllers/reportes.controller');

router.get('/gerenciales', ReportesController.obtenerReportesGerenciales);
router.get('/kardex', ReportesController.obtenerKardex);
router.get('/mermas', ReportesController.obtenerReporteMermas);
router.get('/novedades', ReportesController.obtenerReporteMermas);
router.get('/arqueo/:id_usuario', ReportesController.obtenerArqueoCaja);

module.exports = router;
