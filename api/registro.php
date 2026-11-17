<?php
/**
 * API de Registro de Usuarios - AluGestión
 * Mantiene la misma arquitectura del proyecto de referencia
 */

header("Content-Type: application/json; charset=utf-8");

require_once 'modelos.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);

$valores = !empty($_POST) ? $_POST : ($inputData ?? []);

$nombre   = trim($valores['nombre'] ?? '');
$apellido = trim($valores['apellido'] ?? '');
$usuario  = trim($valores['usuario'] ?? '');
$email    = trim($valores['email'] ?? '');
$password = $valores['password'] ?? '';

// Asignar rol por defecto seguro
if (!isset($valores['rol']) || empty($valores['rol'])) {
    $valores['rol'] = 'admin'; // Rol inicial para gestión completa de AluGestión
}

if ($nombre === '' || $usuario === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Por favor, completa los campos obligatorios (*)'
    ]);
    exit;
}

$usuarios = new Modelo('usuarios');
$usuario_seguro = addslashes($usuario);
$usuarios->setCampos('id');
$usuarios->setCriterio("usuario='$usuario_seguro'");
$usuarios->setLimite(1);
$consulta = $usuarios->seleccionar();

if (!empty($consulta)) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'El nombre de usuario ya está registrado en el sistema'
    ]);
    exit;
}

// Si se proporcionó email, verificar que tampoco esté duplicado
if (!empty($email)) {
    $email_seguro = addslashes($email);
    $usuarios->setCriterio("email='$email_seguro'");
    $usuarios->setLimite(1);
    $consultaEmail = $usuarios->seleccionar();
    if (!empty($consultaEmail)) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'El correo electrónico ya está registrado'
        ]);
        exit;
    }
}

// Insertar en la BD
$id = $usuarios->insertar($valores);

if ($id > 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Usuario registrado exitosamente',
        'id'      => $id
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar el usuario en la base de datos'
    ]);
}
?>
