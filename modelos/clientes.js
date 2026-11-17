/**
 * Modelo de Clientes - AluGestión
 * Mantiene la misma arquitectura REST y llamadas a api/datos.php
 */

import { obtenerToken } from './auth.js';

const URL_BASE = './api/datos.php?tabla=clientes';

const getHeaders = (esJson = false) => {
    const headers = {};
    const token = obtenerToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (esJson) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
    }
    return headers;
};

/**
 * Obtiene la lista de clientes desde la base de datos (con soporte de búsqueda)
 * @param {string} buscar - Término de búsqueda opcional (Nombre o DNI/CUIT)
 * @param {string} criterio - Criterio WHERE opcional
 * @returns {Promise<Array>}
 */
export async function seleccionarClientes(buscar = '', criterio = '') {
    let url = `${URL_BASE}&accion=seleccionar`;
    if (buscar.trim() !== '') {
        url += `&buscar=${encodeURIComponent(buscar.trim())}`;
    } else if (criterio.trim() !== '') {
        url += `&criterio=${encodeURIComponent(criterio.trim())}`;
    }

    const res = await fetch(url, {
        headers: getHeaders()
    });

    if (!res.ok) {
        throw new Error('Error al consultar clientes');
    }

    return await res.json();
}

/**
 * Obtiene un cliente por su ID
 * @param {number|string} id 
 * @returns {Promise<Object|null>}
 */
export async function obtenerClientePorId(id) {
    const res = await fetch(`${URL_BASE}&accion=seleccionar&id=${id}`, {
        headers: getHeaders()
    });
    const datos = await res.json();
    return Array.isArray(datos) && datos.length > 0 ? datos[0] : null;
}

/**
 * Inserta un nuevo cliente en la base de datos
 * @param {FormData|Object} datos 
 * @returns {Promise<Object>}
 */
export async function insertarCliente(datos) {
    let opciones = {
        method: 'POST',
        headers: getHeaders(datos instanceof FormData ? false : true)
    };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else {
        opciones.body = JSON.stringify(datos);
    }

    const res = await fetch(`${URL_BASE}&accion=insertar`, opciones);
    return await res.json();
}

/**
 * Modifica los datos de un cliente existente
 * @param {FormData|Object} datos 
 * @param {number|string} id 
 * @returns {Promise<Object>}
 */
export async function actualizarCliente(datos, id) {
    let opciones = {
        method: 'POST',
        headers: getHeaders(datos instanceof FormData ? false : true)
    };

    if (datos instanceof FormData) {
        opciones.body = datos;
    } else {
        opciones.body = JSON.stringify(datos);
    }

    const res = await fetch(`${URL_BASE}&accion=actualizar&id=${id}`, opciones);
    return await res.json();
}

/**
 * Baja Lógica: Inactiva o Activa un cliente sin eliminarlo físicamente
 * @param {number|string} id 
 * @param {string} nuevoEstado - 'Activo' o 'Inactivo'
 * @returns {Promise<Object>}
 */
export async function cambiarEstadoCliente(id, nuevoEstado = null) {
    const formData = new FormData();
    if (nuevoEstado) {
        formData.append('estado', nuevoEstado);
    }

    const res = await fetch(`${URL_BASE}&accion=baja_logica&id=${id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData
    });
    return await res.json();
}

/**
 * Elimina físicamente un registro (opcional, en caso de requerirse)
 * @param {number|string} id 
 * @returns {Promise<Object>}
 */
export async function eliminarCliente(id) {
    const res = await fetch(`${URL_BASE}&accion=eliminar&id=${id}`, {
        method: 'POST',
        headers: getHeaders()
    });
    return await res.json();
}
