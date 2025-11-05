/**
 * =====================================================
 * CONTROLADOR DE USUARIOS
 * =====================================================
 * Maneja toda la lógica de la vista de usuarios:
 * - Listado con paginación y filtros
 * - CRUD completo (crear, editar, ver detalle, eliminar)
 * - Validación de formularios
 * - Búsqueda en tiempo real
 * - Gestión de roles y permisos
 * - Cambio de contraseña
 * =====================================================
 */

const UsuariosController = {
    // Estado del controlador
    usuarios: [],
    sucursales: [],
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
    currentUsuarioId: null,
    modalUsuario: null,
    modalDetalle: null,
    modalPassword: null,
    isEditMode: false,
    searchTimeout: null,
    filtros: {
        buscar: '',
        rol: '',
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

        // Verificar permisos para ver usuarios
        if (!UsuariosService.puedeVerUsuarios()) {
            Permissions.redirectIfUnauthorized(() => false);
            return;
        }

        // Inicializar modals de Bootstrap
        const modalUsuarioElement = document.getElementById('modalUsuario');
        const modalDetalleElement = document.getElementById('modalDetalleUsuario');
        const modalPasswordElement = document.getElementById('modalPassword');

        if (modalUsuarioElement) {
            this.modalUsuario = new bootstrap.Modal(modalUsuarioElement);
        }
        if (modalDetalleElement) {
            this.modalDetalle = new bootstrap.Modal(modalDetalleElement);
        }
        if (modalPasswordElement) {
            this.modalPassword = new bootstrap.Modal(modalPasswordElement);
        }

        // Cargar sucursales
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
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filtros.buscar = e.target.value;
                this.debounceSearch();
            });
        }

        // Filtro por rol
        const filterRol = document.getElementById('filterRol');
        if (filterRol) {
            filterRol.addEventListener('change', (e) => {
                this.filtros.rol = e.target.value;
                this.currentPage = 1;
                this.loadUsuarios();
            });
        }

        // Filtro por estado
        const filterEstado = document.getElementById('filterEstado');
        if (filterEstado) {
            filterEstado.addEventListener('change', (e) => {
                this.filtros.activo = e.target.value;
                this.currentPage = 1;
                this.loadUsuarios();
            });
        }

        // Botón guardar usuario
        const btnGuardar = document.getElementById('btnGuardarUsuario');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => this.saveUsuario());
        }

        // Botón guardar password
        const btnGuardarPassword = document.getElementById('btnGuardarPassword');
        if (btnGuardarPassword) {
            btnGuardarPassword.addEventListener('click', () => this.savePassword());
        }

        // Botón editar desde detalle
        const btnEditarDesdeDetalle = document.getElementById('btnEditarDesdeDetalle');
        if (btnEditarDesdeDetalle) {
            btnEditarDesdeDetalle.addEventListener('click', () => {
                this.modalDetalle.hide();
                this.openEditModal(this.currentUsuarioId);
            });
        }

        // Limpiar modal al cerrar
        const modalUsuarioElement = document.getElementById('modalUsuario');
        if (modalUsuarioElement) {
            modalUsuarioElement.addEventListener('hidden.bs.modal', () => {
                this.clearForm();
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
        const inputPassword = document.getElementById('inputPassword');
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!valor || !emailRegex.test(valor)) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    e.target.classList.add('is-valid');
                }
            });
        }

        // Validar contraseña (solo en modo crear)
        if (inputPassword) {
            inputPassword.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                // Solo validar si estamos en modo crear o si hay valor
                if (!this.isEditMode && valor.length < 6) {
                    e.target.classList.add('is-invalid');
                } else if (valor && valor.length < 6) {
                    e.target.classList.add('is-invalid');
                } else if (valor) {
                    e.target.classList.remove('is-invalid');
                    e.target.classList.add('is-valid');
                } else {
                    e.target.classList.remove('is-invalid', 'is-valid');
                }
            });
        }

        // Validar teléfono (opcional)
        if (inputTelefono) {
            inputTelefono.addEventListener('blur', (e) => {
                const valor = e.target.value.trim();
                if (valor && valor.length < 8) {
                    e.target.classList.add('is-invalid');
                } else {
                    e.target.classList.remove('is-invalid');
                    if (valor) e.target.classList.add('is-valid');
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
            this.loadUsuarios();
        }, 500);
    },

    /**
     * Cargar sucursales
     */
    async loadSucursales() {
        try {
            const response = await axios.get('/sucursales');
            if (response.data.success) {
                this.sucursales = response.data.data;
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
        }
    },

    /**
     * Cargar usuarios con filtros y paginación
     */
    async loadUsuarios() {
        try {
            Loader.show('Cargando usuarios...');

            const params = {
                limite: this.limit,
                offset: (this.currentPage - 1) * this.limit,
                buscar: this.filtros.buscar,
                rol: this.filtros.rol,
                activo: this.filtros.activo
            };

            const response = await UsuariosService.obtenerUsuarios(params);

            if (response.success) {
                this.usuarios = response.data;
                this.totalRecords = response.total || this.usuarios.length;
                this.totalPages = Math.ceil(this.totalRecords / this.limit);

                this.renderTable();
                this.renderPagination();
            } else {
                throw new Error(response.message || 'Error al cargar usuarios');
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando usuarios:', error);
            Alerts.error('Error al cargar usuarios', error.message);
        }
    },

    /**
     * Renderizar tabla de usuarios
     */
    renderTable() {
        const tbody = document.getElementById('usuariosTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.getElementById('tableContainer');

        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Sin resultados
        if (this.usuarios.length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            document.getElementById('paginationContainer').style.display = 'none';
            return;
        }

        // Mostrar tabla
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        document.getElementById('paginationContainer').style.display = 'flex';

        const usuarioActual = UsuariosService.getUsuarioActual();
        const puedeGestionar = UsuariosService.validarPermisos();

        // Llenar filas
        this.usuarios.forEach(usuario => {
            const row = document.createElement('tr');
            const esUsuarioActual = usuario.id === usuarioActual.id;
            const badgeColor = this.getRolBadgeColor(usuario.rol);

            row.innerHTML = `
                <td>${usuario.id}</td>
                <td>
                    <strong>${this.escapeHtml(usuario.nombre)}</strong>
                    ${esUsuarioActual ? '<span class="badge bg-info ms-2">Tú</span>' : ''}
                </td>
                <td>${this.escapeHtml(usuario.email)}</td>
                <td>
                    <span class="badge bg-${badgeColor}">${this.escapeHtml(usuario.rol)}</span>
                </td>
                <td>${usuario.sucursal_nombre || 'N/A'}</td>
                <td>${usuario.telefono || '-'}</td>
                <td>
                    <span class="badge bg-${usuario.activo ? 'success' : 'danger'}">
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="UsuariosController.showDetalle(${usuario.id})"
                                title="Ver detalle">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${puedeGestionar && !esUsuarioActual ? `
                            <button class="btn btn-outline-primary"
                                    onclick="UsuariosController.openEditModal(${usuario.id})"
                                    title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-warning"
                                    onclick="UsuariosController.openPasswordModal(${usuario.id})"
                                    title="Cambiar contraseña">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="btn btn-outline-${usuario.activo ? 'danger' : 'success'}"
                                    onclick="UsuariosController.toggleEstado(${usuario.id}, ${!usuario.activo})"
                                    title="${usuario.activo ? 'Desactivar' : 'Activar'}">
                                <i class="bi bi-${usuario.activo ? 'x-circle' : 'check-circle'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';

        // Botón anterior
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="UsuariosController.goToPage(${this.currentPage - 1}); return false;">
                Anterior
            </a>
        `;
        paginationContainer.appendChild(prevLi);

        // Páginas
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            const firstLi = document.createElement('li');
            firstLi.className = 'page-item';
            firstLi.innerHTML = `<a class="page-link" href="#" onclick="UsuariosController.goToPage(1); return false;">1</a>`;
            paginationContainer.appendChild(firstLi);

            if (startPage > 2) {
                const dotsLi = document.createElement('li');
                dotsLi.className = 'page-item disabled';
                dotsLi.innerHTML = '<span class="page-link">...</span>';
                paginationContainer.appendChild(dotsLi);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `
                <a class="page-link" href="#" onclick="UsuariosController.goToPage(${i}); return false;">
                    ${i}
                </a>
            `;
            paginationContainer.appendChild(li);
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const dotsLi = document.createElement('li');
                dotsLi.className = 'page-item disabled';
                dotsLi.innerHTML = '<span class="page-link">...</span>';
                paginationContainer.appendChild(dotsLi);
            }

            const lastLi = document.createElement('li');
            lastLi.className = 'page-item';
            lastLi.innerHTML = `<a class="page-link" href="#" onclick="UsuariosController.goToPage(${this.totalPages}); return false;">${this.totalPages}</a>`;
            paginationContainer.appendChild(lastLi);
        }

        // Botón siguiente
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="UsuariosController.goToPage(${this.currentPage + 1}); return false;">
                Siguiente
            </a>
        `;
        paginationContainer.appendChild(nextLi);

        // Actualizar texto de información
        const startRecord = (this.currentPage - 1) * this.limit + 1;
        const endRecord = Math.min(this.currentPage * this.limit, this.totalRecords);
        document.getElementById('paginationInfo').textContent =
            `Mostrando ${startRecord} a ${endRecord} de ${this.totalRecords} usuarios`;
    },

    /**
     * Ir a página específica
     */
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsuarios();
        }
    },

    /**
     * Abrir modal para crear usuario
     */
    openCreateModal() {
        // Verificar permisos
        if (!UsuariosService.validarPermisos()) {
            Permissions.showAccessDenied();
            return;
        }

        this.isEditMode = false;
        this.currentUsuarioId = null;
        this.clearForm();

        // Configurar modal
        document.getElementById('modalUsuarioLabel').textContent = 'Nuevo Usuario';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('inputPassword').required = true;

        // Cargar roles en el select
        this.loadRolesSelect();

        // Cargar sucursales en el select
        this.loadSucursalesSelect();

        this.modalUsuario.show();
    },

    /**
     * Abrir modal para editar usuario
     */
    async openEditModal(id) {
        // Verificar permisos
        if (!UsuariosService.validarPermisos()) {
            Permissions.showAccessDenied();
            return;
        }

        try {
            Loader.show('Cargando datos...');

            const response = await UsuariosService.obtenerUsuarioPorId(id);

            if (!response.success) {
                throw new Error(response.message);
            }

            const usuario = response.data;

            // Verificar si puede editar este usuario
            if (!UsuariosService.puedeEditarUsuario(usuario)) {
                Alerts.warning('No puedes editar tu propio usuario desde este módulo');
                Loader.hide();
                return;
            }

            this.isEditMode = true;
            this.currentUsuarioId = id;

            // Configurar modal
            document.getElementById('modalUsuarioLabel').textContent = 'Editar Usuario';
            document.getElementById('passwordGroup').style.display = 'none';
            document.getElementById('inputPassword').required = false;

            // Cargar roles y sucursales
            this.loadRolesSelect();
            this.loadSucursalesSelect();

            // Llenar formulario
            document.getElementById('inputNombre').value = usuario.nombre;
            document.getElementById('inputEmail').value = usuario.email;
            document.getElementById('selectRol').value = usuario.rol;
            document.getElementById('selectSucursal').value = usuario.sucursal_id;
            document.getElementById('inputTelefono').value = usuario.telefono || '';
            document.getElementById('inputActivo').checked = usuario.activo;

            Loader.hide();
            this.modalUsuario.show();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando usuario:', error);
            Alerts.error('Error al cargar usuario', error.message);
        }
    },

    /**
     * Abrir modal para cambiar contraseña
     */
    async openPasswordModal(id) {
        // Verificar permisos
        if (!UsuariosService.validarPermisos()) {
            Permissions.showAccessDenied();
            return;
        }

        try {
            const response = await UsuariosService.obtenerUsuarioPorId(id);
            if (!response.success) {
                throw new Error(response.message);
            }

            this.currentUsuarioId = id;
            document.getElementById('passwordUsuarioNombre').textContent = response.data.nombre;

            // Limpiar campos
            document.getElementById('inputNuevaPassword').value = '';
            document.getElementById('inputConfirmarPassword').value = '';

            this.modalPassword.show();
        } catch (error) {
            console.error('Error:', error);
            Alerts.error('Error', error.message);
        }
    },

    /**
     * Guardar usuario (crear o editar)
     */
    async saveUsuario() {
        try {
            // Validar permisos
            if (!UsuariosService.validarPermisos()) {
                Permissions.showAccessDenied();
                return;
            }

            // Obtener datos del formulario
            const usuarioData = {
                nombre: document.getElementById('inputNombre').value.trim(),
                email: document.getElementById('inputEmail').value.trim(),
                rol: document.getElementById('selectRol').value,
                sucursal_id: document.getElementById('selectSucursal').value,
                telefono: document.getElementById('inputTelefono').value.trim(),
                activo: document.getElementById('inputActivo').checked
            };

            // Si es modo crear, agregar password
            if (!this.isEditMode) {
                usuarioData.password = document.getElementById('inputPassword').value;
            }

            // Validar datos básicos
            if (!usuarioData.nombre || !usuarioData.email || !usuarioData.rol || !usuarioData.sucursal_id) {
                Alerts.warning('Por favor complete todos los campos requeridos');
                return;
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.email)) {
                Alerts.warning('El formato del email no es válido');
                return;
            }

            // Validar password en modo crear
            if (!this.isEditMode && (!usuarioData.password || usuarioData.password.length < 6)) {
                Alerts.warning('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            Loader.show(this.isEditMode ? 'Actualizando usuario...' : 'Creando usuario...');

            let response;
            if (this.isEditMode) {
                response = await UsuariosService.actualizarUsuario(this.currentUsuarioId, usuarioData);
            } else {
                response = await UsuariosService.crearUsuario(usuarioData);
            }

            if (response.success) {
                Alerts.success(
                    this.isEditMode ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente'
                );
                this.modalUsuario.hide();
                await this.loadUsuarios();
            } else {
                throw new Error(response.message);
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error guardando usuario:', error);
            Alerts.error('Error al guardar usuario', error.message);
        }
    },

    /**
     * Guardar nueva contraseña
     */
    async savePassword() {
        try {
            const nuevaPassword = document.getElementById('inputNuevaPassword').value;
            const confirmarPassword = document.getElementById('inputConfirmarPassword').value;

            if (!nuevaPassword || !confirmarPassword) {
                Alerts.warning('Por favor complete todos los campos');
                return;
            }

            if (nuevaPassword.length < 6) {
                Alerts.warning('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            if (nuevaPassword !== confirmarPassword) {
                Alerts.warning('Las contraseñas no coinciden');
                return;
            }

            Loader.show('Cambiando contraseña...');

            const response = await UsuariosService.cambiarPassword(
                this.currentUsuarioId,
                nuevaPassword
            );

            if (response.success) {
                Alerts.success('Contraseña actualizada correctamente');
                this.modalPassword.hide();
            } else {
                throw new Error(response.message);
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cambiando contraseña:', error);
            Alerts.error('Error al cambiar contraseña', error.message);
        }
    },

    /**
     * Cambiar estado de usuario (activar/desactivar)
     */
    async toggleEstado(id, nuevoEstado) {
        try {
            const accion = nuevoEstado ? 'activar' : 'desactivar';
            const confirmado = await Alerts.confirm(
                `¿Está seguro que desea ${accion} este usuario?`,
                `${accion.charAt(0).toUpperCase() + accion.slice(1)} Usuario`
            );

            if (!confirmado) return;

            Loader.show(`${accion.charAt(0).toUpperCase() + accion.slice(1)}ando usuario...`);

            const response = await UsuariosService.cambiarEstado(id, nuevoEstado);

            if (response.success) {
                Alerts.success(`Usuario ${accion}do correctamente`);
                await this.loadUsuarios();
            } else {
                throw new Error(response.message);
            }

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cambiando estado:', error);
            Alerts.error('Error al cambiar estado', error.message);
        }
    },

    /**
     * Mostrar detalle de usuario
     */
    async showDetalle(id) {
        try {
            Loader.show('Cargando detalles...');

            const response = await UsuariosService.obtenerUsuarioPorId(id);

            if (!response.success) {
                throw new Error(response.message);
            }

            const usuario = response.data;
            this.currentUsuarioId = id;

            // Llenar modal de detalle
            document.getElementById('detalleNombre').textContent = usuario.nombre;
            document.getElementById('detalleEmail').textContent = usuario.email;
            document.getElementById('detalleRol').textContent = usuario.rol;
            document.getElementById('detalleSucursal').textContent = usuario.sucursal_nombre || 'N/A';
            document.getElementById('detalleTelefono').textContent = usuario.telefono || '-';

            const estadoBadge = document.getElementById('detalleEstado');
            estadoBadge.className = `badge bg-${usuario.activo ? 'success' : 'danger'}`;
            estadoBadge.textContent = usuario.activo ? 'Activo' : 'Inactivo';

            document.getElementById('detalleFechaCreacion').textContent =
                usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleString() : '-';
            document.getElementById('detalleUltimaModificacion').textContent =
                usuario.fecha_modificacion ? new Date(usuario.fecha_modificacion).toLocaleString() : '-';

            // Mostrar u ocultar botón editar según permisos
            const btnEditar = document.getElementById('btnEditarDesdeDetalle');
            if (btnEditar) {
                const puedeEditar = UsuariosService.puedeEditarUsuario(usuario);
                btnEditar.style.display = puedeEditar ? 'block' : 'none';
            }

            Loader.hide();
            this.modalDetalle.show();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando detalle:', error);
            Alerts.error('Error al cargar detalle', error.message);
        }
    },

    /**
     * Cargar roles en el select
     */
    loadRolesSelect() {
        const select = document.getElementById('selectRol');
        if (!select) return;

        const roles = UsuariosService.getRolesDisponibles();

        select.innerHTML = '<option value="">Seleccione un rol</option>';

        roles.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.value;
            option.textContent = `${rol.label} - ${rol.descripcion}`;
            select.appendChild(option);
        });
    },

    /**
     * Cargar sucursales en el select
     */
    loadSucursalesSelect() {
        const select = document.getElementById('selectSucursal');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccione una sucursal</option>';

        this.sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id;
            option.textContent = sucursal.nombre;
            select.appendChild(option);
        });
    },

    /**
     * Limpiar formulario
     */
    clearForm() {
        const form = document.getElementById('formUsuario');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
        }

        // Limpiar validaciones
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    },

    /**
     * Obtener color de badge según rol
     */
    getRolBadgeColor(rol) {
        const colores = {
            'Administrador': 'danger',
            'Gerente': 'primary',
            'Bodeguero': 'info',
            'Cajero': 'warning',
            'Vendedor': 'secondary'
        };
        return colores[rol] || 'secondary';
    },

    /**
     * Limpiar filtros
     */
    clearFilters() {
        this.filtros = {
            buscar: '',
            rol: '',
            activo: 'true'
        };

        // Limpiar inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('filterRol').value = '';
        document.getElementById('filterEstado').value = 'true';

        // Recargar
        this.currentPage = 1;
        this.loadUsuarios();
    },

    /**
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    UsuariosController.init();
});
