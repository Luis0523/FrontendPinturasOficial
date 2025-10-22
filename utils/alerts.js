/**
 * Sistema de alertas y notificaciones
 * Usando Bootstrap alerts y toasts
 */

const Alerts = {
    /**
     * Mostrar alerta de éxito
     */
    success(message, title = '¡Éxito!') {
        this.showToast(message, title, 'success');
    },

    /**
     * Mostrar alerta de error
     */
    error(message, title = 'Error') {
        this.showToast(message, title, 'danger');
    },

    /**
     * Mostrar alerta de advertencia
     */
    warning(message, title = 'Advertencia') {
        this.showToast(message, title, 'warning');
    },

    /**
     * Mostrar alerta de información
     */
    info(message, title = 'Información') {
        this.showToast(message, title, 'info');
    },

    /**
     * Mostrar toast (notificación temporal)
     */
    showToast(message, title, type = 'info') {
        // Crear container de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Crear el toast
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${type} text-white">
                    <i class="bi bi-${this.getIcon(type)} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Mostrar el toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();

        // Eliminar del DOM después de ocultarse
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    },

    /**
     * Obtener ícono según el tipo
     */
    getIcon(type) {
        const icons = {
            success: 'check-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-circle-fill',
            info: 'info-circle-fill'
        };
        return icons[type] || 'info-circle-fill';
    },

    /**
     * Confirmación con modal
     */
    confirm(message, title = '¿Estás seguro?', onConfirm, onCancel = null) {
        // Crear modal de confirmación
        const modalId = 'confirm-modal-' + Date.now();
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="${modalId}-confirm">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);

        // Manejar confirmación
        document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
            modal.hide();
            if (onConfirm) onConfirm();
        });

        // Manejar cancelación
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
            if (onCancel) onCancel();
        });

        modal.show();
    },

    /**
     * Mostrar alerta inline en un contenedor específico
     */
    showInline(containerId, message, type = 'info', dismissible = true) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alertHTML = `
            <div class="alert alert-${type} ${dismissible ? 'alert-dismissible fade show' : ''}" role="alert">
                <i class="bi bi-${this.getIcon(type)} me-2"></i>
                ${message}
                ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : ''}
            </div>
        `;

        container.innerHTML = alertHTML;
    },

    /**
     * Limpiar alertas inline
     */
    clearInline(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    },
    /**
 * Mostrar alerta con select
 */
    select(text, title, options, callback) {
        const opciones = {};
        options.forEach(opt => {
            opciones[opt.value] = opt.text;
        });

        Swal.fire({
            title: title,
            text: text,
            input: 'select',
            inputOptions: opciones,
            inputPlaceholder: 'Selecciona una opción',
            showCancelButton: true,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            inputValidator: (value) => {
                if (!value) {
                    return 'Debes seleccionar una opción';
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                callback(result.value);
            }
        });
    }
};