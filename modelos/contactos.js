/**
 * Modelo de Mensajes de Contacto - AluGestión
 */

const URL_INSERTAR = './api/datos.php?tabla=contactos&accion=insertar';
const URL_SELECCIONAR = './api/datos.php?tabla=contactos&accion=seleccionar';

/**
 * Guarda el mensaje del formulario de contacto en MySQL (usado desde index.html)
 * @param {FormData|Object} datos 
 * @returns {Promise<Object>}
 */
export async function enviarContacto(datos) {
    let opciones = { method: 'POST' };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else {
        opciones.headers = { 'Content-Type': 'application/json; charset=utf-8' };
        opciones.body = JSON.stringify(datos);
    }

    const res = await fetch(URL_INSERTAR, opciones);
    return await res.json();
}

/**
 * Obtiene todas las consultas enviadas desde la portada pública
 * @returns {Promise<Array>}
 */
export async function obtenerContactos() {
    const res = await fetch(URL_SELECCIONAR);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.datos || data.data || []);
}