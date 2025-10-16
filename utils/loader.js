/**
 * Sistema de loading/spinner
 */

const Loader = {
    /**
     * Mostrar loader global (pantalla completa)
     */
    show(message = 'Cargando...') {
        // Verificar si ya existe
        if (document.getElementById('global-loader')) {
            return;
        }

        const loaderHTML = `
            <div id="global-loader" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                 style="background: rgba(0,0,0,0.5); z-index: 9999;">
                <div class="text-center">
                    <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-white mt-3">${message}</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loaderHTML);
    },

    /**
     * Ocultar loader global
     */
    hide() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    },

    /**
     * Mostrar loader en un elemento específico
     */
    showInElement(elementId, message = 'Cargando...') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const loaderHTML = `
            <div class="text-center py-5" data-loader>
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="text-muted mt-3">${message}</p>
            </div>
        `;

        element.innerHTML = loaderHTML;
    },

    /**
     * Ocultar loader de un elemento específico
     */
    hideInElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const loader = element.querySelector('[data-loader]');
        if (loader) {
            loader.remove();
        }
    },

    /**
     * Mostrar spinner pequeño en un botón
     */
    showInButton(button, text = 'Procesando...') {
        if (!button) return;

        // Guardar estado original
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;

        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ${text}
        `;
    },

    /**
     * Ocultar spinner del botón y restaurar texto
     */
    hideInButton(button) {
        if (!button) return;

        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    },

    /**
     * Mostrar skeleton loader (placeholder mientras carga)
     */
    showSkeleton(elementId, rows = 3) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let skeletonHTML = '<div class="skeleton-loader">';
        for (let i = 0; i < rows; i++) {
            skeletonHTML += `
                <div class="skeleton-item mb-3">
                    <div class="skeleton-line" style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 10px;"></div>
                    <div class="skeleton-line" style="width: 80%; height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 10px;"></div>
                    <div class="skeleton-line" style="width: 60%; height: 20px; background: #e0e0e0; border-radius: 4px;"></div>
                </div>
            `;
        }
        skeletonHTML += '</div>';

        element.innerHTML = skeletonHTML;
    }
};