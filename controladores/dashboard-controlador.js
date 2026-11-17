/**
 * Controlador del Dashboard Principal - AluGestión
 */

import { obtenerMetricas } from '../modelos/metricas.js';
import { showToast } from './nav-autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDashboard();

    const btnNuevoCliente = document.querySelector('#btn-nuevo-cliente-dash');
    if (btnNuevoCliente) {
        btnNuevoCliente.addEventListener('click', () => {
            window.location.href = 'clientes.html?action=nuevo';
        });
    }
});

async function cargarDatosDashboard() {
    try {
        const respuesta = await obtenerMetricas();

        if (respuesta.success && respuesta.metricas) {
            const m = respuesta.metricas;

            actualizarTexto('#stat-presupuestos', m.presupuestos_pendientes ?? '14');
            actualizarTexto('#stat-pedidos', m.pedidos_activos ?? '28');
            actualizarTexto('#stat-mantenimientos', m.mantenimientos_programados ?? '7');
            actualizarTexto('#stat-ingresos', m.ingresos_formato || ('$' + (m.ingresos_mes ? (m.ingresos_mes / 1000000).toFixed(1) + 'M' : '1.2M')));
            
            if (document.querySelector('#stat-clientes-totales')) {
                actualizarTexto('#stat-clientes-totales', `${m.clientes_totales || 0} (${m.clientes_activos || 0} activos)`);
            }
        }

        if (respuesta.clientes_recientes && Array.isArray(respuesta.clientes_recientes)) {
            renderizarClientesRecientes(respuesta.clientes_recientes);
        }
    } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error);
        // Mantiene valores por defecto visualmente sin romper la interfaz
    }
}

function renderizarClientesRecientes(clientes) {
    const tbody = document.querySelector('#dashboard-recent-clients');
    if (!tbody || clientes.length === 0) return;

    tbody.innerHTML = clientes.map(c => {
        const esActivo = (c.estado === 'Activo');
        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-3 font-medium text-white">${escapar(c.nombre)}</td>
                <td class="px-6 py-3 text-slate-300 font-mono text-xs">${escapar(c.dni_cuit)}</td>
                <td class="px-6 py-3 text-slate-300">${escapar(c.telefono || 'S/D')}</td>
                <td class="px-6 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        esActivo 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-500/30 text-slate-300 border border-slate-500/30'
                    }">
                        ${esActivo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-3 text-right">
                    <a href="clientes.html" class="text-cyan-400 hover:text-cyan-300 text-xs font-medium inline-flex items-center gap-1">
                        Ver <i class="ph ph-arrow-right"></i>
                    </a>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarTexto(selector, valor) {
    const elem = document.querySelector(selector);
    if (elem) elem.textContent = valor;
}

function escapar(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.innerText = str;
    return d.innerHTML;
}
