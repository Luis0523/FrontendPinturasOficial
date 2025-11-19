
const RolesController = {
    
    roles: [],
    rolActual: null,
    modoEdicion: false,

    
    
    async init() {
        try {
            console.log('🚀 Inicializando Roles Controller...');

            
            if (!requirePermission(Permissions.canManageUsers)) {
                return;
            }

            
            await this.loadRoles();

            
            this.setupEvents();

            console.log('✅ Roles Controller inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar Roles Controller:', error);
            Alerts.error('Error al inicializar: ' + error.message);
        }
    },

    

    async loadRoles() {
        try {
            Loader.showInElement('rolesTableBody', 'Cargando roles...');

            const response = await RolesService.getRoles();
            this.roles = response.data || [];

            this.renderTable();

        } catch (error) {
            console.error('Error al cargar roles:', error);
            Alerts.error('Error al cargar roles: ' + error.message);
            document.getElementById('rolesTableBody').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error al cargar roles
                    </td>
                </tr>
            `;
        }
    },

    

    renderTable() {
        const tbody = document.getElementById('rolesTableBody');
        
        if (!this.roles || this.roles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                        <p class="mb-0">No hay roles registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.roles.map(rol => `
            <tr>
                <td class="align-middle">${rol.id}</td>
                <td class="align-middle">
                    <strong>${this.escapeHtml(rol.nombre)}</strong>
                </td>
                <td class="align-middle text-center">
                    <span class="badge bg-info">
                        <i class="bi bi-people me-1"></i>
                        ${rol.usuario_count || 0} usuarios
                    </span>
                </td>
                <td class="align-middle text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="RolesController.openEditModal(${rol.id})"
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="RolesController.confirmDelete(${rol.id})"
                            title="Eliminar"
                            ${this.isRolProtegido(rol.nombre) ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    

    openCreateModal() {
        this.modoEdicion = false;
        this.rolActual = null;

        document.getElementById('modalRolTitle').textContent = 'Nuevo Rol';
        document.getElementById('rolForm').reset();
        document.getElementById('rolId').value = '';

        const modal = new bootstrap.Modal(document.getElementById('modalRol'));
        modal.show();
    },

    async openEditModal(id) {
        try {
            this.modoEdicion = true;
            
            Loader.show('Cargando rol...');

            const response = await RolesService.getRolById(id);
            this.rolActual = response.data;

            document.getElementById('modalRolTitle').textContent = 'Editar Rol';
            document.getElementById('rolId').value = this.rolActual.id;
            document.getElementById('rolNombre').value = this.rolActual.nombre;

            Loader.hide();

            const modal = new bootstrap.Modal(document.getElementById('modalRol'));
            modal.show();

        } catch (error) {
            Loader.hide();
            console.error('Error al cargar rol:', error);
            Alerts.error('Error al cargar rol: ' + error.message);
        }
    },

    

    async saveRol() {
        try {
            const form = document.getElementById('rolForm');
            
            
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const rolData = {
                nombre: document.getElementById('rolNombre').value.trim()
            };

            
            if (!rolData.nombre) {
                Alerts.warning('El nombre del rol es obligatorio');
                return;
            }

            Loader.show(this.modoEdicion ? 'Actualizando rol...' : 'Creando rol...');

            let response;
            if (this.modoEdicion) {
                const rolId = document.getElementById('rolId').value;
                response = await RolesService.updateRol(rolId, rolData);
            } else {
                response = await RolesService.createRol(rolData);
            }

            Loader.hide();

            
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRol'));
            modal.hide();

            
            Alerts.success(response.message || 'Rol guardado exitosamente');

            
            await this.loadRoles();

        } catch (error) {
            Loader.hide();
            console.error('Error al guardar rol:', error);
            Alerts.error('Error al guardar: ' + error.message);
        }
    },

    

    async confirmDelete(id) {
        const rol = this.roles.find(r => r.id === id);
        
        if (!rol) {
            Alerts.error('Rol no encontrado');
            return;
        }

        
        if (this.isRolProtegido(rol.nombre)) {
            Alerts.warning('No se puede eliminar este rol del sistema');
            return;
        }

        const confirmed = await Alerts.confirm(
            `¿Está seguro que desea eliminar el rol "${rol.nombre}"?`,
            'Esta acción no se puede deshacer'
        );

        if (confirmed) {
            await this.deleteRol(id);
        }
    },

    async deleteRol(id) {
        try {
            Loader.show('Eliminando rol...');

            const response = await RolesService.deleteRol(id);

            Loader.hide();

            Alerts.success(response.message || 'Rol eliminado exitosamente');

            
            await this.loadRoles();

        } catch (error) {
            Loader.hide();
            console.error('Error al eliminar rol:', error);
            Alerts.error('Error al eliminar: ' + error.message);
        }
    },

    

    setupEvents() {
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filterTable(searchInput.value);
            }, 300));
        }

        
        const form = document.getElementById('rolForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRol();
            });
        }
    },

    filterTable(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('#rolesTableBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    

    isRolProtegido(nombreRol) {
        const rolesProtegidos = ['Administrador', 'Gerente', 'Cajero', 'Bodeguero', 'Vendedor'];
        return rolesProtegidos.includes(nombreRol);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


window.RolesController = RolesController;
