const express = require('express');
const router = express.Router();
const ComprasController = require('../controllers/compras.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Recepción de compras y gestión de proveedores: exclusivo Administrador
router.post('/', soloAdmin, ComprasController.registrarCompra);
router.get('/proveedores', soloAdmin, ComprasController.obtenerProveedores);
router.post('/proveedores', soloAdmin, ComprasController.crearProveedor);

module.exports = router;
