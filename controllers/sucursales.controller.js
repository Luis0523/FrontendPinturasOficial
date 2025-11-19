
const SucursalesController = {
    
    sucursales: [],
    sucursalActual: null,
    modoEdicion: false,
    filtroActivas: 'todas', 

    
    
    async init() {
        try {
            console.log('🚀 Inicializando Sucursales Controller...');

            
            if (!requirePermission(Permissions.canAccessSettings)) {
                return;
            }

            
            await this.loadSucursales();

            
            this.setupEvents();

            console.log('✅ Sucursales Controller inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar Sucursales Controller:', error);
            Alerts.error('Error al inicializar: ' + error.message);
        }
    },

    

    async loadSucursales() {
        try {
            Loader.showInElement('sucursalesTableBody', 'Cargando sucursales...');

            const response = await SucursalesService.getAllSucursales();
            this.sucursales = response.data || [];

            this.renderTable();

        } catch (error) {
            console.error('Error al cargar sucursales:', error);
            Alerts.error('Error al cargar sucursales: ' + error.message);
            document.getElementById('sucursalesTableBody').innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error al cargar sucursales
                    </td>
                </tr>
            `;
        }
    },

    

    renderTable() {
        const tbody = document.getElementById('sucursalesTableBody');
        
        
        let sucursalesFiltradas = this.sucursales;
        if (this.filtroActivas === 'activas') {
            sucursalesFiltradas = this.sucursales.filter(s => s.activa);
        } else if (this.filtroActivas === 'inactivas') {
            sucursalesFiltradas = this.sucursales.filter(s => !s.activa);
        }

        if (!sucursalesFiltradas || sucursalesFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                        <p class="mb-0">No hay sucursales registradas</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sucursalesFiltradas.map(sucursal => `
            <tr>
                <td class="align-middle">${sucursal.id}</td>
                <td class="align-middle">
                    <strong>${this.escapeHtml(sucursal.nombre)}</strong>
                </td>
                <td class="align-middle">
                    <small class="text-muted">${this.escapeHtml(sucursal.direccion || '-')}</small>
                </td>
                <td class="align-middle text-center">
                    ${sucursal.gps_lat && sucursal.gps_lng ? `
                        <span class="badge bg-success" title="Lat: ${sucursal.gps_lat}, Lng: ${sucursal.gps_lng}">
                            <i class="bi bi-geo-alt-fill"></i> Sí
                        </span>
                    ` : `
                        <span class="badge bg-secondary">
                            <i class="bi bi-geo-alt"></i> No
                        </span>
                    `}
                </td>
                <td class="align-middle">
                    <small>${this.escapeHtml(sucursal.telefono || '-')}</small>
                </td>
                <td class="align-middle text-center">
                    ${sucursal.activa ? `
                        <span class="badge bg-success">
                            <i class="bi bi-check-circle"></i> Activa
                        </span>
                    ` : `
                        <span class="badge bg-danger">
                            <i class="bi bi-x-circle"></i> Inactiva
                        </span>
                    `}
                </td>
                <td class="align-middle text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="SucursalesController.openEditModal(${sucursal.id})"
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${sucursal.activa ? `
                        <button class="btn btn-sm btn-outline-warning me-1" 
                                onclick="SucursalesController.confirmDesactivar(${sucursal.id})"
                                title="Desactivar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-success me-1" 
                                onclick="SucursalesController.confirmReactivar(${sucursal.id})"
                                title="Reactivar">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    `}
                </td>
            </tr>
        `).join('');
    },

    

    openCreateModal() {
        this.modoEdicion = false;
        this.sucursalActual = null;

        document.getElementById('modalSucursalTitle').textContent = 'Nueva Sucursal';
        document.getElementById('sucursalForm').reset();
        document.getElementById('sucursalId').value = '';
        document.getElementById('sucursalActiva').checked = true;

        const modal = new bootstrap.Modal(document.getElementById('modalSucursal'));
        modal.show();
    },

    async openEditModal(id) {
        try {
            this.modoEdicion = true;
            
            Loader.show('Cargando sucursal...');

            const response = await SucursalesService.getSucursalById(id);
            this.sucursalActual = response.data;

            document.getElementById('modalSucursalTitle').textContent = 'Editar Sucursal';
            document.getElementById('sucursalId').value = this.sucursalActual.id;
            document.getElementById('sucursalNombre').value = this.sucursalActual.nombre;
            document.getElementById('sucursalDireccion').value = this.sucursalActual.direccion || '';
            document.getElementById('sucursalGpsLat').value = this.sucursalActual.gps_lat || '';
            document.getElementById('sucursalGpsLng').value = this.sucursalActual.gps_lng || '';
            document.getElementById('sucursalTelefono').value = this.sucursalActual.telefono || '';
            document.getElementById('sucursalActiva').checked = this.sucursalActual.activa;

            Loader.hide();

            const modal = new bootstrap.Modal(document.getElementById('modalSucursal'));
            modal.show();

        } catch (error) {
            Loader.hide();
            console.error('Error al cargar sucursal:', error);
            Alerts.error('Error al cargar sucursal: ' + error.message);
        }
    },

    

    async saveSucursal() {
        try {
            const form = document.getElementById('sucursalForm');
            
            
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const sucursalData = {
                nombre: document.getElementById('sucursalNombre').value.trim(),
                direccion: document.getElementById('sucursalDireccion').value.trim(),
                gps_lat: document.getElementById('sucursalGpsLat').value,
                gps_lng: document.getElementById('sucursalGpsLng').value,
                telefono: document.getElementById('sucursalTelefono').value.trim(),
                activa: document.getElementById('sucursalActiva').checked
            };

            
            if (!sucursalData.nombre) {
                Alerts.warning('El nombre de la sucursal es obligatorio');
                return;
            }

            
            if (sucursalData.gps_lat && sucursalData.gps_lng) {
                const lat = parseFloat(sucursalData.gps_lat);
                const lng = parseFloat(sucursalData.gps_lng);

                if (isNaN(lat) || lat < -90 || lat > 90) {
                    Alerts.warning('Latitud inválida. Debe estar entre -90 y 90');
                    return;
                }

                if (isNaN(lng) || lng < -180 || lng > 180) {
                    Alerts.warning('Longitud inválida. Debe estar entre -180 y 180');
                    return;
                }
            }

            Loader.show(this.modoEdicion ? 'Actualizando sucursal...' : 'Creando sucursal...');

            let response;
            if (this.modoEdicion) {
                const sucursalId = document.getElementById('sucursalId').value;
                response = await SucursalesService.updateSucursal(sucursalId, sucursalData);
            } else {
                response = await SucursalesService.createSucursal(sucursalData);
            }

            Loader.hide();

            
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSucursal'));
            modal.hide();

            
            Alerts.success(response.message || 'Sucursal guardada exitosamente');

            
            await this.loadSucursales();

        } catch (error) {
            Loader.hide();
            console.error('Error al guardar sucursal:', error);
            Alerts.error('Error al guardar: ' + error.message);
        }
    },

    

    async confirmDesactivar(id) {
        const sucursal = this.sucursales.find(s => s.id === id);
        
        if (!sucursal) {
            Alerts.error('Sucursal no encontrada');
            return;
        }

        const confirmed = await Alerts.confirm(
            `¿Desactivar la sucursal "${sucursal.nombre}"?`,
            'Podrá reactivarla después'
        );

        if (confirmed) {
            await this.desactivarSucursal(id);
        }
    },

    async desactivarSucursal(id) {
        try {
            Loader.show('Desactivando sucursal...');

            const response = await SucursalesService.deleteSucursal(id);

            Loader.hide();

            Alerts.success(response.message || 'Sucursal desactivada exitosamente');

            
            await this.loadSucursales();

        } catch (error) {
            Loader.hide();
            console.error('Error al desactivar sucursal:', error);
            Alerts.error('Error al desactivar: ' + error.message);
        }
    },

    async confirmReactivar(id) {
        const sucursal = this.sucursales.find(s => s.id === id);
        
        if (!sucursal) {
            Alerts.error('Sucursal no encontrada');
            return;
        }

        const confirmed = await Alerts.confirm(
            `¿Reactivar la sucursal "${sucursal.nombre}"?`,
            'La sucursal volverá a estar disponible'
        );

        if (confirmed) {
            await this.reactivarSucursal(id);
        }
    },

    async reactivarSucursal(id) {
        try {
            Loader.show('Reactivando sucursal...');

            const response = await SucursalesService.reactivarSucursal(id);

            Loader.hide();

            Alerts.success(response.message || 'Sucursal reactivada exitosamente');

            
            await this.loadSucursales();

        } catch (error) {
            Loader.hide();
            console.error('Error al reactivar sucursal:', error);
            Alerts.error('Error al reactivar: ' + error.message);
        }
    },

    

    setupEvents() {
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.filterTable(searchInput.value);
            }, 300));
        }

        
        const estadoFilter = document.getElementById('estadoFilter');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', (e) => {
                this.filtroActivas = e.target.value;
                this.renderTable();
            });
        }

        
        const form = document.getElementById('sucursalForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSucursal();
            });
        }
    },

    filterTable(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('#sucursalesTableBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


window.SucursalesController = SucursalesController;
