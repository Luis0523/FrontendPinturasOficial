/**
 * Controlador de Productos
 * Maneja toda la lógica de la vista de productos
 */

const ProductosController = {
    // Estado del controlador
    productos: [],
    categorias: [],
    marcas: [],
    presentaciones: [],
    presentacionesSeleccionadas: [], // Para el modal de crear/editar
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
    currentProductoId: null,
    modalProducto: null,
    modalDetalle: null,
    isEditMode: false,

    /**
     * Inicializar controlador
     */
    async init() {
        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Verificar permisos
      /*  if (!Permissions.canViewProducts()) {
            Permissions.redirectIfUnauthorized(() => false);
            return;
        }*/

        // Cargar layout
        await loadLayout();

        // Cargar modals
        await this.loadModals();

        // Inicializar modals de Bootstrap
        this.modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
        this.modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));

        // Cargar datos iniciales
        await this.loadInitialData();

        // Configurar event listeners
        this.setupEventListeners();

        // Cargar productos
        await this.loadProductos();
    },

    /**
     * Cargar modals
     */
    async loadModals() {
        await Promise.all([
            loadComponent('modal-producto-container', '/components/modals/modal-producto.html'),
            loadComponent('modal-detalle-container', '/components/modals/modal-detalle-producto.html')
        ]);
    },

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            Loader.show('Cargando datos...');

            const [productosRes, presentacionesRes] = await Promise.all([
                ProductosService.getProductos({ limit: 1000 }), // Cargar todos para extraer categorías/marcas
                PresentacionesService.getPresentaciones()
            ]);

            const productos = productosRes.data || [];
            this.presentaciones = presentacionesRes.data || [];

            // Extraer categorías únicas de los productos
            this.categorias = [...new Map(
                productos
                    .filter(p => p.categoria)
                    .map(p => [p.categoria.id, p.categoria])
            ).values()];

            // Extraer marcas únicas de los productos
            this.marcas = [...new Map(
                productos
                    .filter(p => p.marca)
                    .map(p => [p.marca.id, p.marca])
            ).values()];

            // Llenar selects
            this.fillFilterSelects();
            this.fillFormSelects();

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando datos iniciales:', error);
            Alerts.error('Error al cargar datos iniciales');
        }
    },

    /**
     * Llenar selects de filtros
     */
    fillFilterSelects() {
        // Categorías
        const filterCategoria = document.getElementById('filterCategoria');
        if (filterCategoria) {
            filterCategoria.innerHTML = '<option value="">Todas las Categorías</option>';
            this.categorias.forEach(cat => {
                filterCategoria.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
            });
        }

        // Marcas
        const filterMarca = document.getElementById('filterMarca');
        if (filterMarca) {
            filterMarca.innerHTML = '<option value="">Todas las Marcas</option>';
            this.marcas.forEach(marca => {
                filterMarca.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
            });
        }
    },

    /**
     * Llenar selects del formulario
     */
    fillFormSelects() {
        // Categorías en el formulario
        const categoriaSelect = document.getElementById('categoria_id');
        if (categoriaSelect) {
            categoriaSelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.categorias.forEach(cat => {
                categoriaSelect.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
            });
        }

        // Marcas en el formulario
        const marcaSelect = document.getElementById('marca_id');
        if (marcaSelect) {
            marcaSelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.marcas.forEach(marca => {
                marcaSelect.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
            });
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda con debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.currentPage = 1;
                this.loadProductos();
            }, 500));
        }

        // Filtros
        ['filterCategoria', 'filterMarca', 'filterEstado'].forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.loadProductos();
                });
            }
        });

        // Limpiar formulario al cerrar modal
        const modalElement = document.getElementById('modalProducto');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    },

    /**
     * Cargar productos con filtros
     */
    async loadProductos() {
        try {
            Loader.show('Cargando productos...');

            const filtros = {
                buscar: document.getElementById('searchInput')?.value || '',
                categoria_id: document.getElementById('filterCategoria')?.value || '',
                marca_id: document.getElementById('filterMarca')?.value || '',
                activo: document.getElementById('filterEstado')?.value || '',
                page: this.currentPage,
                limit: this.limit
            };

            const response = await ProductosService.getProductos(filtros);

            this.productos = response.data || [];
            this.totalRecords = response.count || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.limit);

            this.renderProductos();
            this.renderPagination();

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando productos:', error);
            Alerts.error('Error al cargar los productos');
        }
    },

    /**
     * Renderizar tabla de productos
     */
    renderProductos() {
        const tbody = document.getElementById('productosTableBody');
        
        if (!tbody) return;

        if (this.productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <div class="empty-state">
                            <i class="bi bi-inbox"></i>
                            <h4>No hay productos</h4>
                            <p class="text-muted">No se encontraron productos con los filtros aplicados</p>
                            ${Permissions.canCreateProducts() ? 
                                '<button class="btn btn-primary" onclick="ProductosController.openCreateModal()">Crear Primer Producto</button>' 
                                : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.productos.map(producto => {
            return `
                <tr>
                    <td>
                        <div class="bg-light rounded d-flex align-items-center justify-content-center" 
                             style="width: 60px; height: 60px;">
                            <i class="bi bi-palette text-muted fs-4"></i>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${producto.codigo_sku || '-'}</span>
                    </td>
                    <td>
                        <div class="fw-semibold">${producto.descripcion || '-'}</div>
                        ${producto.color ? `<small class="text-muted">Color: ${producto.color}</small>` : ''}
                    </td>
                    <td>${producto.categoria?.nombre || '-'}</td>
                    <td>${producto.marca?.nombre || '-'}</td>
                    <td>
                        <span class="badge bg-info" title="Ver presentaciones">
                            <i class="bi bi-box"></i> ${producto.tamano || 'Variable'}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-secondary">-</span>
                    </td>
                    <td>
                        <span class="badge ${producto.activo ? 'bg-success' : 'bg-secondary'}">
                            ${producto.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" 
                                    class="btn btn-outline-primary" 
                                    onclick="ProductosController.viewDetalle(${producto.id})"
                                    title="Ver detalle">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${Permissions.canEditProducts() ? `
                                <button type="button" 
                                        class="btn btn-outline-warning" 
                                        onclick="ProductosController.openEditModal(${producto.id})"
                                        title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            ` : ''}
                            ${Permissions.canDeleteProducts() ? `
                                <button type="button" 
                                        class="btn btn-outline-danger" 
                                        onclick="ProductosController.deleteProducto(${producto.id})"
                                        title="Eliminar">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Actualizar info de paginación
        const start = (this.currentPage - 1) * this.limit + 1;
        const end = Math.min(this.currentPage * this.limit, this.totalRecords);
        
        document.getElementById('showingStart').textContent = start;
        document.getElementById('showingEnd').textContent = end;
        document.getElementById('totalRecords').textContent = this.totalRecords;
    },

    /**
     * Renderizar paginación
     */
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Botón anterior
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="ProductosController.changePage(${this.currentPage - 1}); return false;">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Páginas
        for (let i = 1; i <= this.totalPages; i++) {
            if (
                i === 1 || 
                i === this.totalPages || 
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="ProductosController.changePage(${i}); return false;">
                            ${i}
                        </a>
                    </li>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Botón siguiente
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="ProductosController.changePage(${this.currentPage + 1}); return false;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = html;
    },

    /**
     * Cambiar página
     */
    changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadProductos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Abrir modal para crear producto
     */
    openCreateModal() {
       /*  if (!Permissions.canCreateProducts()) {
            Permissions.showAccessDenied();
            return;
        }*/

        this.isEditMode = false;
        this.currentProductoId = null;
        this.presentacionesSeleccionadas = [];
        
        // Limpiar formulario
        this.resetForm();
        
        // Cambiar título
        document.getElementById('modalProductoTitleText').textContent = 'Nuevo Producto';
        
        // Mostrar modal
        this.modalProducto.show();
        
        // Ir al primer tab
        const firstTab = document.getElementById('tab-general-btn');
        if (firstTab) {
            const tab = new bootstrap.Tab(firstTab);
            tab.show();
        }
    },

    /**
     * Abrir modal para editar producto
     */
    async openEditModal(id) {
        /*if (!Permissions.canEditProducts()) {
            Permissions.showAccessDenied();
            return;
        }*/

        try {
            Loader.show('Cargando producto...');

            this.isEditMode = true;
            this.currentProductoId = id;

            // Obtener datos del producto
            const response = await ProductosService.getProductoById(id);
            const producto = response.data;

            // Obtener presentaciones del producto
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(id);
            this.presentacionesSeleccionadas = presentacionesRes.data || [];

            // Llenar formulario
            document.getElementById('producto_id').value = producto.id;
            document.getElementById('sku').value = producto.codigo_sku || '';
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('categoria_id').value = producto.categoria_id || '';
            document.getElementById('marca_id').value = producto.marca_id || '';
            document.getElementById('color').value = producto.color || '';
            document.getElementById('tamano').value = producto.tamano || '';
            document.getElementById('duracion_anios').value = producto.duracion_anios || '';
            document.getElementById('extension_m2').value = producto.extension_m2 || '';
            document.getElementById('estado').value = producto.activo ? 'ACTIVO' : 'INACTIVO';

            // Renderizar presentaciones
            this.renderPresentacionesTable();

            // Cambiar título
            document.getElementById('modalProductoTitleText').textContent = 'Editar Producto';

            Loader.hide();

            // Mostrar modal
            this.modalProducto.show();

        } catch (error) {
            Loader.hide();
            console.error('Error cargando producto:', error);
            Alerts.error('Error al cargar el producto');
        }
    },

    /**
     * Guardar producto (crear o editar)
     */
    async saveProducto() {
        try {
            // Validar formulario
            if (!this.validateForm()) {
                Alerts.warning('Por favor completa todos los campos obligatorios');
                return;
            }

            const btnGuardar = document.getElementById('btnGuardarProducto');
            Loader.showInButton(btnGuardar, 'Guardando...');

            // Obtener datos del formulario
            const formData = {
                codigo_sku: document.getElementById('sku').value.trim(),
                descripcion: document.getElementById('descripcion').value.trim(),
                categoria_id: parseInt(document.getElementById('categoria_id').value),
                marca_id: parseInt(document.getElementById('marca_id').value),
                color: document.getElementById('color').value.trim() || null,
                tamano: document.getElementById('tamano').value.trim() || null,
                duracion_anios: parseFloat(document.getElementById('duracion_anios').value) || null,
                extension_m2: parseFloat(document.getElementById('extension_m2').value) || null,
                activo: document.getElementById('estado').value === 'ACTIVO'
            };

            let productoId;

            if (this.isEditMode) {
                // ACTUALIZAR producto existente
                const response = await ProductosService.updateProducto(this.currentProductoId, formData);
                productoId = this.currentProductoId;
                Alerts.success('Producto actualizado exitosamente');
            } else {
                // CREAR nuevo producto
                const response = await ProductosService.createProducto(formData);
                productoId = response.data.id;

                // Si hay presentaciones seleccionadas, agregarlas
                if (this.presentacionesSeleccionadas.length > 0) {
                    const presentacionesIds = this.presentacionesSeleccionadas.map(p => p.presentacion_id);
                    await ProductosService.agregarPresentacionesAProducto(productoId, presentacionesIds);
                }

                Alerts.success('Producto creado exitosamente');
            }

            Loader.hideInButton(btnGuardar);

            // Cerrar modal
            this.modalProducto.hide();

            // Recargar lista
            await this.loadProductos();

        } catch (error) {
            const btnGuardar = document.getElementById('btnGuardarProducto');
            Loader.hideInButton(btnGuardar);
            console.error('Error guardando producto:', error);
            Alerts.error(error.message || 'Error al guardar el producto');
        }
    },

    /**
     * Validar formulario
     */
    validateForm() {
        let isValid = true;

        // Campos obligatorios
        const requiredFields = [
            { id: 'sku', name: 'Código SKU' },
            { id: 'descripcion', name: 'Descripción' },
            { id: 'categoria_id', name: 'Categoría' },
            { id: 'marca_id', name: 'Marca' }
        ];

        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const value = element.value.trim();
            
            Validator.clearError(element);
            
            if (!value) {
                Validator.showError(element, `${field.name} es obligatorio`);
                isValid = false;
            }
        });

        return isValid;
    },

    /**
     * Agregar presentación a la tabla
     */
    addPresentacion() {
        // Crear una fila temporal para seleccionar presentación
        const tbody = document.getElementById('presentacionesTableBody');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-select form-select-sm" id="temp-presentacion-select">
                    <option value="">Seleccionar...</option>
                    ${this.presentaciones.map(p => `
                        <option value="${p.id}">${p.nombre}</option>
                    `).join('')}
                </select>
            </td>
            <td colspan="4" class="text-end">
                <button type="button" class="btn btn-sm btn-success" onclick="ProductosController.confirmAddPresentacion()">
                    <i class="bi bi-check"></i> Agregar
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="this.closest('tr').remove()">
                    <i class="bi bi-x"></i> Cancelar
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Ocultar mensaje de "no hay presentaciones"
        const noPresentaciones = document.getElementById('noPresentaciones');
        if (noPresentaciones) {
            noPresentaciones.style.display = 'none';
        }
    },

    /**
     * Confirmar agregar presentación
     */
    confirmAddPresentacion() {
        const select = document.getElementById('temp-presentacion-select');
        const presentacionId = parseInt(select.value);
        
        if (!presentacionId) {
            Alerts.warning('Selecciona una presentación');
            return;
        }

        // Verificar que no esté duplicada
        if (this.presentacionesSeleccionadas.find(p => p.presentacion_id === presentacionId)) {
            Alerts.warning('Esta presentación ya fue agregada');
            return;
        }

        // Buscar la presentación
        const presentacion = this.presentaciones.find(p => p.id === presentacionId);
        
        // Agregar a la lista
        this.presentacionesSeleccionadas.push({
            presentacion_id: presentacionId,
            presentacion: presentacion
        });

        // Re-renderizar tabla
        this.renderPresentacionesTable();
    },

    /**
     * Renderizar tabla de presentaciones
     */
    renderPresentacionesTable() {
        const tbody = document.getElementById('presentacionesTableBody');
        const noPresentaciones = document.getElementById('noPresentaciones');
        
        if (!tbody) return;

        if (this.presentacionesSeleccionadas.length === 0) {
            tbody.innerHTML = '';
            if (noPresentaciones) {
                noPresentaciones.style.display = 'block';
            }
            return;
        }

        if (noPresentaciones) {
            noPresentaciones.style.display = 'none';
        }

        tbody.innerHTML = this.presentacionesSeleccionadas.map((item, index) => `
            <tr>
                <td>${item.presentacion?.nombre || item.Presentacion?.nombre || '-'}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td class="text-center">
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger" 
                            onclick="ProductosController.removePresentacion(${index})"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Eliminar presentación de la lista
     */
    removePresentacion(index) {
        this.presentacionesSeleccionadas.splice(index, 1);
        this.renderPresentacionesTable();
    },

    /**
     * Ver detalle del producto
     */
    async viewDetalle(id) {
        try {
            Loader.show('Cargando detalle...');

            // Obtener producto
            const response = await ProductosService.getProductoById(id);
            const producto = response.data;

            // Obtener presentaciones
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(id);
            const presentaciones = presentacionesRes.data || [];

            // Llenar modal de detalle
            document.getElementById('detalle_sku').textContent = producto.codigo_sku || '-';
            document.getElementById('detalle_descripcion').textContent = producto.descripcion || '-';
            document.getElementById('detalle_categoria').textContent = producto.categoria?.nombre || '-';
            document.getElementById('detalle_marca').textContent = producto.marca?.nombre || '-';
            document.getElementById('detalle_color').textContent = producto.color || '-';
            document.getElementById('detalle_estado').innerHTML = `
                <span class="badge ${producto.activo ? 'bg-success' : 'bg-secondary'}">
                    ${producto.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
            `;
            document.getElementById('detalle_duracion').textContent = producto.duracion_anios ? `${producto.duracion_anios} años` : '-';
            document.getElementById('detalle_extension').textContent = producto.extension_m2 ? `${producto.extension_m2} m²` : '-';

            // Renderizar presentaciones
            const tbodyPresentaciones = document.getElementById('detalle_presentaciones');
            if (tbodyPresentaciones) {
                if (presentaciones.length === 0) {
                    tbodyPresentaciones.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center text-muted">
                                No hay presentaciones agregadas
                            </td>
                        </tr>
                    `;
                } else {
                    tbodyPresentaciones.innerHTML = presentaciones.map(p => `
                        <tr>
                            <td>${p.presentacion?.nombre || p.Presentacion?.nombre || '-'}</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    `).join('');
                }
            }

            // Renderizar inventario (por ahora vacío)
            const tbodyInventario = document.getElementById('detalle_inventario');
            if (tbodyInventario) {
                tbodyInventario.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No hay información de inventario disponible
                        </td>
                    </tr>
                `;
            }

            // Guardar ID para el botón de editar
            this.currentProductoId = id;

            Loader.hide();

            // Mostrar modal
            this.modalDetalle.show();

        } catch (error) {
            Loader.hide();
            console.error('Error cargando detalle:', error);
            Alerts.error('Error al cargar el detalle del producto');
        }
    },

    /**
     * Abrir modal de edición desde el detalle
     */
    openEditModalFromDetail() {
        this.modalDetalle.hide();
        setTimeout(() => {
            this.openEditModal(this.currentProductoId);
        }, 300);
    },

    /**
     * Eliminar producto
     */
    async deleteProducto(id) {
        if (!Permissions.canDeleteProducts()) {
            Permissions.showAccessDenied();
            return;
        }

        Alerts.confirm(
            '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.',
            'Eliminar Producto',
            async () => {
                try {
                    Loader.show('Eliminando...');

                    await ProductosService.deleteProducto(id);

                    Loader.hide();
                    Alerts.success('Producto eliminado exitosamente');

                    // Recargar lista
                    await this.loadProductos();

                } catch (error) {
                    Loader.hide();
                    console.error('Error eliminando producto:', error);
                    Alerts.error(error.message || 'Error al eliminar el producto');
                }
            }
        );
    },

    /**
     * Resetear formulario
     */
    resetForm() {
        const form = document.getElementById('formProducto');
        if (form) {
            form.reset();
        }

        // Limpiar errores
        document.querySelectorAll('.is-invalid').forEach(el => {
            Validator.clearError(el);
        });

        // Limpiar presentaciones
        this.presentacionesSeleccionadas = [];
        this.renderPresentacionesTable();

        // Resetear estado
        this.isEditMode = false;
        this.currentProductoId = null;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ProductosController.init();
});