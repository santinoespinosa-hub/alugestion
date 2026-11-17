<?php
/**
 * Verificación de Token JWT - AluGestión
 * Basado en la arquitectura del proyecto de referencia
 */

require_once 'config.php';

function validarToken($rolesPermitidos = []) {
    $authHeader = '';

    // Soporte para getallheaders() y variables de entorno de servidor Apache
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $headers['Autorization'] ?? $headers['autorization'] ?? '';
    }

    if (empty($authHeader)) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    }

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Acceso denegado: Token no proporcionado o formato inválido'
        ]);
        exit;
    }

    $jwt = $matches[1];
    $tokenParts = explode('.', $jwt);

    if (count($tokenParts) !== 3) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Estructura de Token inválida'
        ]);
        exit;
    }

    $header = $tokenParts[0];
    $payload = $tokenParts[1];
    $signature = $tokenParts[2];

    // Verificar firma con HMAC-SHA256
    $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true)));

    if ($signature !== $validSignature) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Firma de token inválida'
        ]);
        exit;
    }

    // Verificar expiración
    $payloadData = json_decode(base64_decode($payload), true);
    if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'El Token ha expirado'
        ]);
        exit;
    }

    // Verificación de Roles
    if (!empty($rolesPermitidos)) {
        $rolUsuario = $payloadData['rol'] ?? '';
        if (!in_array($rolUsuario, $rolesPermitidos, true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Acceso denegado: No posee los permisos necesarios'
            ]);
            exit;
        }
    }

    return $payloadData; // Devuelve los datos del usuario autenticado
}
?>
