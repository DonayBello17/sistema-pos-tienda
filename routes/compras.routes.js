const express = require('express');
const router = express.Router();
const ComprasController = require('../controllers/compras.controller');

router.post('/', ComprasController.registrarCompra);
router.get('/proveedores', ComprasController.obtenerProveedores);
router.post('/proveedores', ComprasController.crearProveedor);

module.exports = router;
