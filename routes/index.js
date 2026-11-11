const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const productosRoutes = require('./productos.routes');
const ventasRoutes = require('./ventas.routes');
const lotesRoutes = require('./lotes.routes');
const comprasRoutes = require('./compras.routes');
const reportesRoutes = require('./reportes.routes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/productos', productosRoutes);
router.use('/ventas', ventasRoutes);
router.use('/lotes', lotesRoutes);
router.use('/compras', comprasRoutes);
router.use('/reportes', reportesRoutes);

// Alias de retrocompatibilidad con endpoints existentes
router.post('/login', (req, res, next) => authRoutes(req, res, next));
router.post('/inventario/baja-caducidad', (req, res, next) => lotesRoutes(req, res, next));

module.exports = router;
