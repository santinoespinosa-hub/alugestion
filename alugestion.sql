-- ==============================================================
-- BASE DE DATOS: AluGestión (Sistema de Gestión de Aberturas de Aluminio)
-- Compatible con MySQL / MariaDB (phpMyAdmin)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `alugestion` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alugestion`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Tabla: usuarios
-- --------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(120) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: clientes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `tipo` ENUM('Particular', 'Corporativo') NOT NULL DEFAULT 'Particular',
  `dni_cuit` VARCHAR(30) NOT NULL UNIQUE,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `observaciones` TEXT DEFAULT NULL,
  `estado` ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: presupuestos
-- --------------------------------------------------------
DROP TABLE IF EXISTS `presupuestos`;
CREATE TABLE `presupuestos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT DEFAULT NULL,
  `numero` VARCHAR(20) NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `monto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('Aprobado', 'Pendiente', 'Rechazado') NOT NULL DEFAULT 'Pendiente',
  `fecha` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_presupuestos_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: ordenes_trabajo
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ordenes_trabajo`;
CREATE TABLE `ordenes_trabajo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT DEFAULT NULL,
  `numero` VARCHAR(20) NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `linea_aluminio` VARCHAR(100) DEFAULT 'Módena / A30',
  `estado` ENUM('En taller', 'En montaje', 'Finalizado', 'Pendiente') NOT NULL DEFAULT 'En taller',
  `fecha` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ordenes_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: mantenimientos
-- --------------------------------------------------------
DROP TABLE IF EXISTS `mantenimientos`;
CREATE TABLE `mantenimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT DEFAULT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `estado` ENUM('Programado', 'Realizado', 'Cancelado') NOT NULL DEFAULT 'Programado',
  `fecha_programada` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mantenimientos_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla: contactos (Mensajes guardados desde contactenos.html)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `contactos`;
CREATE TABLE `contactos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `direccion` VARCHAR(255) DEFAULT NULL,
  `localidad` VARCHAR(100) DEFAULT NULL,
  `provincia` VARCHAR(100) DEFAULT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha_envio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================
-- DATOS DE PRUEBA PRECARGADOS
-- ==============================================================

-- 1. Usuarios del sistema (Contraseñas con hash BCRYPT oficial de PHP)
-- admin / admin123  (Rol: admin)
-- demo / demo123    (Rol: operador)
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `usuario`, `email`, `password`, `rol`) VALUES
(1, 'Administrador', 'General', 'admin', 'admin@alugestion.com', '$2y$10$3hYxhq7j6GM4TOWijzn3ZewadJZyoiLener./FoqrhAlAPxL9Zgfu', 'admin'),
(2, 'Operador', 'Taller', 'demo', 'demo@alugestion.com', '$2y$10$8mEvBLio6w2AFyABVT3R0O84JI23neVbYE8RRzG.i7vxf8B..0/d.', 'operador');

-- 2. Clientes iniciales de aberturas de aluminio
INSERT INTO `clientes` (`id`, `nombre`, `tipo`, `dni_cuit`, `telefono`, `email`, `direccion`, `observaciones`, `estado`) VALUES
(1, 'Constructora Horizonte SRL', 'Corporativo', '30-71234567-8', '341 555-0192', 'contacto@chorizonte.com', 'Av. Pellegrini 1234, Rosario', 'Obra Edificio Mirador. Requiere Línea A30 New con DVH 4+12+4.', 'Activo'),
(2, 'Martín Rodríguez', 'Particular', '20-28345912-3', '341 455-8811', 'martin.rodriguez@gmail.com', 'San Lorenzo 456, Piso 3, Rosario', 'Cambio de 3 ventanas corredizas por Línea Módena anodizado natural.', 'Activo'),
(3, 'Estudio Arquitectura López', 'Corporativo', '30-68991234-1', '341 612-3344', 'info@estudiolopez.com', 'Bv. Oroño 890, Rosario', 'Cliente habitual de anteproyectos. Pausado temporalmente por reformas.', 'Inactivo'),
(4, 'Vidrios y Aluminios del Litoral', 'Corporativo', '30-75489612-5', '341 590-4422', 'ventas@valitoral.com.ar', 'Av. Corrientes 1520, Rosario', 'Proveedor y cliente mayorista para perfiles de alta prestación.', 'Activo'),
(5, 'Lucía Fernández', 'Particular', '27-34567890-4', '341 688-9900', 'lucia.fdez@hotmail.com', 'Córdoba 2340, Rosario', 'Cotización cerramiento balcón con vidrio laminado de seguridad 3+3.', 'Activo'),
(6, 'Edificios Premium SA', 'Corporativo', '33-65239845-9', '341 422-1133', 'obras@premiumsa.com', 'Santa Fe 950, Rosario', 'Complejo residencial 12 pisos. Contrato marco aberturas negras micropulverizadas.', 'Activo');

-- 3. Presupuestos precargados
INSERT INTO `presupuestos` (`id`, `cliente_id`, `numero`, `titulo`, `monto`, `estado`, `fecha`) VALUES
(1, 1, 'P-0045', 'Ventanas Corredizas Línea Módena (Torre Norte PB)', 450000.00, 'Aprobado', '2026-10-12'),
(2, 1, 'P-0042', 'Cerramiento Balcón A30 DVH (Torre Sur 4to B)', 820000.00, 'Pendiente', '2026-09-05'),
(3, 2, 'P-0048', '3 Ventanas Batientes con Mosquitero', 310000.00, 'Aprobado', '2026-11-01'),
(4, 5, 'P-0049', 'Cerramiento Plegable 4 Hojas DVH', 760000.00, 'Pendiente', '2026-11-08'),
(5, 6, 'P-0050', 'Fachada Integral Curtain Wall Piso 1-3', 2500000.00, 'Pendiente', '2026-11-14');

-- 4. Órdenes de trabajo
INSERT INTO `ordenes_trabajo` (`id`, `cliente_id`, `numero`, `descripcion`, `linea_aluminio`, `estado`, `fecha`) VALUES
(1, 1, 'OT-101', 'Armado perfiles y colocación escuadras Módena', 'Módena Anodizado Negro', 'En taller', '2026-11-05'),
(2, 2, 'OT-102', 'Corte y ensamblado batientes de 1.20x1.10', 'Módena Blanco', 'En montaje', '2026-11-09'),
(3, 6, 'OT-103', 'Mecanizado columnas muro cortina', 'A30 New Negro', 'En taller', '2026-11-12');

-- 5. Mantenimientos programados
INSERT INTO `mantenimientos` (`id`, `cliente_id`, `descripcion`, `estado`, `fecha_programada`) VALUES
(1, 1, 'Regulación de rodamientos y felpas en ventanas piso 2', 'Programado', '2026-11-20'),
(2, 2, 'Sellado con silicona neutra estructural perimetral', 'Programado', '2026-11-25'),
(3, 6, 'Inspección de burletes y desagües en ventanales', 'Programado', '2026-12-02');

-- 6. Mensajes de contacto recibidos
INSERT INTO `contactos` (`id`, `nombre`, `email`, `telefono`, `direccion`, `localidad`, `provincia`, `mensaje`) VALUES
(1, 'Carlos Benítez', 'carlosb@gmail.com', '341 511-2233', 'Mitre 450', 'Rosario', 'Santa Fe', 'Hola, quisiera cotizar aberturas de aluminio para una casa en construcción (10 aberturas en total). Gracias.'),
(2, 'Mariana Gómez', 'mgomez@yahoo.com', '341 488-7711', 'Laprida 1120', 'Rosario', 'Santa Fe', 'Buenas tardes, ¿realizan service y cambio de ruedas para puertas corredizas pesadas?');

SET FOREIGN_KEY_CHECKS = 1;
