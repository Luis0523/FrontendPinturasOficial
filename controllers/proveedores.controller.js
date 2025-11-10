/**
 * =====================================================
 * CONTROLADOR DE PROVEEDORES
 * =====================================================
 * Maneja toda la lógica de la vista de proveedores:
 * - Listado con paginación y filtros
 * - CRUD completo (crear, editar, ver detalle, eliminar)
 * - Validación de formularios
 * - Búsqueda en tiempo real
 * =====================================================
 */

const ProveedoresController = {
    // Estado del controlador
    proveedores: [],
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
    currentProveedorId: null,
    modalProveedor: null,
    modalDetalle: null,
    isEditMode: false,
    filtros: {
        buscar: '',
        activo: 'true' // Por defecto solo activos
    },

    /**
     * Inicializar controlador
     */
    async init() {
        console.log('Inicializando ProveedoresController...');

        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Verificar permisos
        if (!requirePermission(Permissions.canViewProviders)) {
            return; // El requirePermission ya redirige
        }

        // Inicializar modals de Bootstrap
        const modalProveedorElement = document.getElementById('modalProveedor');
        const modalDetalleElement = document.getElementById('modalDetalleProveedor');

        if (modalProveedorElement) {
            this.modalProveedor = new bootstrap.Modal(modalProveedorElement);
        }
        if (modalDetalleElement) {
            this.modalDetalle = new bootstrap.Modal(modalDetalleElement);
        }

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar proveedores
        await this.loadProveedores();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtros.buscar = e.target.value;
                this.debounceSearch();
            });
        }

        // Filtro por estado
        const filterEstado = document.getElementById('filterEstado');
        if (filterEstado) {
            filterEstado.addEventListener('change', (e) => {
                this.filtros.activo = e.target.value;
                this.currentPage = 1;
                this.loadProveedores();
            });
        }

        // Botón guardar proveedor
        const btnGuardar = document.getElementById('btnGuardarProveedor');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => this.saveProveedor());
        }

        // Botón editar desde detalle
        const btnEditarDesdeDetalle = document.getElementById('btnEditarDesdeDetalle');
        if (btnEditarDesdeDetalle) {
            btnEditarDesdeDetalle.addEventListener('click', () => {
                this.modalDetalle.hide();
                this.openEditModal(this.currentProveedorId);
            });
        }

        // Validación en tiempo real
        this.setupFormValidation();
    },

    /**
     * Configurar validación de formulario
     */
    setupFormValidation() {
        const inputNombre = document.getElementById('inputNombre');
        const inputEmail = document.getElementById('inputEmail');
        const inputTelefono = document.getElementById('inputTelefono');

        // Validar nombre
        if (inputNombre) {
            inputNombre.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor.length < 3) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    e.target.classList.add('is-valid');
                }
            });
        }

        // Validar email
        if (inputEmail) {
            inputEmail.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor && !ProveedoresService.validarEmail(valor)) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    if (valor) e.target.classList.add('is-valid');
                }
            });
        }

        // Validar y formatear teléfono
        if (inputTelefono) {
            inputTelefono.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor && !ProveedoresService.validarTelefono(valor)) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    if (valor) {
                        e.target.value = ProveedoresService.formatearTelefono(valor);
                        e.target.classList.add('is-valid');
                    }
                }
            });
        }
    },

    /**
     * Debounce para búsqueda
     */
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadProveedores();
        }, 500);
    },

    /**
     * Cargar proveedores con filtros y paginación
     */
    async loadProveedores() {
        try {
            Loader.show('Cargando proveedores...');

            const params = {
                buscar: this.filtros.buscar,
                activo: this.filtros.activo
            };

            const response = await ProveedoresService.getProveedores(params);

            if (response.success) {
                this.proveedores = response.data || [];
                this.totalRecords = this.proveedores.length;

                // Aplicar paginación manual
                const startIndex = (this.currentPage - 1) * this.limit;
                const endIndex = startIndex + this.limit;
                const proveedoresPaginados = this.proveedores.slice(startIndex, endIndex);

                this.totalPages = Math.ceil(this.totalRecords / this.limit);

                this.renderTable(proveedoresPaginados);
                this.renderPagination();
            } else {
                throw new Error(response.message || 'Error al cargar proveedores');
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando proveedores:', error);
            Alerts.error('Error al cargar proveedores', error.message);
        }
    },

    /**
     * Renderizar tabla de proveedores
     */
    renderTable(proveedores) {
        const tbody = document.getElementById('proveedoresTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.getElementById('tableContainer');

        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Sin resultados
        if (proveedores.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            document.getElementById('paginationContainer').style.display = 'none';
            return;
        }

        // Mostrar tabla
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        document.getElementById('paginationContainer').style.display = 'flex';

        // Llenar filas
        proveedores.forEach(proveedor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${proveedor.id}</td>
                <td>
                    <strong>${this.escapeHtml(proveedor.nombre)}</strong>
                </td>
                <td>
                    ${proveedor.contacto ?
                        this.escapeHtml(proveedor.contacto) :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${proveedor.email ?
                        `<a href="mailto:${proveedor.email}">${this.escapeHtml(proveedor.email)}</a>` :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${proveedor.telefono ?
                        `<a href="tel:${proveedor.telefono}">${this.escapeHtml(proveedor.telefono)}</a>` :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${proveedor.direccion ?
                        this.escapeHtml(proveedor.direccion.substring(0, 50)) + (proveedor.direccion.length > 50 ? '...' : '') :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td class="text-center">
                    ${proveedor.activo ?
                        '<span class="badge bg-success">Activo</span>' :
                        '<span class="badge bg-danger">Inactivo</span>'
                    }
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="ProveedoresController.openDetalleModal(${proveedor.id})"
                                title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary"
                                onclick="ProveedoresController.openEditModal(${proveedor.id})"
                                title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${proveedor.activo ? `
                            <button class="btn btn-outline-danger"
                                    onclick="ProveedoresController.deleteProveedor(${proveedor.id})"
                                    title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Actualizar contador
        document.getElementById('showingCount').textContent = proveedores.length;
        document.getElementById('totalCount').textContent = this.totalRecords;
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        pagination.innerHTML = '';

        if (this.totalPages <= 1) return;

        // Botón anterior
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="ProveedoresController.goToPage(${this.currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        `;
        pagination.appendChild(prevLi);

        // Páginas
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `
                <a class="page-link" href="#" onclick="ProveedoresController.goToPage(${i}); return false;">
                    ${i}
                </a>
            `;
            pagination.appendChild(li);
        }

        // Botón siguiente
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="ProveedoresController.goToPage(${this.currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextLi);
    },

    /**
     * Ir a página específica
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadProveedores();
    },

    /**
     * Abrir modal para crear proveedor
     */
    openCreateModal() {
        this.isEditMode = false;
        this.currentProveedorId = null;

        // Limpiar formulario
        this.clearForm();

        // Configurar modal para crear
        document.getElementById('modalProveedorTitle').textContent = 'Nuevo Proveedor';
        document.getElementById('btnGuardarText').textContent = 'Guardar Proveedor';
        document.getElementById('estadoContainer').style.display = 'none';
        document.getElementById('infoAdicional').style.display = 'none';

        // Mostrar modal
        this.modalProveedor.show();
    },

    /**
     * Abrir modal para editar proveedor
     */
    async openEditModal(id) {
        try {
            Loader.show('Cargando proveedor...');

            const response = await ProveedoresService.getProveedorById(id);

            if (response.success) {
                this.isEditMode = true;
                this.currentProveedorId = id;
                const proveedor = response.data;

                // Llenar formulario
                document.getElementById('proveedorId').value = proveedor.id;
                document.getElementById('inputNombre').value = proveedor.nombre;
                document.getElementById('inputContacto').value = proveedor.contacto || '';
                document.getElementById('inputEmail').value = proveedor.email || '';
                document.getElementById('inputTelefono').value = proveedor.telefono || '';
                document.getElementById('inputDireccion').value = proveedor.direccion || '';
                document.getElementById('inputActivo').value = proveedor.activo ? 'true' : 'false';

                // Configurar modal para editar
                document.getElementById('modalProveedorTitle').textContent = 'Editar Proveedor';
                document.getElementById('btnGuardarText').textContent = 'Actualizar Proveedor';
                document.getElementById('estadoContainer').style.display = 'block';
                document.getElementById('infoAdicional').style.display = 'block';

                // Información adicional
                if (proveedor.created_at) {
                    document.getElementById('infoCreado').textContent =
                        new Date(proveedor.created_at).toLocaleString('es-GT');
                }
                if (proveedor.updated_at) {
                    document.getElementById('infoActualizado').textContent =
                        new Date(proveedor.updated_at).toLocaleString('es-GT');
                }

                // Mostrar modal
                this.modalProveedor.show();
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando proveedor:', error);
            Alerts.error('Error al cargar proveedor', error.message);
        }
    },

    /**
     * Abrir modal de detalle
     */
    async openDetalleModal(id) {
        try {
            Loader.show('Cargando proveedor...');

            const response = await ProveedoresService.getProveedorById(id);

            if (response.success) {
                this.currentProveedorId = id;
                const proveedor = response.data;

                // Llenar datos
                document.getElementById('detalleId').textContent = proveedor.id;
                document.getElementById('detalleNombre').textContent = proveedor.nombre;
                document.getElementById('detalleContacto').textContent = proveedor.contacto || '-';
                document.getElementById('detalleEmail').textContent = proveedor.email || '-';
                document.getElementById('detalleTelefono').textContent = proveedor.telefono || '-';
                document.getElementById('detalleDireccion').textContent = proveedor.direccion || '-';
                document.getElementById('detalleEstado').innerHTML = proveedor.activo ?
                    '<span class="badge bg-success">Activo</span>' :
                    '<span class="badge bg-danger">Inactivo</span>';
                document.getElementById('detalleCreado').textContent =
                    new Date(proveedor.created_at).toLocaleString('es-GT');

                // Mostrar modal
                this.modalDetalle.show();
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando proveedor:', error);
            Alerts.error('Error al cargar proveedor', error.message);
        }
    },

    /**
     * Guardar proveedor (crear o actualizar)
     */
    async saveProveedor() {
        try {
            // Obtener datos del formulario
            const proveedorData = {
                nombre: document.getElementById('inputNombre').value.trim(),
                contacto: document.getElementById('inputContacto').value.trim(),
                email: document.getElementById('inputEmail').value.trim(),
                telefono: document.getElementById('inputTelefono').value.trim(),
                direccion: document.getElementById('inputDireccion').value.trim(),
            };

            // Si es edición, agregar estado
            if (this.isEditMode) {
                proveedorData.activo = document.getElementById('inputActivo').value === 'true';
            }

            // Validar datos
            const validacion = ProveedoresService.validarDatosProveedor(proveedorData);
            if (!validacion.valido) {
                Alerts.warning('Datos inválidos', validacion.errores.join('<br>'));
                return;
            }

            // Mostrar loader en botón
            const btnGuardar = document.getElementById('btnGuardarProveedor');
            btnGuardar.classList.add('loading');
            btnGuardar.disabled = true;

            let response;
            if (this.isEditMode) {
                response = await ProveedoresService.updateProveedor(this.currentProveedorId, proveedorData);
            } else {
                response = await ProveedoresService.createProveedor(proveedorData);
            }

            btnGuardar.classList.remove('loading');
            btnGuardar.disabled = false;

            if (response.success) {
                Alerts.success(
                    this.isEditMode ? 'Proveedor actualizado' : 'Proveedor creado',
                    response.message
                );
                this.modalProveedor.hide();
                this.loadProveedores();
            } else {
                throw new Error(response.message || 'Error al guardar proveedor');
            }

        } catch (error) {
            const btnGuardar = document.getElementById('btnGuardarProveedor');
            btnGuardar.classList.remove('loading');
            btnGuardar.disabled = false;

            console.error('Error guardando proveedor:', error);
            Alerts.error('Error al guardar proveedor', error.message);
        }
    },

    /**
     * Eliminar (desactivar) proveedor
     */
    async deleteProveedor(id) {
        const result = await Swal.fire({
            title: '¿Eliminar proveedor?',
            text: 'El proveedor será desactivado y no podrá ser usado en futuras compras',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Loader.show('Eliminando proveedor...');

                const response = await ProveedoresService.deleteProveedor(id);

                if (response.success) {
                    Alerts.success('Proveedor eliminado', response.message);
                    this.loadProveedores();
                }

                Loader.hide();
            } catch (error) {
                Loader.hide();
                console.error('Error eliminando proveedor:', error);
                Alerts.error('Error al eliminar proveedor', error.message);
            }
        }
    },

    /**
     * Limpiar filtros
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterEstado').value = 'true';
        this.filtros = {
            buscar: '',
            activo: 'true'
        };
        this.currentPage = 1;
        this.loadProveedores();
    },

    /**
     * Limpiar formulario
     */
    clearForm() {
        const form = document.getElementById('formProveedor');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        }
    },

    /**
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Hacer disponible globalmente
window.ProveedoresController = ProveedoresController;
