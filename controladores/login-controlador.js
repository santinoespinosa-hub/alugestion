/**
 * Controlador de Inicio de Sesión - AluGestión
 * Mantiene la arquitectura y métodos del controlador de referencia
 */

import { login, obtenerUsuarioActual } from '../modelos/auth.js';
import { showToast } from './nav-autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    // Si ya tiene sesión activa, redirigir al dashboard
    if (obtenerUsuarioActual()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const formLogin = document.querySelector('#login-form');
    const btnTogglePwd = document.querySelector('#btn-toggle-pwd');
    const pwdInput = document.querySelector('#password');

    if (btnTogglePwd && pwdInput) {
        btnTogglePwd.addEventListener('click', () => {
            const esPassword = pwdInput.type === 'password';
            pwdInput.type = esPassword ? 'text' : 'password';
            const icon = btnTogglePwd.querySelector('i');
            if (icon) {
                icon.className = esPassword ? 'ph ph-eye-slash' : 'ph ph-eye';
            }
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnSubmit = document.querySelector('#btn-login');
            const btnText = document.querySelector('#btn-login-text');
            const btnLoader = document.querySelector('#btn-login-loader');
            const alertError = document.querySelector('#login-error-alert');
            const alertErrorText = document.querySelector('#login-error-text');

            if (alertError) alertError.classList.add('hidden');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
            }
            if (btnText) btnText.textContent = 'Verificando credenciales...';
            if (btnLoader) btnLoader.classList.remove('hidden');

            const formData = new FormData(formLogin);

            try {
                const respuesta = await login(formData);

                if (respuesta.success) {
                    showToast('¡Autenticación exitosa! Ingresando a AluGestión...', 'success');

                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    const mensaje = respuesta.message || 'Usuario o contraseña incorrectos';
                    if (alertError && alertErrorText) {
                        alertErrorText.textContent = mensaje;
                        alertError.classList.remove('hidden');
                    }
                    showToast(mensaje, 'error');

                    restablecerBoton();
                }
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                const msg = 'No se pudo conectar con el servidor MySQL. Verifica tu conexión de WAMP.';
                if (alertError && alertErrorText) {
                    alertErrorText.textContent = msg;
                    alertError.classList.remove('hidden');
                }
                showToast(msg, 'error');
                restablecerBoton();
            }
        });
    }

    function restablecerBoton() {
        const btnSubmit = document.querySelector('#btn-login');
        const btnText = document.querySelector('#btn-login-text');
        const btnLoader = document.querySelector('#btn-login-loader');

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
        }
        if (btnText) btnText.textContent = 'Iniciar Sesión';
        if (btnLoader) btnLoader.classList.add('hidden');
    }
});