/**
 * Controlador de Registro de Usuarios - AluGestión
 * Mantiene la arquitectura y métodos del proyecto de referencia
 */

import { registrar } from '../modelos/auth.js';
import { showToast } from './nav-autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.querySelector('#registro-form');
    const alertBox = document.querySelector('#registro-alert');
    const alertText = document.querySelector('#registro-alert-text');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.querySelector('#password').value;
            const confirmPassword = document.querySelector('#confirm-password')?.value;

            if (confirmPassword !== undefined && password !== confirmPassword) {
                mostrarAlerta('Las contraseñas no coinciden', 'error');
                return;
            }

            if (password.length < 4) {
                mostrarAlerta('La contraseña debe tener al menos 4 caracteres', 'error');
                return;
            }

            const btnSubmit = document.querySelector('#btn-registro');
            const btnText = document.querySelector('#btn-registro-text');
            const btnLoader = document.querySelector('#btn-registro-loader');

            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
            }
            if (btnText) btnText.textContent = 'Registrando usuario...';
            if (btnLoader) btnLoader.classList.remove('hidden');

            const formData = new FormData(formRegistro);

            try {
                const respuesta = await registrar(formData);

                if (respuesta.success || (respuesta.id && respuesta.id > 0)) {
                    showToast('¡Registro completado con éxito! Redirigiendo al login...', 'success');
                    formRegistro.reset();

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    const mensaje = respuesta.message || 'No se pudo completar el registro';
                    mostrarAlerta(mensaje, 'error');
                    restablecerBoton();
                }
            } catch (error) {
                console.error('Error al registrar usuario:', error);
                mostrarAlerta('Error de comunicación con el servidor. Verifica que Apache y MySQL estén activos.', 'error');
                restablecerBoton();
            }
        });
    }

    function mostrarAlerta(mensaje, tipo = 'error') {
        showToast(mensaje, tipo);
        if (alertBox && alertText) {
            alertText.textContent = mensaje;
            alertBox.classList.remove('hidden');
        }
    }

    function restablecerBoton() {
        const btnSubmit = document.querySelector('#btn-registro');
        const btnText = document.querySelector('#btn-registro-text');
        const btnLoader = document.querySelector('#btn-registro-loader');

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
        }
        if (btnText) btnText.textContent = 'Crear Cuenta';
        if (btnLoader) btnLoader.classList.add('hidden');
    }
});
