const express = require('express');
const router = express.Router();
const LotesController = require('../controllers/lotes.controller');

router.get('/', LotesController.obtenerLotes);
router.post('/baja', LotesController.registrarBaja);
router.post('/novedades', LotesController.registrarNovedad);

module.exports = router;
