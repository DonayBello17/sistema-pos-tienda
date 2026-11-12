const express = require('express');
const router = express.Router();
const VentasController = require('../controllers/ventas.controller');

router.get('/', VentasController.obtenerVentas);
router.post('/', VentasController.procesarVenta);
router.get('/clientes', VentasController.obtenerClientes);
router.post('/clientes', VentasController.crearCliente);
router.get('/:id', VentasController.obtenerVentaPorId);

module.exports = router;
