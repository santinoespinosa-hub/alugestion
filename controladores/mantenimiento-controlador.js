/**
 * Controlador de Mantenimientos y Services - AluGestión
 */

import {
    seleccionarMantenimientos,
    insertarMantenimiento,
    actualizarEstadoMantenimiento
} from '../modelos/mantenimientos.js';
import { seleccionarClientes } from '../modelos/clientes.js';
import { showToast } from './nav-autenticacion.js';

let mantenimientosMemoria = [];
let filtroEstado = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    cargarMantenimientos();
    cargarComboClientes();
    inicializarEventos();
});

function inicializarEventos() {
    const inputBuscar = document.querySelector('#input-buscar-mant');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            filtrarYRenderizar(e.target.value);
        });
    }

    const btnsFiltro = document.querySelectorAll('.btn-filtro-mant');
    btnsFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            btnsFiltro.forEach(b => b.classList.remove('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400'));
            btn.classList.add('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400');
            filtroEstado = btn.getAttribute('data-estado');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        });
    });

    const form = document.querySelector('#form-nuevo-mant');
    if (form) {
        form.addEventListener('submit', guardarNuevoMantenimiento);
    }

    window.cambiarEstadoMant = cambiarEstadoMant;
    window.abrirModalMant = abrirModalMant;
    window.cerrarModalMant = cerrarModalMant;
}

async function cargarComboClientes() {
    const select = document.querySelector('#mant-cliente-id');
    if (!select) return;

    try {
        const clientes = await seleccionarClientes('', "estado = 'Activo'");
        select.innerHTML = '<option value="" disabled selected>Seleccionar cliente...</option>' +
            clientes.map(c => `<option value="${c.id}">${escapar(c.nombre)} (${escapar(c.dni_cuit)})</option>`).join('');
    } catch (e) {
        console.error('Error al cargar clientes:', e);
    }
}

async function cargarMantenimientos() {
    const tbody = document.querySelector('#mant-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400"><div class="flex items-center justify-center gap-2"><div class="loader"></div> Cargando servicios de mantenimiento...</div></td></tr>`;
    }

    try {
        const datos = await seleccionarMantenimientos();
        mantenimientosMemoria = Array.isArray(datos) ? datos : [];
        filtrarYRenderizar();
    } catch (error) {
        console.error('Error al cargar mantenimientos:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-red-300">Error al consultar mantenimientos en MySQL.</td></tr>`;
        }
    }
}

function filtrarYRenderizar(texto = '') {
    const termino = texto.trim().toLowerCase();
    const filtrados = mantenimientosMemoria.filter(m => {
        const coincide = !termino ||
            (m.descripcion && m.descripcion.toLowerCase().includes(termino)) ||
            (m.cliente_nombre && m.cliente_nombre.toLowerCase().includes(termino));

        const coincideEst = (filtroEstado === 'todos') || (m.estado === filtroEstado);
        return coincide && coincideEst;
    });

    renderizarTabla(filtrados);
}

function renderizarTabla(lista) {
    const tbody = document.querySelector('#mant-table-body');
    const totalElem = document.querySelector('#total-mant-count');
    if (!tbody) return;

    if (totalElem) {
        totalElem.textContent = `${lista.length} de ${mantenimientosMemoria.length} servicios`;
    }

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400"><i class="ph ph-calendar-check text-3xl mb-1 block text-slate-500"></i> No se encontraron servicios de mantenimiento.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(m => {
        const badgeColor = m.estado === 'Realizado' 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : m.estado === 'Programado'
            ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
            : 'bg-slate-500/30 text-slate-300 border-slate-500/30';

        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${escapar(m.descripcion)}</div>
                    <div class="text-xs text-slate-400">Dirección: ${escapar(m.direccion || 'Taller')}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-white">${escapar(m.cliente_nombre || 'No asignado')}</div>
                    <div class="text-xs text-cyan-300">${escapar(m.telefono || 'Sin tel')}</div>
                </td>
                <td class="px-6 py-4 text-xs font-semibold text-cyan-300">${escapar(m.fecha_programada)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}">
                        ${escapar(m.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${m.estado !== 'Realizado' ? `
                            <button onclick="cambiarEstadoMant(${m.id}, 'Realizado')" class="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs" title="Marcar Realizado">
                                <i class="ph ph-check text-base"></i> Realizado
                            </button>
                        ` : `
                            <button onclick="cambiarEstadoMant(${m.id}, 'Programado')" class="p-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 text-xs" title="Reprogramar">
                                <i class="ph ph-clock-clockwise text-base"></i> Reprogramar
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function guardarNuevoMantenimiento(e) {
    e.preventDefault();
    const cliente_id = document.querySelector('#mant-cliente-id').value;
    const descripcion = document.querySelector('#mant-descripcion').value.trim();
    const fecha_programada = document.querySelector('#mant-fecha').value;
    const estado = document.querySelector('#mant-estado').value;

    if (!cliente_id || !descripcion || !fecha_programada) {
        showToast('Completa los campos requeridos', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('cliente_id', cliente_id);
    formData.append('descripcion', descripcion);
    formData.append('fecha_programada', fecha_programada);
    formData.append('estado', estado);

    try {
        const res = await insertarMantenimiento(formData);
        if (res.success || res.id > 0) {
            showToast('Service de mantenimiento programado', 'success');
            cerrarModalMant();
            document.querySelector('#form-nuevo-mant').reset();
            await cargarMantenimientos();
        } else {
            showToast(res.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de comunicación con MySQL', 'error');
    }
}

async function cambiarEstadoMant(id, nuevoEstado) {
    try {
        const res = await actualizarEstadoMantenimiento(id, nuevoEstado);
        if (res.success) {
            showToast(`Mantenimiento actualizado a ${nuevoEstado}`, 'success');
            await cargarMantenimientos();
        }
    } catch (e) {
        showToast('Error al actualizar estado', 'error');
    }
}

function abrirModalMant() {
    document.querySelector('#modal-mant').classList.remove('hidden');
}
function cerrarModalMant() {
    document.querySelector('#modal-mant').classList.add('hidden');
}

function escapar(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.innerText = s;
    return d.innerHTML;
}
