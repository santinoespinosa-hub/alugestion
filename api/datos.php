<?php
/**
 * API Universal de Datos - AluGestión
 * Mantiene la misma arquitectura y endpoint que el proyecto de referencia:
 * api/datos.php?tabla={nombre_tabla}&accion={accion}&id={id}
 */

header("Content-Type: application/json; charset=utf-8");

require_once 'modelos.php';
require_once 'auth.php';

// Obtener datos recibidos (POST form-data o JSON raw)
$inputRaw = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);
$valores = !empty($_POST) ? $_POST : ($inputData ?? []);

if (isset($_GET['tabla'])) {
    $nombreTabla = preg_replace('/[^a-zA-Z0-9_]/', '', $_GET['tabla']);
    $tabla = new Modelo($nombreTabla);

    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $id = intval($_GET['id']);
        $tabla->setCriterio("id = $id");
    }

    if (isset($_GET['accion'])) {
        $accion = $_GET['accion'];

        // Manejo de seguridad / roles si aplica
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $hasAuth = !empty($headers['Authorization'] ?? $headers['authorization'] ?? $headers['Autorization'] ?? $headers['autorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '');
        
        // El formulario de contacto público no requiere autenticación
        if ($nombreTabla !== 'contactos' && $hasAuth && in_array($accion, ['insertar', 'actualizar', 'eliminar', 'baja_logica'], true)) {
            validarToken(['admin', 'operador', 'gerente']);
        }

        switch ($accion) {
            case 'seleccionar':
                // Soporte enriquecido con JOIN de Clientes para Presupuestos, Órdenes y Mantenimiento
                if ($nombreTabla === 'presupuestos' && !isset($_GET['id'])) {
                    $sql = "SELECT p.*, c.nombre as cliente_nombre FROM presupuestos p LEFT JOIN clientes c ON p.cliente_id = c.id";
                    if (isset($_GET['buscar']) && trim($_GET['buscar']) !== '') {
                        $termino = addslashes(trim($_GET['buscar']));
                        $sql .= " WHERE (p.numero LIKE '%$termino%' OR p.titulo LIKE '%$termino%' OR c.nombre LIKE '%$termino%')";
                    }
                    $sql .= " ORDER BY p.id DESC";
                    $datos = $tabla->consultarSql($sql);
                    echo json_encode($datos);
                    break;
                }

                if ($nombreTabla === 'ordenes_trabajo' && !isset($_GET['id'])) {
                    $sql = "SELECT o.*, c.nombre as cliente_nombre FROM ordenes_trabajo o LEFT JOIN clientes c ON o.cliente_id = c.id";
                    if (isset($_GET['buscar']) && trim($_GET['buscar']) !== '') {
                        $termino = addslashes(trim($_GET['buscar']));
                        $sql .= " WHERE (o.numero LIKE '%$termino%' OR o.descripcion LIKE '%$termino%' OR c.nombre LIKE '%$termino%' OR o.linea_aluminio LIKE '%$termino%')";
                    }
                    $sql .= " ORDER BY o.id DESC";
                    $datos = $tabla->consultarSql($sql);
                    echo json_encode($datos);
                    break;
                }

                if ($nombreTabla === 'mantenimientos' && !isset($_GET['id'])) {
                    $sql = "SELECT m.*, c.nombre as cliente_nombre, c.telefono, c.direccion FROM mantenimientos m LEFT JOIN clientes c ON m.cliente_id = c.id";
                    if (isset($_GET['buscar']) && trim($_GET['buscar']) !== '') {
                        $termino = addslashes(trim($_GET['buscar']));
                        $sql .= " WHERE (m.descripcion LIKE '%$termino%' OR c.nombre LIKE '%$termino%')";
                    }
                    $sql .= " ORDER BY m.id DESC";
                    $datos = $tabla->consultarSql($sql);
                    echo json_encode($datos);
                    break;
                }

                // Selección estándar para Clientes y otras tablas
                if (isset($_GET['buscar']) && trim($_GET['buscar']) !== '') {
                    $termino = addslashes(trim($_GET['buscar']));
                    if ($nombreTabla === 'clientes') {
                        $tabla->setCriterio("(nombre LIKE '%$termino%' OR dni_cuit LIKE '%$termino%' OR email LIKE '%$termino%')");
                    } else {
                        $tabla->setCriterio("(nombre LIKE '%$termino%')");
                    }
                } elseif (isset($_GET['criterio']) && !empty($_GET['criterio'])) {
                    $tabla->setCriterio($_GET['criterio']);
                }

                if (isset($_GET['limite']) && is_numeric($_GET['limite'])) {
                    $tabla->setLimite(intval($_GET['limite']));
                }

                $datos = $tabla->seleccionar();
                echo json_encode($datos);
                break;

            case 'insertar':
                // Validación para Clientes
                if ($nombreTabla === 'clientes') {
                    $nombre   = trim($valores['nombre'] ?? '');
                    $dni_cuit = trim($valores['dni_cuit'] ?? '');

                    if (empty($nombre) || empty($dni_cuit)) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'El Nombre/Razón Social y DNI/CUIT son obligatorios'
                        ]);
                        exit;
                    }

                    $validador = new Modelo('clientes');
                    $dni_seguro = addslashes($dni_cuit);
                    $validador->setCriterio("dni_cuit = '$dni_seguro'");
                    $validador->setLimite(1);
                    $existente = $validador->seleccionar();

                    if (!empty($existente)) {
                        http_response_code(409);
                        echo json_encode([
                            'success' => false,
                            'message' => "Ya existe un cliente registrado con el DNI/CUIT '$dni_cuit'"
                        ]);
                        exit;
                    }

                    if (!isset($valores['estado']) || empty($valores['estado'])) {
                        $valores['estado'] = 'Activo';
                    }
                }

                // Generación de número correlativo para Presupuestos si no viene
                if ($nombreTabla === 'presupuestos' && empty($valores['numero'])) {
                    $valores['numero'] = 'P-' . str_pad(rand(51, 999), 4, '0', STR_PAD_LEFT);
                }

                // Generación de número correlativo para Órdenes si no viene
                if ($nombreTabla === 'ordenes_trabajo' && empty($valores['numero'])) {
                    $valores['numero'] = 'OT-' . rand(105, 999);
                }

                // Asegurar fecha si no viene
                if (in_array($nombreTabla, ['presupuestos', 'ordenes_trabajo'], true) && empty($valores['fecha'])) {
                    $valores['fecha'] = date('Y-m-d');
                }

                // Inserción genérica
                $id_insertado = $tabla->insertar($valores);

                if ($id_insertado > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Registro guardado exitosamente',
                        'id'      => $id_insertado
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error al insertar el registro en la base de datos'
                    ]);
                }
                break;

            case 'actualizar':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Falta el ID del registro a actualizar']);
                    exit;
                }

                $id_act = intval($_GET['id']);
                $tabla->setCriterio("id = $id_act");

                if ($nombreTabla === 'clientes' && isset($valores['dni_cuit'])) {
                    $dni_cuit = trim($valores['dni_cuit']);
                    $validador = new Modelo('clientes');
                    $dni_seguro = addslashes($dni_cuit);
                    $validador->setCriterio("dni_cuit = '$dni_seguro' AND id != $id_act");
                    $validador->setLimite(1);
                    $existente = $validador->seleccionar();

                    if (!empty($existente)) {
                        http_response_code(409);
                        echo json_encode([
                            'success' => false,
                            'message' => "El DNI/CUIT '$dni_cuit' ya pertenece a otro cliente"
                        ]);
                        exit;
                    }
                }

                $resultado = $tabla->actualizar($valores);
                echo json_encode([
                    'success' => (bool)$resultado,
                    'message' => $resultado ? 'Registro actualizado con éxito' : 'No se detectaron cambios o hubo un error'
                ]);
                break;

            case 'baja_logica':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Falta el ID del registro']);
                    exit;
                }
                $id_registro = intval($_GET['id']);
                $nuevo_estado = $valores['estado'] ?? $_GET['estado'] ?? null;

                if (!$nuevo_estado) {
                    $tabla->setCriterio("id = $id_registro");
                    $actual = $tabla->seleccionar();
                    if (!empty($actual)) {
                        $nuevo_estado = ($actual[0]['estado'] === 'Activo') ? 'Inactivo' : 'Activo';
                    } else {
                        $nuevo_estado = 'Inactivo';
                    }
                }

                $tabla->setCriterio("id = $id_registro");
                $actualizado = $tabla->actualizar(['estado' => $nuevo_estado]);

                echo json_encode([
                    'success'     => (bool)$actualizado,
                    'nuevo_estado'=> $nuevo_estado,
                    'message'     => $actualizado ? "Estado cambiado a '$nuevo_estado' correctamente" : 'Error al cambiar estado'
                ]);
                break;

            case 'eliminar':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Falta el ID del registro']);
                    exit;
                }
                $resultado = $tabla->eliminar();
                echo json_encode([
                    'success' => (bool)$resultado,
                    'message' => $resultado ? 'Registro eliminado de la base de datos' : 'Error al eliminar registro'
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
                break;
        }
    } else {
        $datos = $tabla->seleccionar();
        echo json_encode($datos);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Parámetro de tabla no especificado']);
}
?>
