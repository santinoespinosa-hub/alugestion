<?php
/**
 * API de Login y Autenticación JWT - AluGestión
 * Mantiene la misma estructura de la API de referencia
 */

header("Content-Type: application/json; charset=utf-8");

require_once 'config.php';
require_once 'modelos.php';

// Aceptar datos desde $_POST tradicional o desde JSON raw
$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

$usuario_recibido = trim($_POST['usuario'] ?? $inputData['usuario'] ?? $_POST['email'] ?? $inputData['email'] ?? '');
$pass_recibida = $_POST['password'] ?? $inputData['password'] ?? '';

if (empty($usuario_recibido) || empty($pass_recibida)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Por favor, proporcione usuario (o correo) y contraseña'
    ]);
    exit;
}

$tabla = new Modelo('usuarios');
$usuario_seguro = addslashes($usuario_recibido);
$tabla->setCriterio("usuario='$usuario_seguro' OR email='$usuario_seguro'");
$tabla->setLimite(1);
$resultado = $tabla->seleccionar();

if (!empty($resultado)) {
    $usuario = $resultado[0];

    if (password_verify($pass_recibida, $usuario['password'])) {
        // Estructura del JWT
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        // Payload con datos reales del usuario
        $payload = json_encode([
            'user_id' => $usuario['id'],
            'usuario' => $usuario['usuario'],
            'nombre'  => $usuario['nombre'],
            'apellido'=> $usuario['apellido'],
            'email'   => $usuario['email'],
            'rol'     => $usuario['rol'],
            'iat'     => time(),
            'exp'     => time() + JWT_EXP
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        // Firma HMAC-SHA256 con la clave secreta
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        // Token JWT final
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        echo json_encode([
            'success' => true,
            'message' => 'Autenticación exitosa',
            'token'   => $jwt,
            'usuario' => [
                'id'       => $usuario['id'],
                'nombre'   => $usuario['nombre'],
                'apellido' => $usuario['apellido'],
                'usuario'  => $usuario['usuario'],
                'email'    => $usuario['email'],
                'rol'      => $usuario['rol']
            ]
        ]);
        exit;
    }
}

// Credenciales inválidas
http_response_code(401);
echo json_encode([
    'success' => false,
    'message' => 'Usuario o contraseña incorrectos'
]);
?>
