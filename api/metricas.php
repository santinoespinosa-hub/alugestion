<?php
/**
 * API de Métricas para el Dashboard - AluGestión
 */

header("Content-Type: application/json; charset=utf-8");

require_once 'modelos.php';

try {
    $conexion = new Conexion();
    $db = $conexion->getDb();

    // 1. Clientes
    $resCli = $db->query("SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'Inactivo' THEN 1 ELSE 0 END) as inactivos
    FROM clientes");
    $cliData = $resCli ? $resCli->fetch_assoc() : ['total' => 0, 'activos' => 0, 'inactivos' => 0];

    // 2. Presupuestos Pendientes
    $resPres = $db->query("SELECT COUNT(*) as pendientes FROM presupuestos WHERE estado = 'Pendiente'");
    $presPendientes = $resPres ? intval($resPres->fetch_assoc()['pendientes']) : 0;

    // 3. Pedidos / Órdenes de Trabajo Activas
    $resOrd = $db->query("SELECT COUNT(*) as activas FROM ordenes_trabajo WHERE estado != 'Finalizado'");
    $ordActivas = $resOrd ? intval($resOrd->fetch_assoc()['activas']) : 0;

    // 4. Mantenimientos Programados
    $resMant = $db->query("SELECT COUNT(*) as programados FROM mantenimientos WHERE estado = 'Programado'");
    $mantProgramados = $resMant ? intval($resMant->fetch_assoc()['programados']) : 0;

    // 5. Ingresos Totales de Presupuestos Aprobados
    $resIngresos = $db->query("SELECT COALESCE(SUM(monto), 0) as total FROM presupuestos WHERE estado = 'Aprobado'");
    $ingresosTotal = $resIngresos ? floatval($resIngresos->fetch_assoc()['total']) : 0;

    // 6. Últimos 5 Clientes Registrados
    $resRecientes = $db->query("SELECT id, nombre, tipo, dni_cuit, telefono, direccion, estado, created_at FROM clientes ORDER BY id DESC LIMIT 5");
    $clientesRecientes = $resRecientes ? $resRecientes->fetch_all(MYSQLI_ASSOC) : [];

    echo json_encode([
        'success' => true,
        'metricas' => [
            'clientes_totales'           => intval($cliData['total']),
            'clientes_activos'           => intval($cliData['activos']),
            'clientes_inactivos'         => intval($cliData['inactivos']),
            'presupuestos_pendientes'    => $presPendientes,
            'pedidos_activos'            => $ordActivas,
            'mantenimientos_programados' => $mantProgramados,
            'ingresos_mes'               => $ingresosTotal,
            'ingresos_formato'           => '$' . number_format($ingresosTotal, 0, ',', '.')
        ],
        'clientes_recientes' => $clientesRecientes
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al calcular métricas: ' . $e->getMessage()
    ]);
}
?>
