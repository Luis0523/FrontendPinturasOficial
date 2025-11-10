/**
 * Controlador de Catálogo de Productos
 * Gestión administrativa de productos (sin inventario)
 */

const CatalogoController = {
    // Estado del controlador
    sucursales: [],
    productos: [],
    categorias: [],
    marcas: [],
    presentaciones: [],
    presentacionesProducto: [],
    preciosPorPresentacion: {},
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
    currentProductoId: null,
    sucursalActual: null,
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

        // Cargar layout
        await loadLayout();

        // Cargar modals
        await this.loadModals();

        this.modalPrecio = new bootstrap.Modal(document.getElementById('modalPrecio'));

        // Inicializar modals de Bootstrap
        this.modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
        this.modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleProducto'));

        // Obtener sucursal del usuario
        const user = Storage.getUser();
        this.sucursalActual = user?.sucursal_id || null;

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
            //<div id="modal-precio-container"></div>
            loadComponent('modal-precio-container', '/components/modals/modal-precio.html'),
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

            const [categoriasRes, marcasRes, presentacionesRes, sucursalesRes] = await Promise.all([
                CategoriasService.getCategorias(),
                MarcasService.getMarcas(),
                PresentacionesService.getPresentaciones(),
                SucursalesService.getSucursales() // AGREGAR ESTO
            ]);

            this.categorias = categoriasRes.data || [];
            this.marcas = marcasRes.data || [];
            this.presentaciones = presentacionesRes.data || [];
            this.sucursales = sucursalesRes.data || []; // AGREGAR ESTOP
            console.log(this.sucursales);

            // Llenar selects
            this.fillFilterSelects();
            this.fillFormSelects();
            this.fillSucursalSelectModal();

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando datos iniciales:', error);
            Alerts.error('Error al cargar datos iniciales');
        }
    },

    fillSucursalSelectModal() {
        const select = document.getElementById('sucursalPreciosModal');
        if (!select) return;

        select.innerHTML = '<option value="">Todas las sucursales</option>';

        this.sucursales.forEach(suc => {
            const selected = suc.id === this.sucursalActual ? 'selected' : '';
            select.innerHTML += `<option value="${suc.id}" ${selected}>${suc.nombre}</option>`;
        });

        select.addEventListener('change', async (e) => {
            const sucursalId = e.target.value;
            const sucursalNombre = e.target.options[e.target.selectedIndex].text;

            this.sucursalSeleccionadaParaPrecios = sucursalId;
            this.sucursalActual = sucursalId;

            // Mostrar alert con estilo
            if (sucursalId) {
                Alerts.success(`Sucursal actualizada: ${sucursalNombre}. Mostrando productos disponibles en esta sucursal.`);
            } else {
                Alerts.info('Mostrando productos de todas las sucursales.');
            }

            // Recargar productos con el nuevo filtro de sucursal
            this.currentPage = 1;
            await this.loadProductos();
        });

        // Si hay sucursal del usuario, establecerla como seleccionada
        if (this.sucursalActual) {
            select.value = this.sucursalActual;
            this.sucursalSeleccionadaParaPrecios = this.sucursalActual;
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

            const filtros = this.getFiltersFromForm();

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
     * Obtener filtros del formulario
     */
    getFiltersFromForm() {
        const estadoValue = document.getElementById('filterEstado')?.value;

        const filtros = {
            buscar: document.getElementById('searchInput')?.value || '',
            categoria_id: document.getElementById('filterCategoria')?.value || '',
            marca_id: document.getElementById('filterMarca')?.value || '',
            // Si estadoValue es string vacío '', NO enviar el filtro (mostrar todos)
            // Si es 'true' o 'false', enviar el filtro
            activo: estadoValue !== '' ? estadoValue : undefined,
            page: this.currentPage,
            limit: this.limit
        };

        // Eliminar undefined del objeto
        if (filtros.activo === undefined) {
            delete filtros.activo;
        }

        // Agregar filtro de sucursal si está seleccionada
        if (this.sucursalActual) {
            filtros.sucursal_id = this.sucursalActual;
        }

        return filtros;
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
                            <button class="btn btn-primary" onclick="CatalogoController.openCreateModal()">
                                <i class="bi bi-plus-circle me-2"></i>Crear Primer Producto
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.productos.map(producto => {
            // Contar presentaciones activas
            const numPresentaciones = producto.presentaciones?.length || 0;

            // Estilo para productos inactivos
            const rowClass = producto.activo ? '' : 'table-secondary opacity-75';

            return `
                <tr class="${rowClass}">
                    <td>
                        <div class="bg-light rounded d-flex align-items-center justify-content-center"
                             style="width: 60px; height: 60px; ${!producto.activo ? 'opacity: 0.5;' : ''}">
                            <i class="bi bi-palette ${producto.activo ? 'text-muted' : 'text-secondary'} fs-4"></i>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${producto.activo ? 'bg-secondary' : 'bg-dark'}">${producto.codigo_sku || '-'}</span>
                        ${!producto.activo ? '<br><small class="badge bg-warning text-dark mt-1">DESACTIVADO</small>' : ''}
                    </td>
                    <td>
                        <div class="fw-semibold ${!producto.activo ? 'text-decoration-line-through' : ''}">${producto.descripcion || '-'}</div>
                        ${producto.tamano ? `<small class="text-muted">Tamaño: ${producto.tamano}</small>` : ''}
                    </td>
                    <td>${producto.categoria?.nombre || '-'}</td>
                    <td>${producto.marca?.nombre || '-'}</td>
                    <td>
                        ${producto.color ? `
                            <span class="badge bg-light text-dark border">
                                ${producto.color}
                            </span>
                        ` : '-'}
                    </td>
                    <td class="text-center">
                        <span class="badge ${numPresentaciones > 0 ? (producto.activo ? 'bg-info' : 'bg-secondary') : 'bg-secondary'}"
                              title="${numPresentaciones} presentación(es) configurada(s)">
                            <i class="bi bi-box"></i> ${numPresentaciones}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${producto.activo ? 'bg-success' : 'bg-warning text-dark'}">
                            ${producto.activo ? '✓ ACTIVO' : '✗ INACTIVO'}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button"
                                    class="btn btn-outline-primary"
                                    onclick="CatalogoController.viewDetalle(${producto.id})"
                                    title="Ver detalle">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${producto.activo ? `
                                <button type="button"
                                        class="btn btn-outline-warning"
                                        onclick="CatalogoController.openEditModal(${producto.id})"
                                        title="Editar">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button type="button"
                                        class="btn btn-outline-danger"
                                        onclick="CatalogoController.deleteProducto(${producto.id})"
                                        title="Desactivar">
                                    <i class="bi bi-toggle-off"></i>
                                </button>
                            ` : `
                                <button type="button"
                                        class="btn btn-success"
                                        onclick="CatalogoController.reactivarProducto(${producto.id})"
                                        title="Reactivar producto">
                                    <i class="bi bi-arrow-repeat me-1"></i>Reactivar
                                </button>
                            `}
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
                <a class="page-link" href="#" onclick="CatalogoController.changePage(${this.currentPage - 1}); return false;">
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
                        <a class="page-link" href="#" onclick="CatalogoController.changePage(${i}); return false;">
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
                <a class="page-link" href="#" onclick="CatalogoController.changePage(${this.currentPage + 1}); return false;">
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
        this.isEditMode = false;
        this.currentProductoId = null;
        this.presentacionesProducto = [];

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
    /**
 * Abrir modal para editar producto
 */
    async openEditModal(id) {
        try {
            Loader.show('Cargando producto...');

            this.isEditMode = true;
            this.currentProductoId = id;

            // Obtener datos del producto
            const response = await ProductosService.getProductoById(id);
            const producto = response.data;

            // Obtener presentaciones del producto (NUEVO)
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(id);
            this.presentacionesProducto = presentacionesRes.data || [];

            // Llenar formulario - Información General
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

            // Renderizar presentaciones en el modal de edición (NUEVO)
            this.renderPresentacionesEnModalEdicion();

            // Cambiar título
            document.getElementById('modalProductoTitleText').textContent = 'Editar Producto';

            Loader.hide();

            // Mostrar modal
            this.modalProducto.show();

            // Ir al primer tab
            const firstTab = document.getElementById('tab-general-btn');
            if (firstTab) {
                const tab = new bootstrap.Tab(firstTab);
                tab.show();
            }

        } catch (error) {
            Loader.hide();
            console.error('Error cargando producto:', error);
            Alerts.error('Error al cargar el producto');
        }
    },
    /**
 * Renderizar presentaciones en el modal de EDICIÓN
 */
    /**
 * Renderizar presentaciones en el modal de EDICIÓN
 */
    async renderPresentacionesEnModalEdicion() {
        const tbody = document.getElementById('presentacionesTableBody');
        const noPresentaciones = document.getElementById('noPresentacionesEdicion');

        if (!tbody) {
            console.warn('No se encontró el tbody con id="presentacionesTableBody"');
            return;
        }

        if (this.presentacionesProducto.length === 0) {
            tbody.innerHTML = '';
            if (noPresentaciones) {
                noPresentaciones.style.display = 'block';
            }
            return;
        }

        if (noPresentaciones) {
            noPresentaciones.style.display = 'none';
        }

        // Cargar precios para cada presentación
        const sucursalId = this.sucursalActual; // Sucursal del usuario logueado
        console.log(sucursalId);

        // Renderizar con loading
        tbody.innerHTML = this.presentacionesProducto.map(pp => `
        <tr data-pp-id="${pp.id}">
            <td>${pp.presentacion?.nombre || pp.Presentacion?.nombre || '-'}</td>
            
            <td class="text-center precio-venta-${pp.id}">
                <span class="spinner-border spinner-border-sm" role="status"></span>
            </td>
            <td class="text-center stock-minimo-${pp.id}">
                <span class="spinner-border spinner-border-sm" role="status"></span>
            </td>
            <td class="text-center">
                <span class="badge ${pp.activo ? 'bg-success' : 'bg-secondary'}">
                    ${pp.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="text-center acciones-${pp.id}">
                <span class="spinner-border spinner-border-sm" role="status"></span>
            </td>
        </tr>
    `).join('');

        // Cargar precios de forma asíncrona
        for (const pp of this.presentacionesProducto) {
            if (!pp.activo) {
                // Si está inactivo, mostrar botón de reactivar
                //document.querySelector(`.precio-base-${pp.id}`).innerHTML = '-';
                document.querySelector(`.precio-venta-${pp.id}`).innerHTML = '-';
                document.querySelector(`.stock-minimo-${pp.id}`).innerHTML = '-';
                document.querySelector(`.acciones-${pp.id}`).innerHTML = `
                <button type="button" 
                        class="btn btn-sm btn-outline-success" 
                        onclick="CatalogoController.reactivarPresentacionDesdeEdicion(${pp.id})"
                        title="Reactivar">
                    <i class="bi bi-check-circle"></i> Reactivar
                </button>
            `;
                continue;
            }

            try {
                // Obtener precio vigente
                const precioRes = await PreciosService.getPrecioVigente(pp.id, sucursalId);
                const precio = precioRes.data;
                console.warn(`DATOS DE: ${pp.id}`,precio);

                // Mostrar precios
                /*document.querySelector(`.precio-base-${pp.id}`).innerHTML =
                    precio ? Formatter.formatCurrency(precio.precio_compra || 0) :
                        '<span class="text-muted">-</span>';*/

                document.querySelector(`.precio-venta-${pp.id}`).innerHTML =
                    precio ? Formatter.formatCurrency(precio.precio_venta) :
                        '<span class="text-muted">-</span>';

                document.querySelector(`.stock-minimo-${pp.id}`).innerHTML =
                    precio ? (precio.stock_minimo || '-') :
                        '<span class="text-muted">-</span>';

                // Botones de acción
                if (precio) {
                    // Ya tiene precio → botón editar
                    document.querySelector(`.acciones-${pp.id}`).innerHTML = `
                    <button type="button" 
                            class="btn btn-sm btn-outline-primary" 
                            onclick="CatalogoController.editarPrecioDesdeEdicion(${precio.id}, ${pp.id})"
                            title="Editar precio">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger" 
                            onclick="CatalogoController.desactivarPresentacionDesdeEdicion(${pp.id})"
                            title="Desactivar presentación">
                        <i class="bi bi-x-circle"></i>
                    </button>
                `;
                } else {
                    // No tiene precio → botón crear
                    document.querySelector(`.acciones-${pp.id}`).innerHTML = `
                    <button type="button" 
                            class="btn btn-sm btn-outline-success" 
                            onclick="CatalogoController.crearPrecioDesdeEdicion(${pp.id})"
                            title="Agregar precio">
                        <i class="bi bi-plus-circle"></i> Precio
                    </button>
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger" 
                            onclick="CatalogoController.desactivarPresentacionDesdeEdicion(${pp.id})"
                            title="Desactivar presentación">
                        <i class="bi bi-x-circle"></i>
                    </button>
                `;
                }

            } catch (error) {
                console.error(`Error cargando precio para presentación ${pp.id}:`, error);

                // En caso de error, mostrar sin precio
                //document.querySelector(`.precio-base-${pp.id}`).innerHTML = '<span class="text-muted">-</span>';
                document.querySelector(`.precio-venta-${pp.id}`).innerHTML = '<span class="text-muted">-</span>';
                document.querySelector(`.stock-minimo-${pp.id}`).innerHTML = '<span class="text-muted">-</span>';
                document.querySelector(`.acciones-${pp.id}`).innerHTML = `
                <button type="button" 
                        class="btn btn-sm btn-outline-success" 
                        onclick="CatalogoController.crearPrecioDesdeEdicion(${pp.id})"
                        title="Agregar precio">
                    <i class="bi bi-plus-circle"></i> Precio
                </button>
                <button type="button" 
                        class="btn btn-sm btn-outline-danger" 
                        onclick="CatalogoController.desactivarPresentacionDesdeEdicion(${pp.id})"
                        title="Desactivar">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
            }
        }
    },
    /**
 * Crear precio para una presentación (desde modal de edición)
 */


    // Función para abrir modal
    crearPrecioDesdeEdicion(productoPresentacionId) {
        const sucursalId = this.sucursalSeleccionadaParaPrecios;

        if (!sucursalId) {
            Alerts.warning('Por favor selecciona una sucursal primero');
            return;
        }

        // Limpiar formulario
        document.getElementById('formPrecio').reset();
        document.getElementById('precio_id').value = '';
        document.getElementById('precio_producto_presentacion_id').value = productoPresentacionId;
        document.getElementById('precio_sucursal_id').value = sucursalId;

        // Cambiar título
        document.getElementById('modalPrecioTitle').textContent = 'Crear Precio';

        // Mostrar modal
        this.modalPrecio.show();
    },

    // Función para guardar
    async guardarPrecio() {
        const precioId = document.getElementById('precio_id').value;
        const productoPresentacionId = document.getElementById('precio_producto_presentacion_id').value;
        const sucursalId = document.getElementById('precio_sucursal_id').value;
        const precioCompra = parseFloat(document.getElementById('precio_compra').value) || 0;
        const precioVenta = parseFloat(document.getElementById('precio_venta').value);
        const descuento = parseFloat(document.getElementById('precio_descuento').value) || 0;
        const stockMinimo = parseInt(document.getElementById('precio_stock_minimo').value) || 0;

        if (!precioVenta || precioVenta <= 0) {
            Alerts.warning('El precio de venta es obligatorio');
            return;
        }

        try {
            const btnGuardar = document.getElementById('btnGuardarPrecio');
            Loader.showInButton(btnGuardar, 'Guardando...');

            const precioData = {
                producto_presentacion_id: parseInt(productoPresentacionId),
                sucursal_id: parseInt(sucursalId),
                precio_compra: precioCompra,
                precio_venta: precioVenta,
                descuento_pct: descuento,
                stock_minimo: stockMinimo
            };

            if (precioId) {
                await PreciosService.updatePrecio(precioId, precioData);
                Alerts.success('Precio actualizado exitosamente');
            } else {
                await PreciosService.createPrecio(precioData);
                Alerts.success('Precio creado exitosamente');
            }

            Loader.hideInButton(btnGuardar);
            this.modalPrecio.hide();

            await this.renderPresentacionesEnModalEdicion();

        } catch (error) {
            const btnGuardar = document.getElementById('btnGuardarPrecio');
            Loader.hideInButton(btnGuardar);
            console.error('Error guardando precio:', error);
            Alerts.error(error.message || 'Error al guardar el precio');
        }
    },



    /**
 * Editar precio existente (desde modal de edición)
 */
    async editarPrecioDesdeEdicion(precioId, productoPresentacionId) {
        try {
            Loader.show('Cargando precio...');

            // Obtener precio actual
            const response = await PreciosService.getPrecioById(precioId);
            const precioActual = response.data;

            Loader.hide();

            Swal.fire({
                title: 'Editar Precio',
                html: `
                <div class="text-start">
                    <div class="mb-3">
                        <label class="form-label">Precio de Compra (Q)</label>
                        <input type="number" id="swal-precio-compra" class="form-control" 
                               placeholder="0.00" step="0.01" min="0" 
                               value="${precioActual.precio_compra || 0}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Precio de Venta (Q) *</label>
                        <input type="number" id="swal-precio-venta" class="form-control" 
                               placeholder="0.00" step="0.01" min="0" required
                               value="${precioActual.precio_venta}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Descuento (%)</label>
                        <input type="number" id="swal-descuento" class="form-control" 
                               placeholder="0" step="0.01" min="0" max="100" 
                               value="${precioActual.descuento_pct || 0}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Stock Mínimo</label>
                        <input type="number" id="swal-stock-minimo" class="form-control" 
                               placeholder="0" step="1" min="0" 
                               value="${precioActual.stock_minimo || 0}">
                    </div>
                </div>
            `,
                showCancelButton: true,
                confirmButtonText: 'Actualizar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#0d6efd',
                cancelButtonColor: '#6c757d',
                focusConfirm: false,
                preConfirm: () => {
                    const precioCompra = document.getElementById('swal-precio-compra').value;
                    const precioVenta = document.getElementById('swal-precio-venta').value;
                    const descuento = document.getElementById('swal-descuento').value;
                    const stockMinimo = document.getElementById('swal-stock-minimo').value;

                    if (!precioVenta) {
                        Swal.showValidationMessage('El precio de venta es obligatorio');
                        return false;
                    }

                    return {
                        precio_compra: parseFloat(precioCompra) || 0,
                        precio_venta: parseFloat(precioVenta),
                        descuento_pct: parseFloat(descuento) || 0,
                        stock_minimo: parseInt(stockMinimo) || 0
                    };
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        Loader.show('Actualizando precio...');

                        await PreciosService.updatePrecio(precioId, result.value);

                        Swal.fire({
                            icon: 'success',
                            title: '¡Éxito!',
                            text: 'Precio actualizado exitosamente',
                            timer: 2000,
                            showConfirmButton: false
                        });

                        // Re-renderizar presentaciones
                        await this.renderPresentacionesEnModalEdicion();

                        Loader.hide();

                    } catch (error) {
                        Loader.hide();
                        console.error('Error actualizando precio:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: error.message || 'Error al actualizar el precio'
                        });
                    }
                }
            });

        } catch (error) {
            Loader.hide();
            console.error('Error cargando precio:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar el precio'
            });
        }
    },
    /**
 * Agregar presentación desde el modal de edición
 */
    addPresentacion() {
        if (!this.currentProductoId) {
            Alerts.warning('Debes guardar el producto primero antes de agregar presentaciones');
            return;
        }

        // Filtrar presentaciones que ya están agregadas
        const presentacionesDisponibles = this.presentaciones.filter(p => {
            return !this.presentacionesProducto.find(pp =>
                (pp.presentacion_id || pp.presentacion?.id) === p.id
            );
        });

        if (presentacionesDisponibles.length === 0) {
            Alerts.info('Todas las presentaciones ya están agregadas a este producto');
            return;
        }

        Alerts.select(
            'Selecciona una presentación para agregar',
            'Agregar Presentación',
            presentacionesDisponibles.map(p => ({
                value: p.id,
                text: p.nombre
            })),
            async (presentacionId) => {
                if (!presentacionId) return;

                try {
                    Loader.show('Agregando presentación...');

                    await ProductosService.agregarPresentacionesAProducto(
                        this.currentProductoId,
                        [presentacionId]
                    );

                    Alerts.success('Presentación agregada exitosamente');

                    // Recargar presentaciones
                    const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
                    this.presentacionesProducto = presentacionesRes.data || [];

                    // Re-renderizar
                    this.renderPresentacionesEnModalEdicion();

                    Loader.hide();

                } catch (error) {
                    Loader.hide();
                    console.error('Error agregando presentación:', error);
                    Alerts.error(error.message || 'Error al agregar presentación');
                }
            }
        );
    },

    /**
     * Desactivar presentación desde el modal de edición
     */
    async desactivarPresentacionDesdeEdicion(productoPresentacionId) {
        Alerts.confirm(
            '¿Desactivar esta presentación? No se podrá vender hasta que la reactives.',
            'Desactivar',
            async () => {
                try {
                    Loader.show('Desactivando...');

                    await ProductosService.desactivarProductoPresentacion(productoPresentacionId);

                    Alerts.success('Presentación desactivada');

                    // Recargar presentaciones
                    const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
                    this.presentacionesProducto = presentacionesRes.data || [];

                    // Re-renderizar
                    this.renderPresentacionesEnModalEdicion();

                    Loader.hide();

                } catch (error) {
                    Loader.hide();
                    console.error('Error desactivando presentación:', error);
                    Alerts.error(error.message || 'Error al desactivar');
                }
            }
        );
    },

    /**
     * Reactivar presentación desde el modal de edición
     */
    async reactivarPresentacionDesdeEdicion(productoPresentacionId) {
        try {
            Loader.show('Reactivando...');

            await ProductosService.reactivarProductoPresentacion(productoPresentacionId);

            Alerts.success('Presentación reactivada');

            // Recargar presentaciones
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
            this.presentacionesProducto = presentacionesRes.data || [];

            // Re-renderizar
            this.renderPresentacionesEnModalEdicion();

            Loader.hide();

        } catch (error) {
            Loader.hide();
            console.error('Error reactivando presentación:', error);
            Alerts.error(error.message || 'Error al reactivar');
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

            if (this.isEditMode) {
                // ACTUALIZAR producto existente
                await ProductosService.updateProducto(this.currentProductoId, formData);
                Alerts.success('Producto actualizado exitosamente');
            } else {
                // CREAR nuevo producto
                await ProductosService.createProducto(formData);
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
     * Ver detalle del producto
     */
    async viewDetalle(id) {
        try {
            Loader.show('Cargando detalle...');

            this.currentProductoId = id;

            // Obtener producto
            const response = await ProductosService.getProductoById(id);
            const producto = response.data;

            // Obtener presentaciones del producto
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(id);
            this.presentacionesProducto = presentacionesRes.data || [];

            // Llenar información general
            this.fillDetalleGeneral(producto);

            // Renderizar presentaciones
            await this.renderDetallePresentaciones();

            // Cargar precios inicialmente
            await this.loadPreciosDetalle();

            // Cargar inventario por sucursal
            await this.renderDetalleInventario();

            Loader.hide();

            // Mostrar modal
            this.modalDetalle.show();

            // Ir al primer tab
            const firstTab = document.getElementById('detalle-tab-general-btn');
            if (firstTab) {
                const tab = new bootstrap.Tab(firstTab);
                tab.show();
            }

        } catch (error) {
            Loader.hide();
            console.error('Error cargando detalle:', error);
            Alerts.error('Error al cargar el detalle del producto');
        }
    },

    /**
     * Llenar información general del detalle
     */
    fillDetalleGeneral(producto) {
        console.log(producto);
        document.getElementById('detalle_sku').textContent = producto.codigo_sku || '-';
        document.getElementById('detalle_descripcion').textContent = producto.descripcion || '-';
        document.getElementById('detalle_categoria').textContent = producto.categoria?.nombre || '-';
        document.getElementById('detalle_marca').textContent = producto.marca?.nombre || '-';
        document.getElementById('detalle_color').textContent = producto.color || '-';
        //document.getElementById('detalle_tamano').textContent = producto.tamano || '-';
        document.getElementById('detalle_estado').innerHTML = `
            <span class="badge ${producto.activo ? 'bg-success' : 'bg-secondary'}">
                ${producto.activo ? 'ACTIVO' : 'INACTIVO'}
            </span>
        `;
        document.getElementById('detalle_duracion').textContent = producto.duracion_anios ? `${producto.duracion_anios} años` : '-';
        document.getElementById('detalle_extension').textContent = producto.extension_m2 ? `${producto.extension_m2} m²` : '-';
    },

    /**
     * Renderizar presentaciones en el detalle
     */
    async renderDetallePresentaciones() {
        const tbody = document.getElementById('detalle_presentaciones');
        if (!tbody) return;

        if (this.presentacionesProducto.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i> No hay presentaciones agregadas
                    </td>
                </tr>
            `;
            return;
        }

        // Obtener sucursal actual para precios
        const sucursalId = this.sucursalActual;

        // Renderizar con loading inicial
        tbody.innerHTML = this.presentacionesProducto.map(pp => `
            <tr data-pp-id="${pp.id}">
                <td>${pp.presentacion?.nombre || pp.Presentacion?.nombre || '-'}</td>
                <td class="text-center precio-venta-detalle-${pp.id}">
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                </td>
                <td class="text-center stock-minimo-detalle-${pp.id}">
                    <span class="spinner-border spinner-border-sm" role="status"></span>
                </td>
                <td class="text-center">
                    <span class="badge ${pp.activo ? 'bg-success' : 'bg-secondary'}">
                        ${pp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
            </tr>
        `).join('');

        // Cargar precios de forma asíncrona para cada presentación
        for (const pp of this.presentacionesProducto) {
            if (!pp.activo) {
                // Si está inactivo, mostrar guiones
                document.querySelector(`.precio-venta-detalle-${pp.id}`).innerHTML =
                    '<span class="text-muted">-</span>';
                document.querySelector(`.stock-minimo-detalle-${pp.id}`).innerHTML =
                    '<span class="text-muted">-</span>';
                continue;
            }

            try {
                // Obtener precio vigente para esta presentación y sucursal
                const precioRes = await PreciosService.getPrecioVigente(pp.id, sucursalId);
                const precio = precioRes.data;

                // Mostrar precio de venta
                document.querySelector(`.precio-venta-detalle-${pp.id}`).innerHTML =
                    precio ? Formatter.formatCurrency(precio.precio_venta) :
                        '<span class="text-muted">Sin precio</span>';

                // Mostrar stock mínimo
                document.querySelector(`.stock-minimo-detalle-${pp.id}`).innerHTML =
                    precio ? (precio.stock_minimo || '<span class="text-muted">-</span>') :
                        '<span class="text-muted">-</span>';

            } catch (error) {
                console.error(`Error cargando precio para presentación ${pp.id}:`, error);

                // Si es 404, significa que no hay precio configurado
                if (error.message && error.message.includes('404')) {
                    document.querySelector(`.precio-venta-detalle-${pp.id}`).innerHTML =
                        '<span class="text-warning"><i class="bi bi-exclamation-triangle"></i> Sin configurar</span>';
                    document.querySelector(`.stock-minimo-detalle-${pp.id}`).innerHTML =
                        '<span class="text-muted">-</span>';
                } else {
                    // En caso de otro error
                    document.querySelector(`.precio-venta-detalle-${pp.id}`).innerHTML =
                        '<span class="text-danger">Error</span>';
                    document.querySelector(`.stock-minimo-detalle-${pp.id}`).innerHTML =
                        '<span class="text-danger">Error</span>';
                }
            }
        }
    },

    /**
     * Renderizar inventario por sucursal en el detalle
     */
    async renderDetalleInventario() {
        const tbody = document.getElementById('detalle_inventario');
        if (!tbody) return;

        if (this.presentacionesProducto.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i> No hay presentaciones para mostrar inventario
                    </td>
                </tr>
            `;
            return;
        }

        // Mostrar loading inicial
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando inventario...
                </td>
            </tr>
        `;

        try {
            // Recolectar todos los datos de inventario
            const inventarioData = [];

            // Para cada presentación activa, obtener su stock en todas las sucursales
            for (const pp of this.presentacionesProducto) {
                if (!pp.activo) continue;

                try {
                    const stockRes = await InventarioService.getStockProducto(pp.id);
                    const stocks = stockRes.data || [];

                    // Agregar cada registro de stock al array
                    stocks.forEach(stock => {
                        inventarioData.push({
                            sucursal_nombre: stock.sucursal?.nombre || stock.Sucursal?.nombre || '-',
                            presentacion_nombre: pp.presentacion?.nombre || pp.Presentacion?.nombre || '-',
                            existencia: stock.existencia || 0,
                            stock_minimo: stock.minimo || '-',
                            stock_maximo: stock.maximo || '-',
                            estado: this.getEstadoStock(stock.existencia, stock.minimo, stock.maximo)
                        });
                    });

                } catch (error) {
                    console.error(`Error cargando stock para presentación ${pp.id}:`, error);
                }
            }

            // Renderizar la tabla
            if (inventarioData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted py-3">
                            <i class="bi bi-info-circle"></i> No hay inventario registrado para este producto
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = inventarioData.map(item => `
                <tr>
                    <td>${item.sucursal_nombre}</td>
                    <td>${item.presentacion_nombre}</td>
                    <td class="text-center">
                        <span class="badge bg-${item.estado.color}">
                            ${item.existencia}
                        </span>
                    </td>
                    <td class="text-center">${item.stock_minimo}</td>
                    <td class="text-center">${item.stock_maximo}</td>
                    <td class="text-center">
                        <span class="badge bg-${item.estado.badgeColor}">
                            <i class="bi bi-${item.estado.icon}"></i>
                            ${item.estado.texto}
                        </span>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error cargando inventario:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-3">
                        <i class="bi bi-exclamation-triangle"></i> Error al cargar inventario
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Obtener estado del stock (óptimo, bajo, crítico, sin stock)
     */
    getEstadoStock(existencia, stockMin, stockMax) {
        const cantidad = parseInt(existencia) || 0;
        const minimo = parseInt(stockMin) || 0;
        const maximo = parseInt(stockMax) || 999999;

        if (cantidad === 0) {
            return {
                texto: 'Sin Stock',
                badgeColor: 'danger',
                color: 'danger',
                icon: 'x-circle-fill'
            };
        }

        if (cantidad < minimo) {
            return {
                texto: 'Bajo',
                badgeColor: 'warning',
                color: 'warning',
                icon: 'exclamation-triangle-fill'
            };
        }

        if (cantidad >= minimo && cantidad <= maximo) {
            return {
                texto: 'Óptimo',
                badgeColor: 'success',
                color: 'info',
                icon: 'check-circle-fill'
            };
        }

        // Si supera el máximo
        return {
            texto: 'Exceso',
            badgeColor: 'info',
            color: 'primary',
            icon: 'arrow-up-circle-fill'
        };
    },

    /**
     * Cargar precios para el tab de precios
     */
    async loadPreciosDetalle() {
        const sucursalId = document.getElementById('detalle_sucursal_select')?.value || this.sucursalActual;
        if (!sucursalId) {
            this.renderPreciosDetalle([]);
            return;
        }

        try {
            // Cargar precios para cada presentación del producto
            const preciosPromises = this.presentacionesProducto
                .filter(pp => pp.activo)
                .map(pp =>
                    PreciosService.getPrecioVigente(pp.id, sucursalId)
                        .then(res => ({
                            producto_presentacion_id: pp.id,
                            presentacion: pp.presentacion || pp.Presentacion,
                            precio: res.data
                        }))
                        .catch(() => ({
                            producto_presentacion_id: pp.id,
                            presentacion: pp.presentacion || pp.Presentacion,
                            precio: null
                        }))
                );

            const precios = await Promise.all(preciosPromises);
            this.renderPreciosDetalle(precios);

        } catch (error) {
            console.error('Error cargando precios:', error);
            this.renderPreciosDetalle([]);
        }
    },

    /**
     * Renderizar tabla de precios
     */
    renderPreciosDetalle(precios) {
        const tbody = document.getElementById('detalle_precios');
        if (!tbody) return;

        if (precios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-3">
                        <i class="bi bi-inbox"></i> No hay precios configurados para esta sucursal
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = precios.map(item => {
            const precio = item.precio;
            const hasPrecio = precio && precio.precio_venta;

            return `
                <tr>
                    <td>${item.presentacion?.nombre || '-'}</td>
                    <td class="text-end">
                        ${hasPrecio ? Formatter.formatCurrency(precio.precio_compra || 0) : '-'}
                    </td>
                    <td class="text-end">
                        ${hasPrecio ? Formatter.formatCurrency(precio.precio_venta) : '-'}
                    </td>
                    <td class="text-center">
                        ${hasPrecio && precio.descuento_pct ?
                    `<span class="badge bg-info">${precio.descuento_pct}%</span>` :
                    '-'
                }
                    </td>
                    <td class="text-center">
                        ${hasPrecio ? `
                            <button type="button" 
                                    class="btn btn-sm btn-outline-primary" 
                                    onclick="CatalogoController.editarPrecio(${precio.id}, ${item.producto_presentacion_id})"
                                    title="Editar precio">
                                <i class="bi bi-pencil"></i>
                            </button>
                        ` : `
                            <button type="button" 
                                    class="btn btn-sm btn-outline-success" 
                                    onclick="CatalogoController.crearPrecio(${item.producto_presentacion_id})"
                                    title="Agregar precio">
                                <i class="bi bi-plus-circle"></i>
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Abrir modal para agregar presentaciones
     */
    openAgregarPresentacionModal() {
        Alerts.prompt(
            'Selecciona las presentaciones a agregar',
            'Agregar Presentaciones',
            'select-multiple',
            this.presentaciones.map(p => ({
                value: p.id,
                text: p.nombre
            })),
            async (selectedIds) => {
                if (!selectedIds || selectedIds.length === 0) {
                    Alerts.warning('Debes seleccionar al menos una presentación');
                    return;
                }

                try {
                    Loader.show('Agregando presentaciones...');

                    await ProductosService.agregarPresentacionesAProducto(
                        this.currentProductoId,
                        selectedIds
                    );

                    Alerts.success('Presentaciones agregadas exitosamente');

                    // Recargar presentaciones
                    const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
                    this.presentacionesProducto = presentacionesRes.data || [];

                    // Re-renderizar
                    await this.renderDetallePresentaciones();
                    await this.loadPreciosDetalle();

                    Loader.hide();

                } catch (error) {
                    Loader.hide();
                    console.error('Error agregando presentaciones:', error);
                    Alerts.error(error.message || 'Error al agregar presentaciones');
                }
            }
        );
    },

    /**
     * Desactivar presentación del producto
     */
    async desactivarPresentacion(productoPresentacionId) {
        Alerts.confirm(
            '¿Estás seguro de desactivar esta presentación? No se podrá vender hasta que la reactives.',
            'Desactivar Presentación',
            async () => {
                try {
                    Loader.show('Desactivando...');

                    await ProductosService.desactivarProductoPresentacion(productoPresentacionId);

                    Alerts.success('Presentación desactivada exitosamente');

                    // Recargar presentaciones
                    const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
                    this.presentacionesProducto = presentacionesRes.data || [];

                    // Re-renderizar
                    await this.renderDetallePresentaciones();
                    await this.loadPreciosDetalle();

                    Loader.hide();

                } catch (error) {
                    Loader.hide();
                    console.error('Error desactivando presentación:', error);
                    Alerts.error(error.message || 'Error al desactivar presentación');
                }
            }
        );
    },

    /**
     * Reactivar presentación del producto
     */
    async reactivarPresentacion(productoPresentacionId) {
        try {
            Loader.show('Reactivando...');

            await ProductosService.reactivarProductoPresentacion(productoPresentacionId);

            Alerts.success('Presentación reactivada exitosamente');

            // Recargar presentaciones
            const presentacionesRes = await ProductosService.getPresentacionesDeProducto(this.currentProductoId);
            this.presentacionesProducto = presentacionesRes.data || [];

            // Re-renderizar
            await this.renderDetallePresentaciones();
            await this.loadPreciosDetalle();

            Loader.hide();

        } catch (error) {
            Loader.hide();
            console.error('Error reactivando presentación:', error);
            Alerts.error(error.message || 'Error al reactivar presentación');
        }
    },

    /**
     * Crear nuevo precio para una presentación
     */
    crearPrecio(productoPresentacionId) {
        const sucursalId = document.getElementById('detalle_sucursal_select')?.value || this.sucursalActual;

        if (!sucursalId) {
            Alerts.warning('Debes seleccionar una sucursal');
            return;
        }

        Alerts.customForm(
            'Crear Nuevo Precio',
            [
                {
                    id: 'precio_compra',
                    label: 'Precio de Compra',
                    type: 'number',
                    required: true,
                    placeholder: '0.00',
                    step: '0.01'
                },
                {
                    id: 'precio_venta',
                    label: 'Precio de Venta',
                    type: 'number',
                    required: true,
                    placeholder: '0.00',
                    step: '0.01'
                },
                {
                    id: 'descuento_pct',
                    label: 'Descuento (%)',
                    type: 'number',
                    required: false,
                    placeholder: '0',
                    step: '0.01',
                    value: 0
                }
            ],
            async (formData) => {
                try {
                    Loader.show('Creando precio...');

                    const precioData = {
                        producto_presentacion_id: productoPresentacionId,
                        sucursal_id: sucursalId,
                        precio_compra: parseFloat(formData.precio_compra),
                        precio_venta: parseFloat(formData.precio_venta),
                        descuento_pct: parseFloat(formData.descuento_pct) || 0
                    };

                    await PreciosService.createPrecio(precioData);

                    Alerts.success('Precio creado exitosamente');

                    // Recargar precios
                    await this.loadPreciosDetalle();

                    Loader.hide();

                } catch (error) {
                    Loader.hide();
                    console.error('Error creando precio:', error);
                    Alerts.error(error.message || 'Error al crear precio');
                }
            }
        );
    },

    /**
     * Editar precio existente
     */
    editarPrecio(precioId, productoPresentacionId) {
        // Primero obtener el precio actual
        PreciosService.getPrecioById(precioId).then(response => {
            const precioActual = response.data;

            Alerts.customForm(
                'Editar Precio',
                [
                    {
                        id: 'precio_compra',
                        label: 'Precio de Compra',
                        type: 'number',
                        required: true,
                        placeholder: '0.00',
                        step: '0.01',
                        value: precioActual.precio_compra || 0
                    },
                    {
                        id: 'precio_venta',
                        label: 'Precio de Venta',
                        type: 'number',
                        required: true,
                        placeholder: '0.00',
                        step: '0.01',
                        value: precioActual.precio_venta
                    },
                    {
                        id: 'descuento_pct',
                        label: 'Descuento (%)',
                        type: 'number',
                        required: false,
                        placeholder: '0',
                        step: '0.01',
                        value: precioActual.descuento_pct || 0
                    }
                ],
                async (formData) => {
                    try {
                        Loader.show('Actualizando precio...');

                        const precioData = {
                            precio_compra: parseFloat(formData.precio_compra),
                            precio_venta: parseFloat(formData.precio_venta),
                            descuento_pct: parseFloat(formData.descuento_pct) || 0
                        };

                        await PreciosService.updatePrecio(precioId, precioData);

                        Alerts.success('Precio actualizado exitosamente');

                        // Recargar precios
                        await this.loadPreciosDetalle();

                        Loader.hide();

                    } catch (error) {
                        Loader.hide();
                        console.error('Error actualizando precio:', error);
                        Alerts.error(error.message || 'Error al actualizar precio');
                    }
                }
            );
        }).catch(error => {
            console.error('Error obteniendo precio:', error);
            Alerts.error('Error al cargar el precio');
        });
    },

    /**
     * Cambiar sucursal en el tab de precios
     */
    async onSucursalChange() {
        await this.loadPreciosDetalle();
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
     * Eliminar producto (Soft Delete - desactiva el producto y sus presentaciones)
     */
    async deleteProducto(id) {
        // Usar SweetAlert2 para confirmación con información clara
        const result = await Swal.fire({
            title: '¿Desactivar este producto?',
            html: `
                <div class="text-start">
                    <p>El producto será <strong>desactivado</strong> junto con todas sus presentaciones.</p>
                    <div class="alert alert-info mt-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Nota:</strong> El producto no se eliminará permanentemente.
                        <ul class="mb-0 mt-2">
                            <li>No aparecerá en el catálogo ni en ventas</li>
                            <li>Se conserva todo el historial</li>
                            <li>Puedes reactivarlo cuando quieras</li>
                        </ul>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-toggle-off me-2"></i>Sí, desactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            Loader.show('Desactivando producto...');

            // El backend ahora hace soft delete automáticamente
            // Desactiva el producto Y todas sus presentaciones
            await ProductosService.deleteProducto(id);

            Loader.hide();
            Alerts.success('Producto desactivado exitosamente. Ya no aparecerá en el catálogo ni en ventas.');

            // Recargar lista
            await this.loadProductos();

        } catch (error) {
            Loader.hide();
            console.error('Error desactivando producto:', error);
            Alerts.error(error.message || 'Error al desactivar el producto');
        }
    },

    /**
     * Reactivar producto desactivado
     */
    async reactivarProducto(id) {
        const result = await Swal.fire({
            title: '¿Reactivar este producto?',
            html: `
                <div class="text-start">
                    <p>El producto será <strong>reactivado</strong> junto con todas sus presentaciones.</p>
                    <div class="alert alert-success mt-3">
                        <i class="bi bi-check-circle me-2"></i>
                        <strong>Al reactivar:</strong>
                        <ul class="mb-0 mt-2">
                            <li>Volverá a aparecer en el catálogo</li>
                            <li>Estará disponible para ventas</li>
                            <li>Se recuperan todos los datos y precios</li>
                        </ul>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-check-circle me-2"></i>Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-secondary'
            }
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            Loader.show('Reactivando producto...');

            await ProductosService.reactivarProducto(id);

            Loader.hide();
            Alerts.success('Producto reactivado exitosamente. Ya está disponible en el catálogo y ventas.');

            // Recargar lista
            await this.loadProductos();

        } catch (error) {
            Loader.hide();
            console.error('Error reactivando producto:', error);
            Alerts.error(error.message || 'Error al reactivar el producto');
        }
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

        // Resetear estado
        this.isEditMode = false;
        this.currentProductoId = null;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    CatalogoController.init();
});