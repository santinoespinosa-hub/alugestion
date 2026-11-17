/**
 * Modelo de Autenticación y Sesión - AluGestión
 * Basado en la arquitectura de referencia
 */

const URL_LOGIN = './api/login.php';
const URL_REGISTRO = './api/registro.php';

/**
 * Envía los datos del nuevo usuario para registrarlo en la BD
 * @param {FormData|Object} datos 
 * @returns {Promise<Object>}
 */
export const registrar = async (datos) => {
    let opciones = { method: 'POST' };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else {
        opciones.headers = { 'Content-Type': 'application/json; charset=utf-8' };
        opciones.body = JSON.stringify(datos);
    }

    const res = await fetch(URL_REGISTRO, opciones);
    return await res.json();
};

/**
 * Inicia sesión enviando usuario y clave
 * @param {FormData|Object} datos - Credenciales
 * @returns {Promise<Object>}
 */
export const login = async (datos) => {
    let opciones = { method: 'POST' };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else {
        opciones.headers = { 'Content-Type': 'application/json; charset=utf-8' };
        opciones.body = JSON.stringify(datos);
    }

    const res = await fetch(URL_LOGIN, opciones);
    const data = await res.json();

    if (data.success && data.token) {
        sessionStorage.setItem('alugestion_jwt_token', data.token);
        sessionStorage.setItem('alugestion_usuario', JSON.stringify(data.usuario));
    }

    return data;
};

/**
 * Cierra la sesión activa y redirige al login
 */
export const logout = () => {
    sessionStorage.removeItem('alugestion_jwt_token');
    sessionStorage.removeItem('alugestion_usuario');
    window.location.href = 'login.html';
};

/**
 * Obtiene el token JWT guardado en la sesión
 * @returns {string|null}
 */
export function obtenerToken() {
    return sessionStorage.getItem('alugestion_jwt_token');
}

/**
 * Obtiene la información del usuario autenticado
 * @returns {Object|null}
 */
export function obtenerUsuarioActual() {
    const usuario = sessionStorage.getItem('alugestion_usuario');
    try {
        return usuario ? JSON.parse(usuario) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Verifica si existe una sesión activa; si no, redirige al login
 */
export function protegerRuta() {
    const token = obtenerToken();
    const usuario = obtenerUsuarioActual();
    if (!token || !usuario) {
        window.location.href = 'login.html';
    }
}
