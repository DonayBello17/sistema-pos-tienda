const express = require('express');
const router = express.Router();
const VentasController = require('../controllers/ventas.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Historial completo financiero de ventas: exclusivo Administrador
router.get('/', soloAdmin, VentasController.obtenerVentas);

// Rutas operativas de caja: accesibles para Cajero y Administrador
router.post('/', VentasController.procesarVenta);
router.get('/clientes', VentasController.obtenerClientes);
router.post('/clientes', VentasController.crearCliente);
router.get('/hoy', VentasController.obtenerVentasHoy);
router.get('/public/factura/:codigo', VentasController.consultarFacturaPublica);
router.get('/:id', VentasController.obtenerVentaPorId);

module.exports = router;
