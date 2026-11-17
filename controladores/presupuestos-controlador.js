/**
 * Controlador de Presupuestos de Aberturas - AluGestión
 */

import {
    seleccionarPresupuestos,
    insertarPresupuesto,
    actualizarEstadoPresupuesto,
    eliminarPresupuesto
} from '../modelos/presupuestos.js';
import { seleccionarClientes } from '../modelos/clientes.js';
import { showToast } from './nav-autenticacion.js';

let presupuestosMemoria = [];
let filtroEstado = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    cargarPresupuestos();
    cargarComboClientes();
    inicializarEventos();
});

function inicializarEventos() {
    const inputBuscar = document.querySelector('#input-buscar-presupuesto');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            filtrarYRenderizar(e.target.value);
        });
    }

    const btnsFiltro = document.querySelectorAll('.btn-filtro-pres');
    btnsFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            btnsFiltro.forEach(b => b.classList.remove('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400'));
            btn.classList.add('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400');
            filtroEstado = btn.getAttribute('data-estado');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        });
    });

    const form = document.querySelector('#form-nuevo-presupuesto');
    if (form) {
        form.addEventListener('submit', guardarNuevoPresupuesto);
    }

    window.cambiarEstado = cambiarEstado;
    window.borrarPresupuesto = borrarPresupuesto;
    window.abrirModalPresupuesto = abrirModalPresupuesto;
    window.cerrarModalPresupuesto = cerrarModalPresupuesto;
}

async function cargarComboClientes() {
    const select = document.querySelector('#pres-cliente-id');
    if (!select) return;

    try {
        const clientes = await seleccionarClientes('', "estado = 'Activo'");
        select.innerHTML = '<option value="" disabled selected>Seleccionar cliente...</option>' +
            clientes.map(c => `<option value="${c.id}">${escapar(c.nombre)} (${escapar(c.dni_cuit)})</option>`).join('');
    } catch (e) {
        console.error('Error al cargar clientes:', e);
    }
}

async function cargarPresupuestos() {
    const tbody = document.querySelector('#presupuestos-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400"><div class="flex items-center justify-center gap-2"><div class="loader"></div> Cargando presupuestos...</div></td></tr>`;
    }

    try {
        const datos = await seleccionarPresupuestos();
        presupuestosMemoria = Array.isArray(datos) ? datos : [];
        filtrarYRenderizar();
    } catch (error) {
        console.error('Error al cargar presupuestos:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-300">Error al consultar los presupuestos en MySQL.</td></tr>`;
        }
    }
}

function filtrarYRenderizar(texto = '') {
    const termino = texto.trim().toLowerCase();
    const filtrados = presupuestosMemoria.filter(p => {
        const coincide = !termino ||
            (p.numero && p.numero.toLowerCase().includes(termino)) ||
            (p.titulo && p.titulo.toLowerCase().includes(termino)) ||
            (p.cliente_nombre && p.cliente_nombre.toLowerCase().includes(termino));

        const coincideEst = (filtroEstado === 'todos') || (p.estado === filtroEstado);
        return coincide && coincideEst;
    });

    renderizarTabla(filtrados);
}

function renderizarTabla(lista) {
    const tbody = document.querySelector('#presupuestos-table-body');
    const totalElem = document.querySelector('#total-presupuestos-count');
    if (!tbody) return;

    if (totalElem) {
        totalElem.textContent = `${lista.length} de ${presupuestosMemoria.length} presupuestos`;
    }

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400"><i class="ph ph-file-text text-3xl mb-1 block text-slate-500"></i> No se encontraron presupuestos.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => {
        const badgeColor = p.estado === 'Aprobado' 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : p.estado === 'Pendiente'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30';

        const montoFormato = '$ ' + Number(p.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 });

        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-mono text-cyan-300 text-xs font-bold">${escapar(p.numero)}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${escapar(p.titulo)}</div>
                    <div class="text-xs text-slate-400">Cliente: ${escapar(p.cliente_nombre || 'No asignado')}</div>
                </td>
                <td class="px-6 py-4 font-semibold text-white">${montoFormato}</td>
                <td class="px-6 py-4 text-xs text-slate-300">${escapar(p.fecha)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}">
                        ${escapar(p.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${p.estado !== 'Aprobado' ? `
                            <button onclick="cambiarEstado(${p.id}, 'Aprobado')" class="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs" title="Aprobar Presupuesto">
                                <i class="ph ph-check text-base"></i>
                            </button>
                        ` : ''}
                        ${p.estado !== 'Rechazado' ? `
                            <button onclick="cambiarEstado(${p.id}, 'Rechazado')" class="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs" title="Rechazar Presupuesto">
                                <i class="ph ph-x text-base"></i>
                            </button>
                        ` : ''}
                        <button onclick="borrarPresupuesto(${p.id})" class="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 text-xs" title="Eliminar">
                            <i class="ph ph-trash text-base"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function guardarNuevoPresupuesto(e) {
    e.preventDefault();
    const cliente_id = document.querySelector('#pres-cliente-id').value;
    const titulo = document.querySelector('#pres-titulo').value.trim();
    const linea = document.querySelector('#pres-linea').value;
    const monto = document.querySelector('#pres-monto').value;
    const estado = document.querySelector('#pres-estado').value;

    if (!cliente_id || !titulo || !monto) {
        showToast('Completa los campos requeridos', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('cliente_id', cliente_id);
    formData.append('titulo', `${titulo} (Línea ${linea})`);
    formData.append('monto', monto);
    formData.append('estado', estado);
    formData.append('fecha', new Date().toISOString().split('T')[0]);

    try {
        const res = await insertarPresupuesto(formData);
        if (res.success || res.id > 0) {
            showToast('Presupuesto creado con éxito', 'success');
            cerrarModalPresupuesto();
            document.querySelector('#form-nuevo-presupuesto').reset();
            await cargarPresupuestos();
        } else {
            showToast(res.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de comunicación con MySQL', 'error');
    }
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const res = await actualizarEstadoPresupuesto(id, nuevoEstado);
        if (res.success) {
            showToast(`Presupuesto actualizado a ${nuevoEstado}`, 'success');
            await cargarPresupuestos();
        }
    } catch (e) {
        showToast('Error al actualizar estado', 'error');
    }
}

async function borrarPresupuesto(id) {
    if (!confirm('¿Deseas eliminar este presupuesto?')) return;
    try {
        const res = await eliminarPresupuesto(id);
        if (res.success) {
            showToast('Presupuesto eliminado', 'success');
            await cargarPresupuestos();
        }
    } catch (e) {
        showToast('Error al eliminar', 'error');
    }
}

function abrirModalPresupuesto() {
    document.querySelector('#modal-presupuesto').classList.remove('hidden');
}
function cerrarModalPresupuesto() {
    document.querySelector('#modal-presupuesto').classList.add('hidden');
}

function escapar(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.innerText = s;
    return d.innerHTML;
}
