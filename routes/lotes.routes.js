const express = require('express');
const router = express.Router();
const LotesController = require('../controllers/lotes.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Gestión de lotes, semáforo de vencimientos y bajas contables: exclusivo Administrador
router.get('/', soloAdmin, LotesController.obtenerLotes);
router.post('/baja', soloAdmin, LotesController.registrarBaja);
router.post('/novedades', soloAdmin, LotesController.registrarNovedad);

module.exports = router;
