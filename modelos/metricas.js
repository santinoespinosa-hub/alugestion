/**
 * Modelo de Métricas y Estadísticas - AluGestión
 */

const URL_METRICAS = './api/metricas.php';

/**
 * Obtiene métricas en tiempo real y clientes recientes
 * @returns {Promise<Object>}
 */
export async function obtenerMetricas() {
    const res = await fetch(URL_METRICAS);
    if (!res.ok) {
        throw new Error('Error al cargar métricas del sistema');
    }
    return await res.json();
}
