/**
 * Controlador de Órdenes de Trabajo en Taller - AluGestión
 */

import {
    seleccionarOrdenes,
    insertarOrden,
    actualizarEstadoOrden
} from '../modelos/ordenes.js';
import { seleccionarClientes } from '../modelos/clientes.js';
import { showToast } from './nav-autenticacion.js';

let ordenesMemoria = [];
let filtroEstado = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    cargarOrdenes();
    cargarComboClientes();
    inicializarEventos();
});

function inicializarEventos() {
    const inputBuscar = document.querySelector('#input-buscar-orden');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            filtrarYRenderizar(e.target.value);
        });
    }

    const btnsFiltro = document.querySelectorAll('.btn-filtro-ot');
    btnsFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            btnsFiltro.forEach(b => b.classList.remove('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400'));
            btn.classList.add('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400');
            filtroEstado = btn.getAttribute('data-estado');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        });
    });

    const form = document.querySelector('#form-nueva-ot');
    if (form) {
        form.addEventListener('submit', guardarNuevaOrden);
    }

    window.cambiarEstadoOT = cambiarEstadoOT;
    window.abrirModalOT = abrirModalOT;
    window.cerrarModalOT = cerrarModalOT;
}

async function cargarComboClientes() {
    const select = document.querySelector('#ot-cliente-id');
    if (!select) return;

    try {
        const clientes = await seleccionarClientes('', "estado = 'Activo'");
        select.innerHTML = '<option value="" disabled selected>Seleccionar cliente...</option>' +
            clientes.map(c => `<option value="${c.id}">${escapar(c.nombre)} (${escapar(c.dni_cuit)})</option>`).join('');
    } catch (e) {
        console.error('Error al cargar clientes:', e);
    }
}

async function cargarOrdenes() {
    const tbody = document.querySelector('#ordenes-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400"><div class="flex items-center justify-center gap-2"><div class="loader"></div> Cargando órdenes de trabajo...</div></td></tr>`;
    }

    try {
        const datos = await seleccionarOrdenes();
        ordenesMemoria = Array.isArray(datos) ? datos : [];
        filtrarYRenderizar();
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-red-300">Error al consultar órdenes en MySQL.</td></tr>`;
        }
    }
}

function filtrarYRenderizar(texto = '') {
    const termino = texto.trim().toLowerCase();
    const filtrados = ordenesMemoria.filter(o => {
        const coincide = !termino ||
            (o.numero && o.numero.toLowerCase().includes(termino)) ||
            (o.descripcion && o.descripcion.toLowerCase().includes(termino)) ||
            (o.linea_aluminio && o.linea_aluminio.toLowerCase().includes(termino)) ||
            (o.cliente_nombre && o.cliente_nombre.toLowerCase().includes(termino));

        const coincideEst = (filtroEstado === 'todos') || (o.estado === filtroEstado);
        return coincide && coincideEst;
    });

    renderizarTabla(filtrados);
}

function renderizarTabla(lista) {
    const tbody = document.querySelector('#ordenes-table-body');
    const totalElem = document.querySelector('#total-ordenes-count');
    if (!tbody) return;

    if (totalElem) {
        totalElem.textContent = `${lista.length} de ${ordenesMemoria.length} órdenes`;
    }

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400"><i class="ph ph-wrench text-3xl mb-1 block text-slate-500"></i> No se encontraron órdenes de trabajo.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(o => {
        const badgeColor = o.estado === 'Finalizado' 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : o.estado === 'En montaje'
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            : o.estado === 'En taller'
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-mono text-cyan-300 text-xs font-bold">${escapar(o.numero)}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${escapar(o.descripcion)}</div>
                    <div class="text-xs text-slate-400">Cliente: ${escapar(o.cliente_nombre || 'No asignado')}</div>
                </td>
                <td class="px-6 py-4 text-xs font-semibold text-slate-300">${escapar(o.linea_aluminio)}</td>
                <td class="px-6 py-4 text-xs text-slate-300">${escapar(o.fecha)}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}">
                        ${escapar(o.estado)}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="cambiarEstadoOT(${o.id}, 'En taller')" class="px-2 py-1 rounded text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30" title="Pasar a Taller">
                            Taller
                        </button>
                        <button onclick="cambiarEstadoOT(${o.id}, 'En montaje')" class="px-2 py-1 rounded text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30" title="Pasar a Montaje">
                            Montaje
                        </button>
                        <button onclick="cambiarEstadoOT(${o.id}, 'Finalizado')" class="px-2 py-1 rounded text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30" title="Finalizar Obra">
                            Fin
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function guardarNuevaOrden(e) {
    e.preventDefault();
    const cliente_id = document.querySelector('#ot-cliente-id').value;
    const descripcion = document.querySelector('#ot-descripcion').value.trim();
    const linea_aluminio = document.querySelector('#ot-linea').value;
    const estado = document.querySelector('#ot-estado').value;

    if (!cliente_id || !descripcion) {
        showToast('Completa los campos requeridos', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('cliente_id', cliente_id);
    formData.append('descripcion', descripcion);
    formData.append('linea_aluminio', linea_aluminio);
    formData.append('estado', estado);
    formData.append('fecha', new Date().toISOString().split('T')[0]);

    try {
        const res = await insertarOrden(formData);
        if (res.success || res.id > 0) {
            showToast('Orden de trabajo registrada', 'success');
            cerrarModalOT();
            document.querySelector('#form-nueva-ot').reset();
            await cargarOrdenes();
        } else {
            showToast(res.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        showToast('Error de comunicación con MySQL', 'error');
    }
}

async function cambiarEstadoOT(id, nuevoEstado) {
    try {
        const res = await actualizarEstadoOrden(id, nuevoEstado);
        if (res.success) {
            showToast(`Estado cambiado a ${nuevoEstado}`, 'success');
            await cargarOrdenes();
        }
    } catch (e) {
        showToast('Error al actualizar estado', 'error');
    }
}

function abrirModalOT() {
    document.querySelector('#modal-ot').classList.remove('hidden');
}
function cerrarModalOT() {
    document.querySelector('#modal-ot').classList.add('hidden');
}

function escapar(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.innerText = s;
    return d.innerHTML;
}
