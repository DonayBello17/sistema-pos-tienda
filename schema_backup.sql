-- ========================================================
-- SISTEMA DE GESTION COMERCIAL (POS TIENDA)
-- Script de Backup Completo: Esquema DDL y Datos Iniciales
-- Generado: 2026-11-11T18:30:19.461Z
-- Total Tablas: 13
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

CREATE DATABASE IF NOT EXISTS `sistema_pos_tienda` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistema_pos_tienda`;

-- --------------------------------------------------------
-- Estructura de tabla: `roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `roles` (2 registros)
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(2, 'Cajero');

-- --------------------------------------------------------
-- Estructura de tabla: `usuarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  `id_rol` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `usuarios` (2 registros)
INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `correo`, `password_hash`, `estado`, `id_rol`, `fecha_creacion`) VALUES
(1, 'Administrador Principal', 'admin@tienda.com', 'admin123', 'Activo', 1, '2026-10-29 09:05:56'),
(2, 'Cajero Turno Dia', 'cajero@tienda.com', 'cajero123', 'Activo', 2, '2026-10-29 09:05:56');

-- --------------------------------------------------------
-- Estructura de tabla: `sesiones_usuarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sesiones_usuarios`;
CREATE TABLE `sesiones_usuarios` (
  `id_sesion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `fecha_inicio` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` datetime DEFAULT NULL,
  PRIMARY KEY (`id_sesion`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `sesiones_usuarios_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `sesiones_usuarios` (14 registros)
INSERT INTO `sesiones_usuarios` (`id_sesion`, `id_usuario`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 1, '2026-11-04 19:00:30', NULL),
(2, 1, '2026-11-04 19:03:20', '2026-11-04 19:03:41'),
(3, 2, '2026-11-04 19:03:44', '2026-11-04 19:04:03'),
(4, 1, '2026-11-04 19:05:40', NULL),
(5, 1, '2026-11-04 19:19:13', '2026-11-04 20:01:11'),
(6, 2, '2026-11-04 20:08:18', '2026-11-05 08:20:12'),
(7, 1, '2026-11-05 08:27:29', '2026-11-11 11:48:19'),
(8, 2, '2026-11-11 11:49:04', '2026-11-11 11:49:20'),
(9, 1, '2026-11-11 11:49:31', '2026-11-11 12:21:15'),
(10, 1, '2026-11-11 12:21:22', '2026-11-11 12:31:15'),
(11, 1, '2026-11-11 12:31:17', '2026-11-11 13:08:26'),
(12, 1, '2026-11-11 13:02:18', NULL),
(13, 1, '2026-11-11 13:08:29', '2026-11-11 13:24:53'),
(14, 2, '2026-11-11 13:24:56', '2026-11-11 13:26:14');

-- --------------------------------------------------------
-- Estructura de tabla: `proveedores`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `id_proveedor` int NOT NULL AUTO_INCREMENT,
  `nit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `razon_social` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  PRIMARY KEY (`id_proveedor`),
  UNIQUE KEY `nit` (`nit`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `proveedores` (3 registros)
INSERT INTO `proveedores` (`id_proveedor`, `nit`, `razon_social`, `telefono`, `direccion`, `correo`, `estado`) VALUES
(1, '900123456-1', 'Distribuidora Lácteos del Norte SAS', '3001234567', 'Cra 50 # 30-10', 'ventas@lacteosnorte.com', 'Activo'),
(2, '890900123-2', 'Abarrotes & Granos de Colombia SAS', '3119876543', 'Av. Ferrocarril # 18-20', 'pedidos@abarrotescol.com', 'Activo'),
(3, 'NIT-1793836851842', 'Proveedor Test 1793836851842', '3001234567', 'Calle Test 123', 'prov1793836851842@test.com', 'Activo');

-- --------------------------------------------------------
-- Estructura de tabla: `categorias`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `categorias` (4 registros)
INSERT INTO `categorias` (`id_categoria`, `nombre_categoria`, `descripcion`) VALUES
(1, 'Lácteos y Refrigerados', 'Productos perecederos de cadena de frío'),
(2, 'Abarrotes y Despensa', 'Granos, aceites y alimentos procesados'),
(3, 'Bebidas y Refrescos', 'Gaseosas, jugos y aguas'),
(4, 'Categoría Test 1793838604876', 'Descripción de prueba');

-- --------------------------------------------------------
-- Estructura de tabla: `productos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `codigo_barras` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_categoria` int DEFAULT NULL,
  `precio_base` decimal(12,2) NOT NULL,
  `tarifa_iva` enum('19','5','0') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '19',
  `precio_venta_final` decimal(12,2) NOT NULL,
  `stock_total` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '5',
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'Activo',
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `productos` (8 registros)
INSERT INTO `productos` (`id_producto`, `codigo_barras`, `nombre`, `id_categoria`, `precio_base`, `tarifa_iva`, `precio_venta_final`, `stock_total`, `stock_minimo`, `estado`) VALUES
(1, '7701001', 'Leche Entera 1000ml', 1, '3500.00', '0', '3500.00', 45, 5, 'Activo'),
(2, '7701002', 'Yogur Fresa 250ml', 1, '2800.00', '19', '3332.00', 22, 5, 'Activo'),
(3, '7701003', 'Arroz Blanco 1000g', 2, '4000.00', '0', '4000.00', 60, 15, 'Activo'),
(4, '7701004', 'Aceite Vegetal 900ml', 2, '8500.00', '19', '10115.00', 15, 5, 'Activo'),
(5, '7701005', 'Café Tostado 500g', 2, '12000.00', '5', '12600.00', 25, 5, 'Activo'),
(6, 'BAR-1793836851842', 'Producto PEPS Test 1793836851842', 1, '10000.00', '19', '11900.00', 13, 5, 'Activo'),
(7, 'INACT-1793839926271', 'Producto Para Inactivar 1793839926271', 1, '5000.00', '19', '5950.00', 0, 2, 'Inactivo'),
(8, '7727172', 'Platano Verde', 2, '1000.00', '0', '1000.00', 10, 10, 'Activo');

-- --------------------------------------------------------
-- Estructura de tabla: `compras`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `compras`;
CREATE TABLE `compras` (
  `id_compra` int NOT NULL AUTO_INCREMENT,
  `id_proveedor` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_compra` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_compra` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_compra`),
  KEY `id_proveedor` (`id_proveedor`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `compras` (4 registros)
INSERT INTO `compras` (`id_compra`, `id_proveedor`, `id_usuario`, `fecha_compra`, `total_compra`) VALUES
(1, 1, 1, '2026-10-29 09:05:56', '450000.00'),
(2, 3, 1, '2026-11-04 19:00:52', '140000.00'),
(3, 2, 1, '2026-11-05 08:33:29', '10000.00'),
(4, 2, 1, '2026-11-05 08:37:52', '20000.00');

-- --------------------------------------------------------
-- Estructura de tabla: `lotes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lotes`;
CREATE TABLE `lotes` (
  `id_lote` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `id_compra` int NOT NULL,
  `numero_lote` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_inicial` int NOT NULL,
  `cantidad_disponible` int NOT NULL,
  `costo_unitario` decimal(12,2) NOT NULL,
  `fecha_ingreso` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_vencimiento` date NOT NULL,
  `estado_lote` enum('Vigente','Agotado','Vencido','Dado de Baja') COLLATE utf8mb4_unicode_ci DEFAULT 'Vigente',
  PRIMARY KEY (`id_lote`),
  KEY `id_producto` (`id_producto`),
  KEY `id_compra` (`id_compra`),
  CONSTRAINT `lotes_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `lotes_ibfk_2` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `lotes` (11 registros)
INSERT INTO `lotes` (`id_lote`, `id_producto`, `id_compra`, `numero_lote`, `cantidad_inicial`, `cantidad_disponible`, `costo_unitario`, `fecha_ingreso`, `fecha_vencimiento`, `estado_lote`) VALUES
(1, 1, 1, 'LOT-LEC-ANTIGUO', 25, 25, '2700.00', '2026-10-01 08:00:00', '2026-12-13', 'Vigente'),
(2, 1, 1, 'LOT-LEC-NUEVO', 20, 20, '2900.00', '2026-10-20 09:30:00', '2026-12-28', 'Vigente'),
(3, 2, 1, 'LOT-YOG-CADUCADO', 10, 12, '2100.00', '2026-09-01 08:00:00', '2026-10-24', 'Vigente'),
(4, 2, 1, 'LOT-YOG-VIGENTE', 10, 10, '2200.00', '2026-10-15 10:00:00', '2026-11-18', 'Vigente'),
(5, 3, 1, 'LOT-ARR-001', 60, 60, '3100.00', '2026-10-05 11:00:00', '2027-04-27', 'Vigente'),
(6, 4, 1, 'LOT-ACE-001', 15, 15, '6800.00', '2026-10-10 14:00:00', '2026-11-10', 'Vigente'),
(7, 5, 1, 'LOT-CAF-001', 25, 25, '9500.00', '2026-10-12 16:00:00', '2027-01-27', 'Vigente'),
(8, 6, 2, 'LOTE-A-1793836851842', 10, 0, '5000.00', '2026-11-04 19:00:52', '2027-12-31', 'Agotado'),
(9, 6, 2, 'LOTE-B-1793836851842', 15, 13, '6000.00', '2026-11-04 19:00:52', '2028-06-30', 'Vigente'),
(10, 8, 3, 'LOT-261105-387', 10, 0, '1000.00', '2026-11-05 08:33:29', '2027-01-05', 'Dado de Baja'),
(11, 8, 4, 'LOT-261105-715', 10, 10, '2000.00', '2026-11-05 08:37:52', '2027-01-05', 'Vigente');

-- --------------------------------------------------------
-- Estructura de tabla: `detalle_compras`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detalle_compras`;
CREATE TABLE `detalle_compras` (
  `id_detalle_compra` int NOT NULL AUTO_INCREMENT,
  `id_compra` int NOT NULL,
  `id_producto` int NOT NULL,
  `id_lote` int NOT NULL,
  `cantidad` int NOT NULL,
  `costo_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_detalle_compra`),
  KEY `id_compra` (`id_compra`),
  KEY `id_producto` (`id_producto`),
  KEY `id_lote` (`id_lote`),
  CONSTRAINT `detalle_compras_ibfk_1` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`),
  CONSTRAINT `detalle_compras_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `detalle_compras_ibfk_3` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `detalle_compras` (4 registros)
INSERT INTO `detalle_compras` (`id_detalle_compra`, `id_compra`, `id_producto`, `id_lote`, `cantidad`, `costo_unitario`, `subtotal`) VALUES
(1, 2, 6, 8, 10, '5000.00', '50000.00'),
(2, 2, 6, 9, 15, '6000.00', '90000.00'),
(3, 3, 8, 10, 10, '1000.00', '10000.00'),
(4, 4, 8, 11, 10, '2000.00', '20000.00');

-- --------------------------------------------------------
-- Estructura de tabla: `clientes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `cedula_nit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cedula_nit` (`cedula_nit`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `clientes` (3 registros)
INSERT INTO `clientes` (`id_cliente`, `cedula_nit`, `nombre_completo`, `correo`, `telefono`, `direccion`) VALUES
(1, '222222222222', 'Consumidor Final', 'pos@tienda.com', '3000000000', 'Local POS'),
(2, '1035987456', 'Juan Pérez', 'juan.perez@gmail.com', '3104567890', 'Calle 45 # 12-34'),
(3, 'CC-1793836851842', 'Cliente Test 1793836851842', 'cliente1793836851842@test.com', '3159876543', 'Av Siempre Viva 742');

-- --------------------------------------------------------
-- Estructura de tabla: `ventas_facturas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ventas_facturas`;
CREATE TABLE `ventas_facturas` (
  `id_venta` int NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cliente` int NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_venta` datetime DEFAULT CURRENT_TIMESTAMP,
  `subtotal_base` decimal(12,2) NOT NULL,
  `total_iva_19` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_iva_5` decimal(12,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_pagar` decimal(12,2) NOT NULL,
  `metodo_pago` enum('Efectivo','Tarjeta','Transferencia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_comprobante` enum('Tirilla POS','Factura Electronica DIAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cufe` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_data` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_venta`),
  UNIQUE KEY `numero_factura` (`numero_factura`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `ventas_facturas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `ventas_facturas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `ventas_facturas` (1 registros)
INSERT INTO `ventas_facturas` (`id_venta`, `numero_factura`, `id_cliente`, `id_usuario`, `fecha_venta`, `subtotal_base`, `total_iva_19`, `total_iva_5`, `descuento`, `total_pagar`, `metodo_pago`, `tipo_comprobante`, `cufe`, `qr_data`) VALUES
(3, 'FAC-00000001', 3, 1, '2026-11-04 19:00:52', '120000.00', '22800.00', '0.00', '0.00', '142800.00', 'Efectivo', 'Factura Electronica DIAN', '3f25cd5c1fc918e2dd9130090304520242eae1658b73529ba59bd435a3dac9e1cc20d446add39c7d024d0c49256716db', 'NumFac=FAC-00000001&FecFac=2026-11-05&NitFac=900987654-3&DocAdq=CC-1793836851842&ValFac=120000.00&ValIva=22800.00&ValOtro=0.00&ValTolFac=142800.00&CUFE=3f25cd5c1fc918e2dd9130090304520242eae1658b73529ba59bd435a3dac9e1cc20d446add39c7d024d0c49256716db&QRCode=https%3A%2F%2Fcatalogo-vpfe.dian.gov.co%2Fdocument%2Fsearchqr%3Fdocumentkey%3D3f25cd5c1fc918e2dd9130090304520242eae1658b73529ba59bd435a3dac9e1cc20d446add39c7d024d0c49256716db');

-- --------------------------------------------------------
-- Estructura de tabla: `detalle_ventas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detalle_ventas`;
CREATE TABLE `detalle_ventas` (
  `id_detalle_venta` int NOT NULL AUTO_INCREMENT,
  `id_venta` int NOT NULL,
  `id_producto` int NOT NULL,
  `id_lote` int NOT NULL,
  `costo_unitario_compra` decimal(12,2) NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario_base` decimal(12,2) NOT NULL,
  `tarifa_iva_aplicada` enum('19','5','0') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_iva_linea` decimal(12,2) NOT NULL,
  `subtotal_linea` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_detalle_venta`),
  KEY `id_venta` (`id_venta`),
  KEY `id_producto` (`id_producto`),
  KEY `fk_detalle_ventas_lotes` (`id_lote`),
  CONSTRAINT `detalle_ventas_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas_facturas` (`id_venta`),
  CONSTRAINT `detalle_ventas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `fk_detalle_ventas_lotes` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `detalle_ventas` (2 registros)
INSERT INTO `detalle_ventas` (`id_detalle_venta`, `id_venta`, `id_producto`, `id_lote`, `costo_unitario_compra`, `cantidad`, `precio_unitario_base`, `tarifa_iva_aplicada`, `valor_iva_linea`, `subtotal_linea`) VALUES
(3, 3, 6, 8, '5000.00', 10, '10000.00', '19', '19000.00', '100000.00'),
(4, 3, 6, 9, '6000.00', 2, '10000.00', '19', '3800.00', '20000.00');

-- --------------------------------------------------------
-- Estructura de tabla: `kardex_movimientos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `kardex_movimientos`;
CREATE TABLE `kardex_movimientos` (
  `id_movimiento` int NOT NULL AUTO_INCREMENT,
  `id_producto` int NOT NULL,
  `id_lote` int NOT NULL,
  `id_usuario` int NOT NULL,
  `tipo_movimiento` enum('Entrada por Compra','Salida por Venta PEPS','Salida por Baja de Caducidad','Salida por Daño','Entrada por Devolución Cliente') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `costo_unitario` decimal(12,2) NOT NULL,
  `costo_total` decimal(12,2) NOT NULL,
  `saldo_stock_resultante` int NOT NULL,
  `motivo_observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_movimiento` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_movimiento`),
  KEY `id_producto` (`id_producto`),
  KEY `id_usuario` (`id_usuario`),
  KEY `fk_kardex_lotes` (`id_lote`),
  CONSTRAINT `fk_kardex_lotes` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id_lote`),
  CONSTRAINT `kardex_movimientos_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`),
  CONSTRAINT `kardex_movimientos_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para la tabla: `kardex_movimientos` (16 registros)
INSERT INTO `kardex_movimientos` (`id_movimiento`, `id_producto`, `id_lote`, `id_usuario`, `tipo_movimiento`, `cantidad`, `costo_unitario`, `costo_total`, `saldo_stock_resultante`, `motivo_observacion`, `fecha_movimiento`) VALUES
(1, 1, 1, 1, 'Entrada por Compra', 25, '2700.00', '67500.00', 25, 'Carga inicial Lote Antiguo', '2026-10-29 09:05:56'),
(2, 1, 2, 1, 'Entrada por Compra', 20, '2900.00', '58000.00', 45, 'Carga inicial Lote Nuevo', '2026-10-29 09:05:56'),
(3, 2, 3, 1, 'Entrada por Compra', 10, '2100.00', '21000.00', 10, 'Lote fecha pasada', '2026-10-29 09:05:56'),
(4, 2, 4, 1, 'Entrada por Compra', 10, '2200.00', '22000.00', 20, 'Lote próximo', '2026-10-29 09:05:56'),
(5, 3, 5, 1, 'Entrada por Compra', 60, '3100.00', '186000.00', 60, 'Carga inicial Arroz', '2026-10-29 09:05:56'),
(6, 4, 6, 1, 'Entrada por Compra', 15, '6800.00', '102000.00', 15, 'Carga inicial Aceite', '2026-10-29 09:05:56'),
(7, 5, 7, 1, 'Entrada por Compra', 25, '9500.00', '237500.00', 25, 'Carga inicial Café', '2026-10-29 09:05:56'),
(10, 6, 8, 1, 'Entrada por Compra', 10, '5000.00', '50000.00', 10, 'Compra Ref #2 - Proveedor: Proveedor Test 1793836851842 (Lote: LOTE-A-1793836851842)', '2026-11-04 19:00:52'),
(11, 6, 9, 1, 'Entrada por Compra', 15, '6000.00', '90000.00', 25, 'Compra Ref #2 - Proveedor: Proveedor Test 1793836851842 (Lote: LOTE-B-1793836851842)', '2026-11-04 19:00:52'),
(12, 6, 8, 1, 'Salida por Venta PEPS', 10, '5000.00', '50000.00', 15, 'Venta FAC-00000001 (Lote: LOTE-A-1793836851842, Costo: $5000.00)', '2026-11-04 19:00:52'),
(13, 6, 9, 1, 'Salida por Venta PEPS', 2, '6000.00', '12000.00', 13, 'Venta FAC-00000001 (Lote: LOTE-B-1793836851842, Costo: $6000.00)', '2026-11-04 19:00:52'),
(14, 2, 3, 1, 'Entrada por Devolución Cliente', 3, '2100.00', '6300.00', 23, 'Devolución Cliente (Buen Estado): Cliente devolvió producto cerrado con ticket de compra - Lote: LOT-YOG-CADUCADO', '2026-11-04 19:52:06'),
(15, 2, 3, 1, 'Salida por Daño', 1, '2100.00', '2100.00', 22, 'Baja por Avería/Defecto: Empaque roto reportado por cliente en mostrador - Lote: LOT-YOG-CADUCADO', '2026-11-04 19:52:06'),
(16, 8, 10, 1, 'Entrada por Compra', 10, '1000.00', '10000.00', 10, 'Compra Ref #3 - Proveedor: Abarrotes & Granos de Colombia SAS (Lote: LOT-261105-387)', '2026-11-05 08:33:29'),
(17, 8, 11, 1, 'Entrada por Compra', 10, '2000.00', '20000.00', 20, 'Compra Ref #4 - Proveedor: Abarrotes & Granos de Colombia SAS (Lote: LOT-261105-715)', '2026-11-05 08:37:52'),
(18, 8, 10, 1, 'Salida por Daño', 10, '1000.00', '10000.00', 10, 'Baja por Avería/Defecto: se maduraron - Lote: LOT-261105-387', '2026-11-05 08:42:47');

SET FOREIGN_KEY_CHECKS = 1;
-- ========================================================
-- Fin del script de backup
-- ========================================================
