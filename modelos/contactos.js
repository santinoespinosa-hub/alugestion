/**
 * Modelo de Mensajes de Contacto - AluGestión
 */

const URL_CONTACTO = './api/datos.php?tabla=contactos&accion=insertar';

/**
 * Guarda el mensaje del formulario de contacto en MySQL
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

    const res = await fetch(URL_CONTACTO, opciones);
    return await res.json();
}
