/**
 * =====================================================
 * CONTROLADOR DE CLIENTES
 * =====================================================
 * Maneja toda la lógica de la vista de clientes:
 * - Listado con paginación y filtros
 * - CRUD completo (crear, editar, ver detalle, eliminar)
 * - Validación de formularios
 * - Búsqueda en tiempo real
 * =====================================================
 */

const ClientesController = {
    // Estado del controlador
    clientes: [],
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
    currentClienteId: null,
    modalCliente: null,
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
        console.log('Inicializando ClientesController...');

        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Inicializar modals de Bootstrap
        const modalClienteElement = document.getElementById('modalCliente');
        const modalDetalleElement = document.getElementById('modalDetalleCliente');

        if (modalClienteElement) {
            this.modalCliente = new bootstrap.Modal(modalClienteElement);
        }
        if (modalDetalleElement) {
            this.modalDetalle = new bootstrap.Modal(modalDetalleElement);
        }

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar clientes
        await this.loadClientes();
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
                this.loadClientes();
            });
        }

        // Botón guardar cliente
        const btnGuardar = document.getElementById('btnGuardarCliente');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => this.saveCliente());
        }

        // Botón editar desde detalle
        const btnEditarDesdeDetalle = document.getElementById('btnEditarDesdeDetalle');
        if (btnEditarDesdeDetalle) {
            btnEditarDesdeDetalle.addEventListener('click', () => {
                this.modalDetalle.hide();
                this.openEditModal(this.currentClienteId);
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
        const inputNit = document.getElementById('inputNit');
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

        // Validar y formatear NIT
        if (inputNit) {
            inputNit.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor && !ClientesService.validarNIT(valor)) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    if (valor) {
                        e.target.value = ClientesService.formatearNIT(valor);
                        e.target.classList.add('is-valid');
                    }
                }
            });
        }

        // Validar email
        if (inputEmail) {
            inputEmail.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor && !ClientesService.validarEmail(valor)) {
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
                if (valor && !ClientesService.validarTelefono(valor)) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    if (valor) {
                        e.target.value = ClientesService.formatearTelefono(valor);
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
            this.loadClientes();
        }, 500);
    },

    /**
     * Cargar clientes con filtros y paginación
     */
    async loadClientes() {
        try {
            Loader.show('Cargando clientes...');

            const params = {
                limite: this.limit,
                offset: (this.currentPage - 1) * this.limit,
                buscar: this.filtros.buscar,
                activo: this.filtros.activo
            };

            const response = await ClientesService.obtenerClientes(params);

            if (response.success) {
                this.clientes = response.data;
                this.totalRecords = response.total || this.clientes.length;
                this.totalPages = Math.ceil(this.totalRecords / this.limit);

                this.renderTable();
                this.renderPagination();
            } else {
                throw new Error(response.message || 'Error al cargar clientes');
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando clientes:', error);
            Alerts.error('Error al cargar clientes', error.message);
        }
    },

    /**
     * Renderizar tabla de clientes
     */
    renderTable() {
        const tbody = document.getElementById('clientesTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.getElementById('tableContainer');

        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Sin resultados
        if (this.clientes.length === 0) {
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
        this.clientes.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.id}</td>
                <td>
                    <strong>${this.escapeHtml(cliente.nombre)}</strong>
                </td>
                <td>
                    <span class="badge bg-secondary">${this.escapeHtml(cliente.nit || 'CF')}</span>
                </td>
                <td>
                    ${cliente.email ?
                        `<a href="mailto:${cliente.email}">${this.escapeHtml(cliente.email)}</a>` :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${cliente.telefono ?
                        `<a href="tel:${cliente.telefono}">${this.escapeHtml(cliente.telefono)}</a>` :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td>
                    ${cliente.direccion ?
                        this.escapeHtml(cliente.direccion.substring(0, 50)) + (cliente.direccion.length > 50 ? '...' : '') :
                        '<span class="text-muted">-</span>'
                    }
                </td>
                <td class="text-center">
                    ${cliente.activo ?
                        '<span class="badge bg-success">Activo</span>' :
                        '<span class="badge bg-danger">Inactivo</span>'
                    }
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="ClientesController.openDetalleModal(${cliente.id})"
                                title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary"
                                onclick="ClientesController.openEditModal(${cliente.id})"
                                title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${cliente.activo ? `
                            <button class="btn btn-outline-danger"
                                    onclick="ClientesController.deleteCliente(${cliente.id})"
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
        document.getElementById('showingCount').textContent = this.clientes.length;
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
            <a class="page-link" href="#" onclick="ClientesController.goToPage(${this.currentPage - 1}); return false;">
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
                <a class="page-link" href="#" onclick="ClientesController.goToPage(${i}); return false;">
                    ${i}
                </a>
            `;
            pagination.appendChild(li);
        }

        // Botón siguiente
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="ClientesController.goToPage(${this.currentPage + 1}); return false;">
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
        this.loadClientes();
    },

    /**
     * Abrir modal para crear cliente
     */
    openCreateModal() {
        this.isEditMode = false;
        this.currentClienteId = null;

        // Limpiar formulario
        this.clearForm();

        // Configurar modal para crear
        document.getElementById('modalClienteTitle').textContent = 'Nuevo Cliente';
        document.getElementById('btnGuardarText').textContent = 'Guardar Cliente';
        document.getElementById('estadoContainer').style.display = 'none';
        document.getElementById('infoAdicional').style.display = 'none';

        // Mostrar modal
        this.modalCliente.show();
    },

    /**
     * Abrir modal para editar cliente
     */
    async openEditModal(id) {
        try {
            Loader.show('Cargando cliente...');

            const response = await ClientesService.obtenerClientePorId(id);

            if (response.success) {
                this.isEditMode = true;
                this.currentClienteId = id;
                const cliente = response.data;

                // Llenar formulario
                document.getElementById('clienteId').value = cliente.id;
                document.getElementById('inputNombre').value = cliente.nombre;
                document.getElementById('inputNit').value = cliente.nit || '';
                document.getElementById('inputEmail').value = cliente.email || '';
                document.getElementById('inputTelefono').value = cliente.telefono || '';
                document.getElementById('inputDireccion').value = cliente.direccion || '';
                document.getElementById('inputActivo').value = cliente.activo ? 'true' : 'false';

                // Configurar modal para editar
                document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
                document.getElementById('btnGuardarText').textContent = 'Actualizar Cliente';
                document.getElementById('estadoContainer').style.display = 'block';
                document.getElementById('infoAdicional').style.display = 'block';

                // Información adicional
                if (cliente.created_at) {
                    document.getElementById('infoCreado').textContent =
                        new Date(cliente.created_at).toLocaleString('es-GT');
                }
                if (cliente.updated_at) {
                    document.getElementById('infoActualizado').textContent =
                        new Date(cliente.updated_at).toLocaleString('es-GT');
                }

                // Mostrar modal
                this.modalCliente.show();
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando cliente:', error);
            Alerts.error('Error al cargar cliente', error.message);
        }
    },

    /**
     * Abrir modal de detalle
     */
    async openDetalleModal(id) {
        try {
            Loader.show('Cargando cliente...');

            const response = await ClientesService.obtenerClientePorId(id);

            if (response.success) {
                this.currentClienteId = id;
                const cliente = response.data;

                // Llenar datos
                document.getElementById('detalleId').textContent = cliente.id;
                document.getElementById('detalleNombre').textContent = cliente.nombre;
                document.getElementById('detalleNit').textContent = cliente.nit || 'CF';
                document.getElementById('detalleEmail').textContent = cliente.email || '-';
                document.getElementById('detalleTelefono').textContent = cliente.telefono || '-';
                document.getElementById('detalleDireccion').textContent = cliente.direccion || '-';
                document.getElementById('detalleEstado').innerHTML = cliente.activo ?
                    '<span class="badge bg-success">Activo</span>' :
                    '<span class="badge bg-danger">Inactivo</span>';
                document.getElementById('detalleCreado').textContent =
                    new Date(cliente.created_at).toLocaleString('es-GT');

                // Mostrar modal
                this.modalDetalle.show();
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando cliente:', error);
            Alerts.error('Error al cargar cliente', error.message);
        }
    },

    /**
     * Guardar cliente (crear o actualizar)
     */
    async saveCliente() {
        try {
            // Obtener datos del formulario
            const clienteData = {
                nombre: document.getElementById('inputNombre').value.trim(),
                nit: document.getElementById('inputNit').value.trim(),
                email: document.getElementById('inputEmail').value.trim(),
                telefono: document.getElementById('inputTelefono').value.trim(),
                direccion: document.getElementById('inputDireccion').value.trim(),
            };

            // Si es edición, agregar estado
            if (this.isEditMode) {
                clienteData.activo = document.getElementById('inputActivo').value === 'true';
            }

            // Validar datos
            const validacion = ClientesService.validarDatosCliente(clienteData);
            if (!validacion.valido) {
                Alerts.warning('Datos inválidos', validacion.errores.join('<br>'));
                return;
            }

            // Mostrar loader en botón
            const btnGuardar = document.getElementById('btnGuardarCliente');
            btnGuardar.classList.add('loading');
            btnGuardar.disabled = true;

            let response;
            if (this.isEditMode) {
                response = await ClientesService.actualizarCliente(this.currentClienteId, clienteData);
            } else {
                response = await ClientesService.crearCliente(clienteData);
            }

            btnGuardar.classList.remove('loading');
            btnGuardar.disabled = false;

            if (response.success) {
                Alerts.success(
                    this.isEditMode ? 'Cliente actualizado' : 'Cliente creado',
                    response.message
                );
                this.modalCliente.hide();
                this.loadClientes();
            } else {
                throw new Error(response.message || 'Error al guardar cliente');
            }

        } catch (error) {
            const btnGuardar = document.getElementById('btnGuardarCliente');
            btnGuardar.classList.remove('loading');
            btnGuardar.disabled = false;

            console.error('Error guardando cliente:', error);
            Alerts.error('Error al guardar cliente', error.message);
        }
    },

    /**
     * Eliminar (desactivar) cliente
     */
    async deleteCliente(id) {
        const result = await Swal.fire({
            title: '¿Eliminar cliente?',
            text: 'El cliente será desactivado y no podrá ser usado en futuras ventas',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                Loader.show('Eliminando cliente...');

                const response = await ClientesService.eliminarCliente(id);

                if (response.success) {
                    Alerts.success('Cliente eliminado', response.message);
                    this.loadClientes();
                }

                Loader.hide();
            } catch (error) {
                Loader.hide();
                console.error('Error eliminando cliente:', error);
                Alerts.error('Error al eliminar cliente', error.message);
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
        this.loadClientes();
    },

    /**
     * Limpiar formulario
     */
    clearForm() {
        const form = document.getElementById('formCliente');
        if (form) {
            form.reset();
            form.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        }
        document.getElementById('inputNit').value = 'CF';
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
window.ClientesController = ClientesController;
