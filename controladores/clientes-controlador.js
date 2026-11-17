/**
 * Controlador de Gestión de Clientes (CRUD y Baja Lógica) - AluGestión
 * Mantiene la arquitectura y métodos del controlador de referencia
 */

import {
    seleccionarClientes,
    obtenerClientePorId,
    insertarCliente,
    actualizarCliente,
    cambiarEstadoCliente,
    eliminarCliente
} from '../modelos/clientes.js';
import { showToast } from './nav-autenticacion.js';

// Estado local del módulo
let clientesEnMemoria = [];
let clienteSeleccionadoParaEstado = null;
let clienteSeleccionadoParaEliminar = null;
let filtroEstadoActual = 'todos'; // 'todos' | 'Activo' | 'Inactivo'

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    cargarListaClientes();

    // Si viene con parámetro ?action=nuevo en la URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'nuevo') {
        abrirFormularioAlta();
    }
});

/**
 * Inicializa todos los eventos y listeners del módulo de clientes
 */
function inicializarEventos() {
    // Buscador en tiempo real por Nombre o DNI/CUIT
    const inputBuscar = document.querySelector('#input-buscar-cliente');
    if (inputBuscar) {
        let timeout = null;
        inputBuscar.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                filtrarYRenderizar(e.target.value);
            }, 150);
        });
    }

    // Filtros de estado (Pestañas Todos / Activos / Inactivos)
    const btnsFiltro = document.querySelectorAll('.btn-filtro-estado');
    btnsFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            btnsFiltro.forEach(b => b.classList.remove('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400'));
            btn.classList.add('bg-cyan-500/30', 'text-cyan-300', 'border-cyan-400');
            filtroEstadoActual = btn.getAttribute('data-estado');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        });
    });

    // Formulario de Alta / Modificación
    const formElement = document.querySelector('#client-form-element');
    if (formElement) {
        formElement.addEventListener('submit', guardarCliente);
    }

    // Modal de confirmación para Baja Lógica
    const btnConfirmarBaja = document.querySelector('#btn-confirmar-baja');
    const btnCancelarBaja = document.querySelector('#btn-cancelar-baja');
    const modalBaja = document.querySelector('#modal-baja-logica');

    if (btnConfirmarBaja) {
        btnConfirmarBaja.addEventListener('click', ejecutarBajaLogica);
    }
    if (btnCancelarBaja && modalBaja) {
        btnCancelarBaja.addEventListener('click', () => {
            modalBaja.classList.add('hidden');
            clienteSeleccionadoParaEstado = null;
        });
    }

    // Modal de confirmación para Eliminar Físicamente
    const btnConfirmarEliminar = document.querySelector('#btn-confirmar-eliminar');
    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', ejecutarEliminarCliente);
    }

    // Botones de cambio de vista
    window.switchView = switchView;
    window.abrirFormularioAlta = abrirFormularioAlta;
    window.editarCliente = editarCliente;
    window.verFichaCliente = verFichaCliente;
    window.solicitarCambioEstado = solicitarCambioEstado;
    window.solicitarEliminarCliente = solicitarEliminarCliente;
    window.cerrarModalEliminar = cerrarModalEliminar;
}

/**
 * Consulta la base de datos MySQL mediante la API y almacena los clientes
 */
async function cargarListaClientes() {
    const tbody = document.querySelector('#client-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-slate-400">
                    <div class="flex items-center justify-center gap-3">
                        <div class="loader"></div>
                        <span>Cargando clientes desde MySQL...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    try {
        const datos = await seleccionarClientes();
        clientesEnMemoria = Array.isArray(datos) ? datos : [];
        filtrarYRenderizar();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-red-300">
                        <i class="ph ph-warning-circle text-2xl mb-1 inline-block"></i>
                        <p>No se pudo conectar a la base de datos MySQL (alugestion).</p>
                        <p class="text-xs text-slate-400 mt-1">Verifica que Wamp / MySQL esté ejecutándose y la base de datos haya sido importada.</p>
                    </td>
                </tr>
            `;
        }
        showToast('Error al conectar con la base de datos MySQL', 'error');
    }
}

/**
 * Aplica el buscador en tiempo real y el filtro de estado, luego renderiza
 * @param {string} textoBusqueda 
 */
function filtrarYRenderizar(textoBusqueda = '') {
    const termino = textoBusqueda.trim().toLowerCase();

    const filtrados = clientesEnMemoria.filter(c => {
        const coincideTexto = !termino || 
            (c.nombre && c.nombre.toLowerCase().includes(termino)) ||
            (c.dni_cuit && c.dni_cuit.toLowerCase().includes(termino)) ||
            (c.email && c.email.toLowerCase().includes(termino));

        const coincideEstado = (filtroEstadoActual === 'todos') || (c.estado === filtroEstadoActual);

        return coincideTexto && coincideEstado;
    });

    renderizarTabla(filtrados);
}

/**
 * Renderiza dinámicamente las filas de clientes en la tabla
 * @param {Array} lista 
 */
function renderizarTabla(lista) {
    const tbody = document.querySelector('#client-table-body');
    const totalContador = document.querySelector('#total-clientes-count');
    if (!tbody) return;

    if (totalContador) {
        totalContador.textContent = `${lista.length} de ${clientesEnMemoria.length} registros`;
    }

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-slate-400">
                    <i class="ph ph-magnifying-glass text-3xl mb-2 text-slate-500 block"></i>
                    No se encontraron clientes que coincidan con la búsqueda.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(c => {
        const esActivo = (c.estado === 'Activo');
        const badgeEstado = esActivo
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Activo
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/30 text-slate-300 border border-slate-500/30">
                 <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactivo
               </span>`;

        return `
            <tr class="hover:bg-white/5 transition-colors group">
                <td class="px-6 py-4">
                    <div class="font-medium text-white group-hover:text-cyan-300 transition-colors">${escaparHTML(c.nombre)}</div>
                    <div class="text-xs text-slate-400">${escaparHTML(c.tipo || 'Particular')} • ${escaparHTML(c.email || 'Sin correo')}</div>
                </td>
                <td class="px-6 py-4 text-slate-300 font-mono text-xs">${escaparHTML(c.dni_cuit)}</td>
                <td class="px-6 py-4 text-slate-300">${escaparHTML(c.telefono || 'S/D')}</td>
                <td class="px-6 py-4 text-slate-300 max-w-xs truncate" title="${escaparHTML(c.direccion)}">${escaparHTML(c.direccion)}</td>
                <td class="px-6 py-4">${badgeEstado}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <!-- Botón Modificación -->
                        <button type="button" onclick="editarCliente(${c.id})" class="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all" title="Modificar Datos">
                            <i class="ph ph-pencil-simple text-lg"></i>
                        </button>
                        <!-- Botón Ver Ficha -->
                        <button type="button" onclick="verFichaCliente(${c.id})" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all" title="Ver Historial y Presupuestos">
                            <i class="ph ph-eye text-lg"></i>
                        </button>
                        <!-- Botón Baja Lógica / Activar -->
                        <button type="button" onclick="solicitarCambioEstado(${c.id})" class="p-2 rounded-lg border transition-all ${
                            esActivo 
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 hover:border-amber-400' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                        }" title="${esActivo ? 'Inactivar Cliente (Baja Lógica)' : 'Reactivar Cliente'}">
                            <i class="ph ${esActivo ? 'ph-power' : 'ph-arrows-clockwise'} text-lg"></i>
                        </button>
                        <!-- Botón Eliminar Cliente -->
                        <button type="button" onclick="solicitarEliminarCliente(${c.id})" class="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 transition-all" title="Eliminar Cliente de la Base de Datos">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Abre el formulario para dar de Alta a un nuevo cliente
 */
function abrirFormularioAlta() {
    const form = document.querySelector('#client-form-element');
    if (form) form.reset();

    document.querySelector('#form-client-id').value = '';
    document.querySelector('#form-title').innerText = 'Registrar Nuevo Cliente';
    document.querySelector('#form-subtitle').innerText = 'Completa los datos del cliente para darlo de alta en AluGestión.';
    document.querySelector('#btn-save-text').innerText = 'Guardar Cliente';

    // Estado por defecto Activo
    const radioActivo = document.querySelector('input[name="estado"][value="Activo"]');
    if (radioActivo) radioActivo.checked = true;

    switchView('client-form');
}

/**
 * Carga los datos de un cliente existente en el formulario para Modificación
 * @param {number} id 
 */
async function editarCliente(id) {
    let cliente = clientesEnMemoria.find(c => String(c.id) === String(id));
    if (!cliente) {
        cliente = await obtenerClientePorId(id);
    }

    if (!cliente) {
        showToast('No se encontró el cliente seleccionado', 'error');
        return;
    }

    document.querySelector('#form-client-id').value = cliente.id;
    document.querySelector('#form-client-name').value = cliente.nombre || '';
    document.querySelector('#form-client-type').value = cliente.tipo || 'Particular';
    document.querySelector('#form-client-dni').value = cliente.dni_cuit || '';
    document.querySelector('#form-client-phone').value = (cliente.telefono === 'S/D' ? '' : cliente.telefono) || '';
    document.querySelector('#form-client-email').value = cliente.email || '';
    document.querySelector('#form-client-address').value = (cliente.direccion === 'S/D' ? '' : cliente.direccion) || '';
    document.querySelector('#form-client-notes').value = cliente.observaciones || '';

    const radioEstado = document.querySelector(`input[name="estado"][value="${cliente.estado || 'Activo'}"]`);
    if (radioEstado) radioEstado.checked = true;

    document.querySelector('#form-title').innerText = 'Modificar Cliente';
    document.querySelector('#form-subtitle').innerText = `Editando datos de: ${cliente.nombre}`;
    document.querySelector('#btn-save-text').innerText = 'Actualizar Cambios';

    switchView('client-form');
}

/**
 * Guarda o actualiza un cliente enviando los datos a api/datos.php
 * @param {Event} e 
 */
async function guardarCliente(e) {
    e.preventDefault();

    const id = document.querySelector('#form-client-id').value.trim();
    const nombre = document.querySelector('#form-client-name').value.trim();
    const tipo = document.querySelector('#form-client-type').value;
    const dni_cuit = document.querySelector('#form-client-dni').value.trim();
    const telefono = document.querySelector('#form-client-phone').value.trim();
    const email = document.querySelector('#form-client-email').value.trim();
    const direccion = document.querySelector('#form-client-address').value.trim();
    const observaciones = document.querySelector('#form-client-notes').value.trim();
    const estadoRadio = document.querySelector('input[name="estado"]:checked');
    const estado = estadoRadio ? estadoRadio.value : 'Activo';

    // Validaciones de obligatoriedad
    if (!nombre || !dni_cuit || !tipo || !direccion) {
        showToast('Por favor completa todos los campos obligatorios marcados con (*)', 'error');
        return;
    }

    const btnSave = document.querySelector('#btn-save-client');
    const btnText = document.querySelector('#btn-save-text');
    const btnLoader = document.querySelector('#btn-save-loader');

    if (btnSave) btnSave.disabled = true;
    if (btnLoader) btnLoader.classList.remove('hidden');
    if (btnText) btnText.textContent = id ? 'Actualizando...' : 'Guardando...';

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('tipo', tipo);
    formData.append('dni_cuit', dni_cuit);
    formData.append('telefono', telefono);
    formData.append('email', email);
    formData.append('direccion', direccion);
    formData.append('observaciones', observaciones);
    formData.append('estado', estado);

    try {
        let respuesta;
        if (id) {
            // Modificación
            respuesta = await actualizarCliente(formData, id);
        } else {
            // Alta
            respuesta = await insertarCliente(formData);
        }

        if (respuesta.success || (respuesta.id && respuesta.id > 0)) {
            showToast(id ? 'Cliente modificado con éxito' : 'Cliente registrado exitosamente', 'success');
            await cargarListaClientes();
            switchView('client-list');
        } else {
            showToast(respuesta.message || 'No se pudo guardar el cliente', 'error');
        }
    } catch (error) {
        console.error('Error al procesar cliente:', error);
        showToast('Error de comunicación con MySQL', 'error');
    } finally {
        if (btnSave) btnSave.disabled = false;
        if (btnLoader) btnLoader.classList.add('hidden');
        if (btnText) btnText.textContent = id ? 'Actualizar Cambios' : 'Guardar Cliente';
    }
}

/**
 * Prepara y muestra el modal de confirmación para la Baja Lógica
 * @param {number} id 
 */
function solicitarCambioEstado(id) {
    const cliente = clientesEnMemoria.find(c => String(c.id) === String(id));
    if (!cliente) return;

    clienteSeleccionadoParaEstado = cliente;
    const esActivo = (cliente.estado === 'Activo');
    const nuevoEstado = esActivo ? 'Inactivo' : 'Activo';

    const modal = document.querySelector('#modal-baja-logica');
    const modalTitulo = document.querySelector('#modal-baja-titulo');
    const modalDesc = document.querySelector('#modal-baja-desc');
    const btnConfirmar = document.querySelector('#btn-confirmar-baja');

    if (modal && modalTitulo && modalDesc && btnConfirmar) {
        modalTitulo.innerText = esActivo ? '¿Inactivar Cliente?' : '¿Reactivar Cliente?';
        modalDesc.innerHTML = esActivo
            ? `Se cambiará el estado de <strong>${escaparHTML(cliente.nombre)}</strong> a <em>Inactivo</em>. El registro <strong>permanecerá en la base de datos</strong> (baja lógica).`
            : `Se cambiará el estado de <strong>${escaparHTML(cliente.nombre)}</strong> a <em>Activo</em> nuevamente.`;

        btnConfirmar.innerText = esActivo ? 'Sí, Inactivar' : 'Sí, Reactivar';
        btnConfirmar.className = esActivo 
            ? 'px-5 py-2.5 rounded-xl font-medium text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            : 'px-5 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]';

        modal.classList.remove('hidden');
    }
}

/**
 * Ejecuta la Baja Lógica en MySQL mediante la API
 */
async function ejecutarBajaLogica() {
    if (!clienteSeleccionadoParaEstado) return;

    const id = clienteSeleccionadoParaEstado.id;
    const esActivo = (clienteSeleccionadoParaEstado.estado === 'Activo');
    const nuevoEstado = esActivo ? 'Inactivo' : 'Activo';

    const modal = document.querySelector('#modal-baja-logica');
    if (modal) modal.classList.add('hidden');

    try {
        const respuesta = await cambiarEstadoCliente(id, nuevoEstado);
        if (respuesta.success) {
            showToast(`Cliente '${clienteSeleccionadoParaEstado.nombre}' pasó a estado ${nuevoEstado}`, 'success');
            
            // Actualizar memoria local inmediatamente
            clienteSeleccionadoParaEstado.estado = nuevoEstado;
            const idx = clientesEnMemoria.findIndex(c => String(c.id) === String(id));
            if (idx !== -1) {
                clientesEnMemoria[idx].estado = nuevoEstado;
            }

            const inputBuscar = document.querySelector('#input-buscar-cliente');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        } else {
            showToast(respuesta.message || 'No se pudo actualizar el estado', 'error');
        }
    } catch (error) {
        console.error('Error en baja lógica:', error);
        showToast('Error al actualizar el estado en MySQL', 'error');
    } finally {
        clienteSeleccionadoParaEstado = null;
    }
}

/**
 * Abre el modal de confirmación para eliminar físicamente un cliente
 * @param {number} id 
 */
function solicitarEliminarCliente(id) {
    const cliente = clientesEnMemoria.find(c => String(c.id) === String(id));
    if (!cliente) return;

    clienteSeleccionadoParaEliminar = cliente;
    const modal = document.querySelector('#modal-eliminar-cliente');
    const desc = document.querySelector('#modal-eliminar-desc');

    if (modal && desc) {
        desc.innerHTML = `¿Estás seguro de que deseas eliminar permanentemente a <strong>${escaparHTML(cliente.nombre)}</strong> (${escaparHTML(cliente.dni_cuit)})?<br><span class="text-xs text-red-300">Esta acción borrará el registro de la base de datos de MySQL.</span>`;
        modal.classList.remove('hidden');
    }
}

function cerrarModalEliminar() {
    const modal = document.querySelector('#modal-eliminar-cliente');
    if (modal) modal.classList.add('hidden');
    clienteSeleccionadoParaEliminar = null;
}

/**
 * Ejecuta la eliminación física en MySQL
 */
async function ejecutarEliminarCliente() {
    if (!clienteSeleccionadoParaEliminar) return;

    const id = clienteSeleccionadoParaEliminar.id;
    const nombre = clienteSeleccionadoParaEliminar.nombre;
    cerrarModalEliminar();

    try {
        const respuesta = await eliminarCliente(id);
        if (respuesta.success) {
            showToast(`Cliente '${nombre}' eliminado correctamente de MySQL`, 'success');
            clientesEnMemoria = clientesEnMemoria.filter(c => String(c.id) !== String(id));
            const inputBuscar = document.querySelector('#input-buscar-cliente');
            filtrarYRenderizar(inputBuscar ? inputBuscar.value : '');
        } else {
            showToast(respuesta.message || 'Error al eliminar el cliente', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showToast('Error de comunicación con MySQL al intentar eliminar', 'error');
    }
}

/**
 * Muestra la vista de ficha / perfil del cliente con presupuestos simulados
 * @param {number} id 
 */
function verFichaCliente(id) {
    const cliente = clientesEnMemoria.find(c => String(c.id) === String(id));
    if (!cliente) return;

    const iniciales = cliente.nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    document.querySelector('#profile-avatar').textContent = iniciales || 'CL';
    document.querySelector('#profile-name').textContent = cliente.nombre;
    document.querySelector('#profile-cuit').textContent = `DNI/CUIT: ${cliente.dni_cuit} • ${cliente.tipo || 'Particular'}`;
    document.querySelector('#profile-phone').textContent = cliente.telefono || 'Sin teléfono';
    document.querySelector('#profile-email').textContent = cliente.email || 'Sin correo electrónico';
    document.querySelector('#profile-address').textContent = cliente.direccion || 'Sin dirección';

    const badge = document.querySelector('#profile-badge');
    if (badge) {
        badge.className = cliente.estado === 'Activo'
            ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/30 text-slate-300 border border-slate-500/30';
        badge.textContent = `Cliente ${cliente.estado}`;
    }

    const btnEditProfile = document.querySelector('#btn-edit-from-profile');
    if (btnEditProfile) {
        btnEditProfile.onclick = () => editarCliente(cliente.id);
    }

    switchView('client-profile');
}

/**
 * Cambia de vista dentro de la página entre lista, formulario y ficha
 * @param {string} viewId 
 */
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden-view'));
    const target = document.querySelector('#view-' + viewId);
    if (target) {
        target.classList.remove('hidden-view');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}
