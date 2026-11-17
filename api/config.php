<?php
/**
 * Configuración de la Base de Datos y JWT - AluGestión
 * Arquitectura basada en proyecto de referencia
 */

define('DB_HOST', 'localhost');          // Servidor MySQL
define('DB_USER', 'root');               // Usuario MySQL
define('DB_PASS', '');                   // Contraseña MySQL (WAMP por defecto vacía)
define('DB_NAME', 'alugestion');         // Base de Datos de AluGestión
define('DB_CHARSET', 'utf8mb4');         // Cotejamiento de caracteres

/* Configuración de seguridad JWT */
define('JWT_SECRET', 'AluGestion_SecretKey_2026_SecureJWT!'); // Clave de firma
define('JWT_EXP', 86400);                // El token expira en 24h (86400 segundos)
?>
