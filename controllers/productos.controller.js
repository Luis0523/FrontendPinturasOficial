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
    sucursalSeleccionada: null,
    selectedImageFile: null, // Archivo de imagen seleccionado
    currentImageUrl: null, // URL de imagen actual (para edición)


    /**
     * Inicializar controlador
     */
    async init() {
        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Verificar permisos
        if (!requirePermission(Permissions.canViewProducts)) {
            return; // El requirePermission ya redirige
        }

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

            const [productosRes, presentacionesRes, sucursalesRes] = await Promise.all([
                ProductosService.getProductos({ limit: 1000 }),
                PresentacionesService.getPresentaciones(),
                SucursalesService.getSucursales() // NUEVO
            ]);

            const productos = productosRes.data || [];
            this.presentaciones = presentacionesRes.data || [];
            this.sucursales = sucursalesRes.data || []; // NUEVO

            // Extraer categorías únicas
            this.categorias = [...new Map(
                productos
                    .filter(p => p.categoria)
                    .map(p => [p.categoria.id, p.categoria])
            ).values()];

            // Extraer marcas únicas
            this.marcas = [...new Map(
                productos
                    .filter(p => p.marca)
                    .map(p => [p.marca.id, p.marca])
            ).values()];

            // Obtener sucursal del usuario logueado
            const user = Storage.getUser();
            this.sucursalSeleccionada = user?.sucursal_id || null;

            // Llenar selects
            this.fillFilterSelects();
            //this.fillFormSelects();

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
        // Sucursales (NUEVO)
        const filterSucursal = document.getElementById('filterSucursal');
        if (filterSucursal) {
            filterSucursal.innerHTML = '<option value="">Todas las Sucursales</option>';
            this.sucursales.forEach(suc => {
                const selected = suc.id === this.sucursalSeleccionada ? 'selected' : '';
                filterSucursal.innerHTML += `<option value="${suc.id}" ${selected}>${suc.nombre}</option>`;
            });
        }

        // Categorías
       /* const filterCategoria = document.getElementById('filterCategoria');
        if (filterCategoria) {
            filterCategoria.innerHTML = '<option value="">Todas</option>';
            this.categorias.forEach(cat => {
                filterCategoria.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
            });
        }

        // Marcas
        const filterMarca = document.getElementById('filterMarca');
        if (filterMarca) {
            filterMarca.innerHTML = '<option value="">Todas</option>';
            this.marcas.forEach(marca => {
                filterMarca.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
            });
        }*/
    },

    /**
     * Llenar selects del formulario de crear/editar
     */
    fillFormSelects() {
        // Categorías
        const categoriaSelect = document.getElementById('categoria_id');
        if (categoriaSelect) {
            categoriaSelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.categorias.forEach(cat => {
                categoriaSelect.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
            });
        }

        // Marcas
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
        ['filterSucursal', 'filterCategoria', 'filterMarca', 'filterEstado'].forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.loadProductos();
                });
            }
        });

        // ... resto del código ...
    },

    /**
     * Cargar productos con filtros
     */
    async loadProductos() {
        try {
            Loader.show('Cargando productos...');

            const filtros = {
                buscar: document.getElementById('searchInput')?.value || '',
                sucursal_id: document.getElementById('filterSucursal')?.value || '', // NUEVO
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
                            <i class="bi bi-inbox display-1 text-muted"></i>
                            <h4 class="mt-3">No hay productos</h4>
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
            // Calcular stock total o por sucursal
            const stockInfo = this.getStockInfo(producto);
            
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
                        <span class="badge bg-info" title="Presentaciones disponibles">
                            <i class="bi bi-box"></i> ${producto.tamano || 'Variable'}
                        </span>
                    </td>
                    <td class="text-center">
                        ${stockInfo}
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
     * Obtener información de stock (NUEVO)
     */
    getStockInfo(producto) {
        // Si hay inventario en el producto
        if (producto.inventario && Array.isArray(producto.inventario) && producto.inventario.length > 0) {
            const sucursalId = document.getElementById('filterSucursal')?.value;
            
            if (sucursalId) {
                // Mostrar stock de la sucursal seleccionada
                const inv = producto.inventario.find(i => i.sucursal_id == sucursalId);
                if (inv) {
                    return this.getStockBadge(inv.existencia, inv.stock_minimo);
                }
                return '<span class="badge bg-secondary">Sin stock</span>';
            } else {
                // Mostrar stock total de todas las sucursales
                const totalStock = producto.inventario.reduce((sum, inv) => sum + (inv.existencia || 0), 0);
                return `<span class="badge bg-info">${totalStock} unidades</span>`;
            }
        }
        
        return '<span class="badge bg-secondary">-</span>';
    },

    /**
     * Obtener badge de stock con colores según nivel (NUEVO)
     */
    getStockBadge(existencia, stockMinimo) {
        const stock = existencia || 0;
        const minimo = stockMinimo || 0;
        
        if (stock === 0) {
            return '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle"></i> Sin stock</span>';
        } else if (stock < minimo * 0.5) {
            return `<span class="badge bg-danger"><i class="bi bi-exclamation-circle"></i> ${stock} (Crítico)</span>`;
        } else if (stock < minimo) {
            return `<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle"></i> ${stock} (Bajo)</span>`;
        } else {
            return `<span class="badge bg-success">${stock} unidades</span>`;
        }
    },

    /**
     * Ver detalle del producto (MODIFICADO)
     */
    async viewDetalle(id) {
        try {
            Loader.show('Cargando detalle...');

            // Obtener producto con inventario
            const response = await ProductosService.getProductoById(id);
            const producto = response.data;

            // Obtener inventario por sucursal
            const inventarioRes = await ProductosService.getInventarioProducto(id);
            const inventario = inventarioRes.data || [];

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

            // Agrupar inventario por presentación para la primera tabla
            const inventarioPorPresentacion = this.agruparInventarioPorPresentacion(inventario, presentaciones);

            // Renderizar tabla de presentaciones con resumen de inventario
            const tbodyPresentaciones = document.getElementById('detalle_presentaciones');
            if (tbodyPresentaciones) {
                if (inventarioPorPresentacion.length === 0) {
                    tbodyPresentaciones.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center text-muted py-3">
                                <i class="bi bi-inbox"></i> No hay presentaciones con inventario
                            </td>
                        </tr>
                    `;
                } else {
                    tbodyPresentaciones.innerHTML = inventarioPorPresentacion.map(item => {
                        const precioVenta = item.precio_venta ? `$${parseFloat(item.precio_venta).toFixed(2)}` : '-';
                        const stockTotal = item.stock_total || 0;
                        const stockMinimo = item.stock_minimo_total || 0;

                        return `
                            <tr>
                                <td><strong>${item.nombre_presentacion}</strong></td>
                                <td class="text-center">${precioVenta}</td>
                                <td class="text-center">
                                    ${this.getStockBadge(stockTotal, stockMinimo)}
                                </td>
                                <td class="text-center">
                                    <span class="badge ${item.estado === 'OK' ? 'bg-success' : item.estado === 'BAJO' ? 'bg-warning text-dark' : 'bg-danger'}">
                                        ${item.estado}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Renderizar inventario por sucursal (TABLA DETALLADA)
            const tbodyInventario = document.getElementById('detalle_inventario');
            if (tbodyInventario) {
                if (inventario.length === 0) {
                    tbodyInventario.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center text-muted py-3">
                                <i class="bi bi-inbox"></i> No hay información de inventario disponible
                            </td>
                        </tr>
                    `;
                } else {
                    tbodyInventario.innerHTML = inventario.map(inv => `
                        <tr>
                            <td>
                                <i class="bi bi-building"></i>
                                <strong>${inv.sucursal?.nombre || '-'}</strong>
                            </td>
                            <td>${inv.productoPresentacion?.presentacion?.nombre || '-'}</td>
                            <td class="text-center">
                                ${this.getStockBadge(inv.existencia, inv.stock_minimo)}
                            </td>
                            <td class="text-center">
                                <span class="badge bg-secondary">${inv.stock_minimo || 0}</span>
                            </td>
                            <td class="text-center">
                                <span class="badge bg-secondary">${inv.stock_maximo || 0}</span>
                            </td>
                            <td class="text-center">
                                <span class="badge ${inv.estado === 'OK' ? 'bg-success' : inv.estado === 'BAJO' ? 'bg-warning text-dark' : 'bg-danger'}">
                                    ${inv.estado}
                                </span>
                            </td>
                        </tr>
                    `).join('');
                }
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
     * Agrupar inventario por presentación para la tabla de resumen
     */
    agruparInventarioPorPresentacion(inventario, presentaciones) {
        const agrupado = {};

        // Procesar inventario
        inventario.forEach(inv => {
            const presentacionId = inv.productoPresentacion?.presentacion_id;
            const nombrePresentacion = inv.productoPresentacion?.presentacion?.nombre || 'Sin nombre';

            if (!agrupado[presentacionId]) {
                agrupado[presentacionId] = {
                    nombre_presentacion: nombrePresentacion,
                    stock_total: 0,
                    stock_minimo_total: 0,
                    precio_venta: null,
                    estado: 'OK'
                };
            }

            agrupado[presentacionId].stock_total += inv.existencia || 0;
            agrupado[presentacionId].stock_minimo_total += inv.stock_minimo || 0;

            // Tomar el primer precio encontrado (se puede mejorar para promedios)
            if (!agrupado[presentacionId].precio_venta && inv.productoPresentacion?.precios?.length > 0) {
                agrupado[presentacionId].precio_venta = inv.productoPresentacion.precios[0].precio_venta;
            }
        });

        // Calcular estado general por presentación
        Object.keys(agrupado).forEach(key => {
            const item = agrupado[key];
            if (item.stock_total === 0) {
                item.estado = 'AGOTADO';
            } else if (item.stock_total < item.stock_minimo_total) {
                item.estado = 'BAJO';
            } else {
                item.estado = 'OK';
            }
        });

        return Object.values(agrupado);
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

        // Llenar selects
        this.fillFormSelects();

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

            // Llenar selects
            this.fillFormSelects();

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

            // Cargar imagen existente
            if (producto.imagen_url) {
                this.currentImageUrl = producto.imagen_url;
                const previewImg = document.getElementById('imagenPreviewImg');
                const previewContainer = document.getElementById('imagenPreview');
                previewImg.src = producto.imagen_url;
                previewContainer.style.display = 'block';
            }

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

                // Actualizar presentaciones si hay seleccionadas
                if (this.presentacionesSeleccionadas.length > 0) {
                    const presentacionesIds = this.presentacionesSeleccionadas.map(p => p.presentacion_id);
                    console.log('Guardando presentaciones en modo EDICIÓN:', presentacionesIds);
                    await ProductosService.agregarPresentacionesAProducto(productoId, presentacionesIds);
                }

                Alerts.success('Producto actualizado exitosamente');
            } else {
                // CREAR nuevo producto
                const response = await ProductosService.createProducto(formData);
                productoId = response.data.id;

                // Si hay presentaciones seleccionadas, agregarlas
                if (this.presentacionesSeleccionadas.length > 0) {
                    const presentacionesIds = this.presentacionesSeleccionadas.map(p => p.presentacion_id);
                    console.log('Guardando presentaciones en modo CREACIÓN:', presentacionesIds);
                    console.log('presentacionesSeleccionadas:', this.presentacionesSeleccionadas);
                    await ProductosService.agregarPresentacionesAProducto(productoId, presentacionesIds);
                }

                Alerts.success('Producto creado exitosamente');
            }

            // Si hay una imagen seleccionada, subirla
            if (this.selectedImageFile) {
                try {
                    await ProductosService.uploadImagenProducto(productoId, this.selectedImageFile);
                } catch (error) {
                    console.error('Error subiendo imagen:', error);
                    Alerts.warning('Producto guardado, pero hubo un error al subir la imagen');
                }
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

        console.log('Presentación agregada:', { presentacion_id: presentacionId, presentacion });
        console.log('Lista actualizada:', this.presentacionesSeleccionadas);

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

        tbody.innerHTML = this.presentacionesSeleccionadas.map((item, index) => {
            console.log('Presentación seleccionada:', item);
            return `
            <tr>
                <td>${item.presentacion?.nombre || item.Presentacion?.nombre || '-'}</td>
                <td>-</td>
                <td>-</td>
            </tr>`;
        }).join('');
    },

    /**
     * Eliminar presentación de la lista
     */
    removePresentacion(index) {
        this.presentacionesSeleccionadas.splice(index, 1);
        this.renderPresentacionesTable();
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
    /**
     * Manejar cambio de imagen
     */
    handleImageChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            Alerts.warning('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
            event.target.value = '';
            return;
        }

        // Validar tamaño (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            Alerts.warning('El archivo es demasiado grande. Tamaño máximo: 5MB');
            event.target.value = '';
            return;
        }

        // Guardar archivo seleccionado
        this.selectedImageFile = file;

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('imagenPreviewImg');
            const previewContainer = document.getElementById('imagenPreview');

            previewImg.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    },

    /**
     * Eliminar imagen seleccionada
     */
    removeImage() {
        this.selectedImageFile = null;
        document.getElementById('imagenProducto').value = '';
        document.getElementById('imagenPreview').style.display = 'none';
        document.getElementById('imagenPreviewImg').src = '';
    },

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

        // Limpiar imagen
        this.removeImage();
        this.currentImageUrl = null;

        // Resetear estado
        this.isEditMode = false;
        this.currentProductoId = null;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ProductosController.init();
});
