/**
 * Controlador de Contacto y Bandeja de Consultas - AluGestión
 */

import { enviarContacto, obtenerContactos } from '../modelos/contactos.js';
import { showToast } from './nav-autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    const formContacto = document.querySelector('#form-contacto');
    const tablaConsultas = document.querySelector('#tabla-consultas-body');

    // 1. Si estamos en la portada pública (index.html), escuchar el envío del formulario
    if (formContacto) {
        const btnSubmit = document.querySelector('#btn-enviar-contacto');
        const btnText = document.querySelector('#btn-contacto-text');
        const btnLoader = document.querySelector('#btn-contacto-loader');

        formContacto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.querySelector('#nombre')?.value.trim();
            const email = document.querySelector('#email')?.value.trim();
            const mensaje = document.querySelector('#mensaje')?.value.trim();

            if (!nombre || !email || !mensaje) {
                showToast('Por favor completa los campos obligatorios (*)', 'error');
                return;
            }

            if (btnSubmit) btnSubmit.disabled = true;
            if (btnText) btnText.textContent = 'Enviando mensaje...';
            if (btnLoader) btnLoader.classList.remove('hidden');

            const formData = new FormData(formContacto);

            try {
                const respuesta = await enviarContacto(formData);

                if (respuesta.success || (respuesta.id && respuesta.id > 0)) {
                    showToast('¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.', 'success');
                    formContacto.reset();
                } else {
                    showToast(respuesta.message || 'Error al enviar el mensaje', 'error');
                }
            } catch (error) {
                console.error('Error al enviar contacto:', error);
                showToast('No se pudo conectar con el servidor. Verifica tu base de datos.', 'error');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnText) btnText.textContent = 'Enviar Mensaje';
                if (btnLoader) btnLoader.classList.add('hidden');
            }
        });
    }

    // 2. Si estamos en el panel interno (contactenos.html), cargar las consultas recibidas
    if (tablaConsultas) {
        cargarConsultasRecibidas();

        const btnRefrescar = document.querySelector('#btn-refrescar-consultas');
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', cargarConsultasRecibidas);
        }
    }

    async function cargarConsultasRecibidas() {
        const contadorElem = document.querySelector('#total-consultas');
        tablaConsultas.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-400">
                    <div class="flex items-center justify-center gap-2">
                        <div class="loader"></div>
                        <span>Cargando consultas de MySQL...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            const lista = await obtenerContactos();

            if (contadorElem) {
                contadorElem.textContent = lista.length;
            }

            if (!lista || lista.length === 0) {
                tablaConsultas.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-10 text-center text-slate-400">
                            No hay consultas recibidas desde la web todavía.
                        </td>
                    </tr>
                `;
                return;
            }

            tablaConsultas.innerHTML = lista.map(item => `
                <tr class="hover:bg-white/5 transition-colors align-top">
                    <td class="px-6 py-4">
                        <p class="font-semibold text-white">${item.nombre || 'Sin nombre'}</p>
                        <p class="text-xs text-cyan-300">${item.email || ''}</p>
                    </td>
                    <td class="px-6 py-4 text-slate-300">
                        <p>${item.telefono || '-'}</p>
                        <p class="text-xs text-slate-400">${[item.localidad, item.provincia].filter(Boolean).join(', ') || '-'}</p>
                    </td>
                    <td class="px-6 py-4 text-slate-300">
                        ${item.direccion || '-'}
                    </td>
                    <td class="px-6 py-4 text-slate-200 max-w-md whitespace-normal">
                        ${item.mensaje || ''}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <a href="clientes.html?action=nuevo" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-all" title="Dar de alta como cliente">
                            <i class="ph ph-user-plus"></i> Alta Cliente
                        </a>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error al cargar consultas:', error);
            tablaConsultas.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-red-400">
                        Error al obtener las consultas desde MySQL.
                    </td>
                </tr>
            `;
        }
    }
});