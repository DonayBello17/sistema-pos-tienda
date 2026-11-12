const express = require('express');
const router = express.Router();
const ProductosController = require('../controllers/productos.controller');

router.get('/', ProductosController.obtenerProductos);
router.post('/', ProductosController.crearProducto);
router.post('/recalcular-precios', ProductosController.recalcularPreciosMasivo);
router.put('/:id', ProductosController.actualizarProducto);
router.patch('/:id/margen', ProductosController.actualizarMargenIndividual);
router.patch('/:id/inactivar', ProductosController.inactivarProducto);
router.get('/categorias', ProductosController.obtenerCategorias);
router.post('/categorias', ProductosController.crearCategoria);
router.delete('/categorias/:id', ProductosController.eliminarCategoria);

module.exports = router;
