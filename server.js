const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const apiRoutes = require('./routes');
const { soloAdmin } = require('./middlewares/auth.middleware');

// Controladores para endpoints de retrocompatibilidad
const AuthController = require('./controllers/auth.controller');
const DashboardController = require('./controllers/dashboard.controller');
const ProductosController = require('./controllers/productos.controller');
const LotesController = require('./controllers/lotes.controller');
const ComprasController = require('./controllers/compras.controller');
const VentasController = require('./controllers/ventas.controller');
const ReportesController = require('./controllers/reportes.controller');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Control de Caché estricto para evitar visualización de datos protegidos tras logout (BFCache / Botón Atrás)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Enrutador modular centralizado (/api/...)
app.use('/api', apiRoutes);

// Endpoints de compatibilidad directa y autenticación
app.post('/api/login', AuthController.login);
app.post('/api/auth/login', AuthController.login);
app.post('/api/logout', AuthController.logout);
app.post('/api/auth/logout', AuthController.logout);

// Dashboard y KPIs (Solo Administrador)
app.get('/api/dashboard/metricas', soloAdmin, DashboardController.obtenerMetricas);

// Catálogo y Categorías (Consulta abierta para POS; Edición Solo Administrador)
app.get('/api/productos', ProductosController.obtenerProductos);
app.post('/api/productos', soloAdmin, ProductosController.crearProducto);
app.post('/api/productos/recalcular-precios', soloAdmin, ProductosController.recalcularPreciosMasivo);
app.put('/api/productos/:id', soloAdmin, ProductosController.actualizarProducto);
app.patch('/api/productos/:id/margen', soloAdmin, ProductosController.actualizarMargenIndividual);
app.patch('/api/productos/:id/inactivar', soloAdmin, ProductosController.inactivarProducto);

app.get('/api/categorias', ProductosController.obtenerCategorias);
app.post('/api/categorias', soloAdmin, ProductosController.crearCategoria);
app.delete('/api/categorias/:id', soloAdmin, ProductosController.eliminarCategoria);
app.get('/api/productos/categorias', ProductosController.obtenerCategorias);
app.post('/api/productos/categorias', soloAdmin, ProductosController.crearCategoria);
app.delete('/api/productos/categorias/:id', soloAdmin, ProductosController.eliminarCategoria);

// Lotes, Vencimientos y Bajas (Solo Administrador)
app.get('/api/lotes', soloAdmin, LotesController.obtenerLotes);
app.post('/api/inventario/baja-caducidad', soloAdmin, LotesController.registrarBaja);
app.post('/api/inventario/novedades', soloAdmin, LotesController.registrarNovedad);
app.get('/api/inventario/novedades', soloAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT km.id_movimiento,
             p.id_producto,
             p.nombre AS producto,
             p.codigo_barras,
             l.numero_lote,
             u.nombre_completo AS usuario,
             km.tipo_movimiento,
             km.cantidad,
             km.costo_unitario,
             km.costo_total,
             CASE 
               WHEN km.tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño') THEN km.costo_total 
               ELSE 0 
             END AS dinero_perdido,
             km.motivo_observacion,
             DATE_FORMAT(km.fecha_movimiento, '%Y-%m-%d %H:%i:%s') AS fecha
      FROM kardex_movimientos km
      JOIN productos p ON km.id_producto = p.id_producto
      JOIN lotes l ON km.id_lote = l.id_lote
      JOIN usuarios u ON km.id_usuario = u.id_usuario
      WHERE km.tipo_movimiento IN ('Salida por Baja de Caducidad', 'Salida por Daño', 'Entrada por Devolución Cliente')
      ORDER BY km.fecha_movimiento DESC, km.id_movimiento DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compras y Proveedores (Solo Administrador)
app.post('/api/compras', soloAdmin, ComprasController.registrarCompra);
app.get('/api/proveedores', soloAdmin, ComprasController.obtenerProveedores);
app.post('/api/proveedores', soloAdmin, ComprasController.crearProveedor);
app.get('/api/compras/proveedores', soloAdmin, ComprasController.obtenerProveedores);
app.post('/api/compras/proveedores', soloAdmin, ComprasController.crearProveedor);

// Ventas y Facturación POS (Cajero y Administrador)
app.get('/api/ventas', soloAdmin, VentasController.obtenerVentas);
app.post('/api/ventas', VentasController.procesarVenta);
app.get('/api/clientes', VentasController.obtenerClientes);
app.post('/api/clientes', VentasController.crearCliente);
app.get('/api/ventas/clientes', VentasController.obtenerClientes);
app.post('/api/ventas/clientes', VentasController.crearCliente);
app.get('/api/ventas/hoy', VentasController.obtenerVentasHoy);
app.get('/api/public/factura/:codigo', VentasController.consultarFacturaPublica);
app.get('/api/ventas/:id', VentasController.obtenerVentaPorId);

// Reportes Gerenciales y Kardex (Solo Administrador)
app.get('/api/reportes/gerenciales', soloAdmin, ReportesController.obtenerReportesGerenciales);
app.get('/api/reportes/kardex', soloAdmin, ReportesController.obtenerKardex);
app.get('/api/reportes/mermas', soloAdmin, ReportesController.obtenerReporteMermas);
app.get('/api/reportes/novedades', soloAdmin, ReportesController.obtenerReporteMermas);

// Arqueo de Caja (Accesible para Cajero y Administrador)
app.get('/api/reportes/arqueo/:id_usuario', ReportesController.obtenerArqueoCaja);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err.message);
  res.status(500).json({
    ok: false,
    error: 'Error interno en el servidor: ' + (err.message || 'Desconocido')
  });
});

// Manejo de errores no capturados para estabilidad
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err.stack || err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  pool.query('SELECT 1 + 1 AS healthcheck')
    .then(() => {
      app.listen(PORT, () => {
        console.log('================================================================');
        console.log(`  SISTEMA DE GESTIÓN COMERCIAL`);
        console.log(`  Control de Inventarios & Facturación`);
        console.log(`  Servidor activo en: http://localhost:${PORT}`);
        console.log(`  Base de datos: sistema_pos_tienda (MySQL 3306)`);
        console.log('================================================================');
      });
    })
    .catch(err => {
      console.error('ERROR CRÍTICO: No se pudo conectar a MySQL Workbench (sistema_pos_tienda):', err.message);
    });
}

module.exports = app;
