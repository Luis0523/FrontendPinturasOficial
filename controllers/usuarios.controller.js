/**
 * =====================================================
 * CONTROLADOR DE USUARIOS
 * =====================================================
 * Maneja toda la lógica de la vista de usuarios:
 * - Listado con filtros
 * - CRUD completo (crear, editar, eliminar)
 * - Gestión de roles y permisos
 * =====================================================
 */

const UsuariosController = {
    // Estado del controlador
    usuarios: [],
    roles: [],
    sucursales: [],
    currentUsuarioId: null,
    modalUsuario: null,
    modalDetalle: null,
    isEditMode: false,
    filtros: {
        buscar: '',
        rol_id: '',
        activo: 'true' // Por defecto solo activos
    },

    /**
     * Inicializar controlador
     */
    async init() {
        console.log('Inicializando UsuariosController...');

        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Validar permisos de acceso
        if (!requirePermission(Permissions.canViewUsers)) {
            return; // El requirePermission ya redirige
        }

        // Inicializar modals de Bootstrap
        const modalUsuarioElement = document.getElementById('modalUsuario');
        const modalDetalleElement = document.getElementById('modalDetalleUsuario');

        if (modalUsuarioElement) {
            this.modalUsuario = new bootstrap.Modal(modalUsuarioElement);
        }
        if (modalDetalleElement) {
            this.modalDetalle = new bootstrap.Modal(modalDetalleElement);
        }

        // Cargar datos iniciales
        await this.loadRoles();
        await this.loadSucursales();

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar usuarios
        await this.loadUsuarios();
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.loadUsuarios();
            });
        }

        // Filtro por rol
        const filterRol = document.getElementById('filterRol');
        if (filterRol) {
            filterRol.addEventListener('change', (e) => {
                this.filtros.rol_id = e.target.value;
                this.loadUsuarios();
            });
        }

        // Filtro por estado
        const filterEstado = document.getElementById('filterEstado');
        if (filterEstado) {
            filterEstado.addEventListener('change', (e) => {
                this.filtros.activo = e.target.value;
                this.loadUsuarios();
            });
        }

        // Botón guardar usuario
        const btnGuardarUsuario = document.getElementById('btnGuardarUsuario');
        if (btnGuardarUsuario) {
            btnGuardarUsuario.addEventListener('click', () => this.saveUsuario());
        }

        // Botón editar desde detalle
        const btnEditarDesdeDetalle = document.getElementById('btnEditarDesdeDetalle');
        if (btnEditarDesdeDetalle) {
            btnEditarDesdeDetalle.addEventListener('click', () => {
                if (this.currentUsuarioId) {
                    this.modalDetalle.hide();
                    this.openEditModal(this.currentUsuarioId);
                }
            });
        }
    },

    /**
     * Cargar roles
     */
    async loadRoles() {
        try {
            const response = await RolesService.getRoles();
            if (response.success && response.data) {
                this.roles = response.data;

                // Llenar selector de roles del formulario
                const selectRol = document.getElementById('selectRol');
                if (selectRol) {
                    selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
                    this.roles.forEach(rol => {
                        const option = document.createElement('option');
                        option.value = rol.id;
                        option.textContent = rol.nombre;
                        selectRol.appendChild(option);
                    });
                }

                // Llenar filtro de roles
                const filterRol = document.getElementById('filterRol');
                if (filterRol) {
                    const currentValue = filterRol.value;
                    filterRol.innerHTML = '<option value="">Todos los roles</option>';
                    this.roles.forEach(rol => {
                        const option = document.createElement('option');
                        option.value = rol.id;
                        option.textContent = rol.nombre;
                        filterRol.appendChild(option);
                    });
                    filterRol.value = currentValue;
                }
            }
        } catch (error) {
            console.error('Error al cargar roles:', error);
            Alerts.error('Error al cargar los roles');
        }
    },

    /**
     * Cargar sucursales
     */
    async loadSucursales() {
        try {
            const response = await SucursalesService.getSucursales();
            if (response.success && response.data) {
                this.sucursales = response.data;

                // Llenar selector de sucursales
                const selectSucursal = document.getElementById('selectSucursal');
                if (selectSucursal) {
                    selectSucursal.innerHTML = '<option value="">Sin sucursal asignada</option>';
                    this.sucursales.forEach(sucursal => {
                        const option = document.createElement('option');
                        option.value = sucursal.id;
                        option.textContent = sucursal.nombre;
                        selectSucursal.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
            Alerts.error('Error al cargar las sucursales');
        }
    },

    /**
     * Cargar usuarios
     */
    async loadUsuarios() {
        try {
            Loader.show();

            // Preparar filtros
            const filtros = {};

            if (this.filtros.activo !== '') {
                filtros.activo = this.filtros.activo;
            }

            if (this.filtros.rol_id) {
                filtros.rol_id = this.filtros.rol_id;
            }

            const response = await UsuariosService.getUsuarios(filtros);

            if (response.success && response.data) {
                this.usuarios = response.data;

                // Filtrar por búsqueda en frontend (nombre, email, dpi)
                const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
                let usuariosFiltrados = this.usuarios;

                if (searchTerm) {
                    usuariosFiltrados = this.usuarios.filter(usuario =>
                        usuario.nombre?.toLowerCase().includes(searchTerm) ||
                        usuario.email?.toLowerCase().includes(searchTerm) ||
                        usuario.dpi?.toLowerCase().includes(searchTerm)
                    );
                }

                this.renderTable(usuariosFiltrados);
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            Alerts.error('Error al cargar los usuarios');
        } finally {
            Loader.hide();
        }
    },

    /**
     * Renderizar tabla de usuarios
     */
    renderTable(usuarios) {
        const tbody = document.getElementById('usuariosTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.getElementById('tableContainer');

        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Si no hay usuarios
        if (!usuarios || usuarios.length === 0) {
            if (tableContainer) tableContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Mostrar tabla
        if (tableContainer) tableContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        // Renderizar filas
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');

            // Estado badge
            const estadoBadge = usuario.activo
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';

            tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>
                    <div class="fw-semibold">${usuario.nombre || '-'}</div>
                </td>
                <td>${usuario.dpi || '-'}</td>
                <td>${usuario.email || '-'}</td>
                <td>
                    <span class="badge bg-primary">${usuario.rol?.nombre || '-'}</span>
                </td>
                <td>${usuario.sucursal?.nombre || 'Sin asignar'}</td>
                <td>${estadoBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="UsuariosController.viewUsuario(${usuario.id})"
                                title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" onclick="UsuariosController.openEditModal(${usuario.id})"
                                title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="UsuariosController.deleteUsuario(${usuario.id})"
                                title="Desactivar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    },

    /**
     * Abrir modal para crear usuario
     */
    openCreateModal() {
        this.isEditMode = false;
        this.currentUsuarioId = null;

        // Limpiar formulario
        const form = document.getElementById('formUsuario');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
        }

        // Cambiar título
        const modalLabel = document.getElementById('modalUsuarioLabel');
        if (modalLabel) {
            modalLabel.innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Usuario';
        }

        // Mostrar campo de password
        const passwordGroup = document.getElementById('passwordGroup');
        if (passwordGroup) {
            passwordGroup.style.display = 'block';
            const inputPassword = document.getElementById('inputPassword');
            if (inputPassword) inputPassword.required = true;
        }

        // Mostrar modal
        if (this.modalUsuario) {
            this.modalUsuario.show();
        }
    },

    /**
     * Abrir modal para editar usuario
     */
    async openEditModal(usuarioId) {
        try {
            this.isEditMode = true;
            this.currentUsuarioId = usuarioId;

            Loader.show();

            const response = await UsuariosService.getUsuarioById(usuarioId);

            if (response.success && response.data) {
                const usuario = response.data;

                // Llenar formulario
                document.getElementById('inputNombre').value = usuario.nombre || '';
                document.getElementById('inputDPI').value = usuario.dpi || '';
                document.getElementById('inputEmail').value = usuario.email || '';
                document.getElementById('selectRol').value = usuario.rol_id || '';
                document.getElementById('selectSucursal').value = usuario.sucursal_id || '';
                document.getElementById('inputActivo').checked = usuario.activo;

                // Ocultar campo de password en edición
                const passwordGroup = document.getElementById('passwordGroup');
                if (passwordGroup) {
                    passwordGroup.style.display = 'none';
                    const inputPassword = document.getElementById('inputPassword');
                    if (inputPassword) {
                        inputPassword.required = false;
                        inputPassword.value = '';
                    }
                }

                // Cambiar título
                const modalLabel = document.getElementById('modalUsuarioLabel');
                if (modalLabel) {
                    modalLabel.innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Usuario';
                }

                // Limpiar validación
                const form = document.getElementById('formUsuario');
                if (form) form.classList.remove('was-validated');

                // Mostrar modal
                if (this.modalUsuario) {
                    this.modalUsuario.show();
                }
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            Alerts.error('Error al cargar el usuario');
        } finally {
            Loader.hide();
        }
    },

    /**
     * Guardar usuario (crear o actualizar)
     */
    async saveUsuario() {
        const form = document.getElementById('formUsuario');

        if (!form) return;

        // Validar formulario
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        try {
            Loader.show();

            // Obtener datos del formulario
            const usuarioData = {
                nombre: document.getElementById('inputNombre').value.trim(),
                dpi: document.getElementById('inputDPI').value.trim(),
                email: document.getElementById('inputEmail').value.trim(),
                rol_id: document.getElementById('selectRol').value,
                sucursal_id: document.getElementById('selectSucursal').value || null,
                activo: document.getElementById('inputActivo').checked
            };

            // Si es creación, agregar password
            if (!this.isEditMode) {
                const password = document.getElementById('inputPassword').value;
                if (password) {
                    usuarioData.password = password;
                }
            }

            let response;

            if (this.isEditMode) {
                // Actualizar usuario existente
                response = await UsuariosService.updateUsuario(this.currentUsuarioId, usuarioData);
            } else {
                // Crear nuevo usuario
                response = await UsuariosService.createUsuario(usuarioData);
            }

            if (response.success) {
                Alerts.success(this.isEditMode ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');

                // Cerrar modal
                if (this.modalUsuario) {
                    this.modalUsuario.hide();
                }

                // Recargar lista
                await this.loadUsuarios();
            }
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            Alerts.error(error.message || 'Error al guardar el usuario');
        } finally {
            Loader.hide();
        }
    },

    /**
     * Ver detalle de usuario
     */
    async viewUsuario(usuarioId) {
        try {
            this.currentUsuarioId = usuarioId;

            Loader.show();

            const response = await UsuariosService.getUsuarioById(usuarioId);

            if (response.success && response.data) {
                const usuario = response.data;

                // Llenar modal de detalle
                document.getElementById('detalleNombre').textContent = usuario.nombre || '-';
                document.getElementById('detalleDPI').textContent = usuario.dpi || '-';
                document.getElementById('detalleEmail').textContent = usuario.email || '-';
                document.getElementById('detalleRol').textContent = usuario.rol?.nombre || '-';
                document.getElementById('detalleSucursal').textContent = usuario.sucursal?.nombre || 'Sin asignar';

                const estadoBadge = usuario.activo
                    ? '<span class="badge bg-success">Activo</span>'
                    : '<span class="badge bg-secondary">Inactivo</span>';
                document.getElementById('detalleEstado').innerHTML = estadoBadge;

                // Fecha de creación
                if (usuario.creado_en) {
                    const fecha = new Date(usuario.creado_en);
                    document.getElementById('detalleFechaCreacion').textContent = fecha.toLocaleDateString('es-GT');
                } else {
                    document.getElementById('detalleFechaCreacion').textContent = '-';
                }

                // Mostrar modal
                if (this.modalDetalle) {
                    this.modalDetalle.show();
                }
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            Alerts.error('Error al cargar el usuario');
        } finally {
            Loader.hide();
        }
    },

    /**
     * Eliminar (desactivar) usuario
     */
    async deleteUsuario(usuarioId) {
        const confirmar = await Alerts.confirm(
            '¿Está seguro de desactivar este usuario?',
            'El usuario no podrá iniciar sesión en el sistema'
        );

        if (!confirmar) return;

        try {
            Loader.show();

            const response = await UsuariosService.deleteUsuario(usuarioId);

            if (response.success) {
                Alerts.success('Usuario desactivado exitosamente');
                await this.loadUsuarios();
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            Alerts.error(error.message || 'Error al eliminar el usuario');
        } finally {
            Loader.hide();
        }
    },

    /**
     * Limpiar filtros
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterRol').value = '';
        document.getElementById('filterEstado').value = 'true';

        this.filtros = {
            buscar: '',
            rol_id: '',
            activo: 'true'
        };

        this.loadUsuarios();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UsuariosController.init();
});
