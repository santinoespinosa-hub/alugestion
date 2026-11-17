/**
 * Modelo de Órdenes de Trabajo - AluGestión
 */

import { obtenerToken } from './auth.js';

const URL_BASE = './api/datos.php?tabla=ordenes_trabajo';

const getHeaders = (esJson = false) => {
    const headers = {};
    const token = obtenerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (esJson) headers['Content-Type'] = 'application/json; charset=utf-8';
    return headers;
};

export async function seleccionarOrdenes(buscar = '') {
    let url = `${URL_BASE}&accion=seleccionar`;
    if (buscar.trim() !== '') {
        url += `&buscar=${encodeURIComponent(buscar.trim())}`;
    }
    const res = await fetch(url, { headers: getHeaders() });
    return await res.json();
}

export async function insertarOrden(datos) {
    let opciones = {
        method: 'POST',
        headers: getHeaders(datos instanceof FormData ? false : true),
        body: datos instanceof FormData ? datos : JSON.stringify(datos)
    };
    const res = await fetch(`${URL_BASE}&accion=insertar`, opciones);
    return await res.json();
}

export async function actualizarEstadoOrden(id, nuevoEstado) {
    const formData = new FormData();
    formData.append('estado', nuevoEstado);
    const res = await fetch(`${URL_BASE}&accion=actualizar&id=${id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData
    });
    return await res.json();
}
