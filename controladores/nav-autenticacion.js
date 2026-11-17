/**
 * Controlador de Navegación, Sesión y UI Común - AluGestión
 */

import { obtenerUsuarioActual, logout } from '../modelos/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    configurarUsuarioUI();
    marcarRutaActiva();
    configurarSidebarMovil();
});

/**
 * Muestra el nombre y rol del usuario en la barra superior si ha iniciado sesión
 */
function configurarUsuarioUI() {
    const usuario = obtenerUsuarioActual();
    const nombreElem = document.querySelector('#header-user-name');
    const rolElem = document.querySelector('#header-user-role');
    const avatarElem = document.querySelector('#header-user-avatar');
    const btnLogout = document.querySelector('#btn-logout');

    if (usuario) {
        if (nombreElem) {
            nombreElem.textContent = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.usuario;
        }
        if (rolElem) {
            rolElem.textContent = usuario.rol ? (usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)) : 'Usuario';
        }
        if (avatarElem) {
            const iniciales = (usuario.nombre ? usuario.nombre.charAt(0) : '') + (usuario.apellido ? usuario.apellido.charAt(0) : 'A');
            avatarElem.src = `https://placehold.co/100x100/0f172a/06b6d4?text=${encodeURIComponent(iniciales || 'AG')}`;
        }
    } else {
        if (nombreElem) nombreElem.textContent = 'Invitado';
        if (rolElem) rolElem.textContent = 'Acceso público';
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Deseas cerrar tu sesión en AluGestión?')) {
                logout();
            }
        });
    }
}

/**
 * Resalta el botón del menú lateral según el archivo HTML actual
 */
function marcarRutaActiva() {
    const ruta = window.location.pathname.toLowerCase();
    const enlaces = document.querySelectorAll('.nav-item');

    enlaces.forEach(enlace => {
        const href = enlace.getAttribute('href');
        if (!href) return;

        const esActivo = (ruta.endsWith(href) || (ruta.endsWith('/') && href === 'index.html'));
        if (esActivo) {
            enlace.className = "nav-item active-nav w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/20 text-cyan-300 border-l-4 border-cyan-400 font-medium transition-all text-left";
        } else {
            enlace.className = "nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white border-l-4 border-transparent transition-all text-left";
        }
    });
}

/**
 * Manejo de apertura y cierre del menú lateral en pantallas móviles
 */
function configurarSidebarMovil() {
    const btnToggle = document.querySelector('#btn-toggle-sidebar');
    const sidebar = document.querySelector('#sidebar');
    const overlay = document.querySelector('#mobile-overlay');

    if (btnToggle && sidebar && overlay) {
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}

/**
 * Utilidad global para mostrar Toasts Glassmorphism
 * @param {string} mensaje 
 * @param {'success'|'error'|'info'} tipo 
 */
export function showToast(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto p-4 rounded-xl text-white font-medium text-sm flex items-center gap-3 border backdrop-blur-md transform transition-all duration-300 translate-y-full opacity-0 shadow-lg ${
        tipo === 'success' ? 'bg-emerald-500/90 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
        tipo === 'error' ? 'bg-red-500/90 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 
        'bg-cyan-600/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
    }`;
    
    const iconClass = tipo === 'success' ? 'ph-check-circle' : 
                      tipo === 'error' ? 'ph-warning-circle' : 'ph-info';

    toast.innerHTML = `<i class="ph ${iconClass} text-xl flex-shrink-0"></i> <span>${mensaje}</span>`;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    });
    
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Exponer toast en window para eventos inline
window.showToast = showToast;
