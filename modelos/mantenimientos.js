/**
 * Modelo de Mantenimientos - AluGestión
 */

import { obtenerToken } from './auth.js';

const URL_BASE = './api/datos.php?tabla=mantenimientos';

const getHeaders = (esJson = false) => {
    const headers = {};
    const token = obtenerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (esJson) headers['Content-Type'] = 'application/json; charset=utf-8';
    return headers;
};

export async function seleccionarMantenimientos(buscar = '') {
    let url = `${URL_BASE}&accion=seleccionar`;
    if (buscar.trim() !== '') {
        url += `&buscar=${encodeURIComponent(buscar.trim())}`;
    }
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
}

export async function insertarMantenimiento(datos) {
    let opciones = {
        method: 'POST',
        headers: getHeaders(datos instanceof FormData ? false : true),
        body: datos instanceof FormData ? datos : JSON.stringify(datos)
    };
    const res = await fetch(`${URL_BASE}&accion=insertar`, opciones);
    return await res.json();
}

export async function actualizarEstadoMantenimiento(id, nuevoEstado) {
    const formData = new FormData();
    formData.append('estado', nuevoEstado);
    const res = await fetch(`${URL_BASE}&accion=actualizar&id=${id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData
    });
    return await res.json();
}
