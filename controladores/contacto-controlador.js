/**
 * Controlador de Formulario de Contacto - AluGestión
 * Guarda los mensajes directamente en la tabla contactos de MySQL
 */

import { enviarContacto } from '../modelos/contactos.js';
import { showToast } from './nav-autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    const formContacto = document.querySelector('#form-contacto');
    const btnSubmit = document.querySelector('#btn-enviar-contacto');
    const btnText = document.querySelector('#btn-contacto-text');
    const btnLoader = document.querySelector('#btn-contacto-loader');

    if (formContacto) {
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
});
