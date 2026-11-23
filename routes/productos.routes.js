const express = require('express');
const router = express.Router();
const ProductosController = require('../controllers/productos.controller');
const { soloAdmin } = require('../middlewares/auth.middleware');

// Consulta de productos y categorías: accesible para Cajero (POS) y Administrador
router.get('/', ProductosController.obtenerProductos);
router.get('/categorias', ProductosController.obtenerCategorias);

// Modificación de productos, márgenes, precios y categorías: exclusivo Administrador
router.post('/', soloAdmin, ProductosController.crearProducto);
router.post('/recalcular-precios', soloAdmin, ProductosController.recalcularPreciosMasivo);
router.put('/:id', soloAdmin, ProductosController.actualizarProducto);
router.patch('/:id/margen', soloAdmin, ProductosController.actualizarMargenIndividual);
router.patch('/:id/inactivar', soloAdmin, ProductosController.inactivarProducto);
router.post('/categorias', soloAdmin, ProductosController.crearCategoria);
router.delete('/categorias/:id', soloAdmin, ProductosController.eliminarCategoria);

module.exports = router;
