/**
 * Controlador de Compras
 * Maneja órdenes de compra y recepciones
 */

const ComprasController = {
    // Estado
    ordenes: [],
    proveedores: [],
    sucursales: [],
    catalogoVendible: [],
    itemsOrden: [],
    currentOrdenId: null,
    currentOrdenData: null,
    modalOrden: null,
    modalDetalle: null,
    modalRecepcion: null,
    modalProductSelector: null,
    isEditMode: false,

    /**
     * Inicializar
     */
    async init() {
        if (!AuthService.requireAuth()) {
            return;
        }

        await loadLayout();
        await this.loadModals();

        // Inicializar modals
        this.modalOrden = new bootstrap.Modal(document.getElementById('modalOrdenCompra'));
        this.modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleOrden'));
        this.modalRecepcion = new bootstrap.Modal(document.getElementById('modalRecepcion'));
        this.modalProductSelector = new bootstrap.Modal(document.getElementById('modalProductSelector'));

        await this.loadInitialData();
        this.setupEventListeners();
        await this.loadOrdenes();
    },

    /**
     * Cargar modals
     */
    async loadModals() {
        await Promise.all([
            loadComponent('modal-orden-container', '/components/modals/modal-orden-compra.html'),
            loadComponent('modal-detalle-container', '/components/modals/modal-detalle-orden.html'),
            loadComponent('modal-recepcion-container', '/components/modals/modal-recepcion.html')
        ]);
    },

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            Loader.show('Cargando datos...');

            const [proveedoresRes, sucursalesRes, catalogoRes] = await Promise.all([
                ProveedoresService.getProveedores(),
                SucursalesService.getSucursales(),
                ProductosService.getCatalogoVendible()
            ]);

            this.proveedores = proveedoresRes.data || [];
            this.sucursales = sucursalesRes.data || [];
            this.catalogoVendible = catalogoRes.data || [];

            this.fillFilterSelects();
            this.fillFormSelects();

            // Fecha actual por defecto
            const today = new Date().toISOString().split('T')[0];
            const fechaOrdenInput = document.getElementById('fecha_orden');
            if (fechaOrdenInput) {
                fechaOrdenInput.value = today;
            }

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
        // Proveedores
        const filterProveedor = document.getElementById('filterProveedor');
        if (filterProveedor) {
            filterProveedor.innerHTML = '<option value="">Todos los Proveedores</option>';
            this.proveedores.forEach(p => {
                filterProveedor.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
            });
        }

        // Sucursales
        const filterSucursal = document.getElementById('filterSucursal');
        if (filterSucursal) {
            filterSucursal.innerHTML = '<option value="">Todas las Sucursales</option>';
            this.sucursales.forEach(s => {
                filterSucursal.innerHTML += `<option value="${s.id}">${s.nombre}</option>`;
            });
        }
    },

    /**
     * Llenar selects del formulario
     */
    fillFormSelects() {
        // Proveedores en formulario
        const proveedorSelect = document.getElementById('proveedor_id');
        if (proveedorSelect) {
            proveedorSelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.proveedores.forEach(p => {
                proveedorSelect.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
            });
        }

        // Sucursales en formulario
        const sucursalSelect = document.getElementById('sucursal_id');
        if (sucursalSelect) {
            sucursalSelect.innerHTML = '<option value="">Seleccionar...</option>';
            this.sucursales.forEach(s => {
                sucursalSelect.innerHTML += `<option value="${s.id}">${s.nombre}</option>`;
            });
        }

        // Productos en selector
        const productoSelector = document.getElementById('producto_presentacion_selector');
        if (productoSelector) {
            productoSelector.innerHTML = '<option value="">Seleccionar...</option>';
            this.catalogoVendible.forEach(item => {
                const producto = item.producto || item.Producto;
                const presentacion = item.presentacion || item.Presentacion;
                if (producto && presentacion) {
                    productoSelector.innerHTML += `
                        <option value="${item.id}">
                            ${producto.descripcion} - ${presentacion.nombre}
                        </option>
                    `;
                }
            });
        }
    },

    /**
     * Event listeners
     */
    setupEventListeners() {
        ['filterProveedor', 'filterSucursal', 'filterEstado', 'filterDesde', 'filterHasta'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadOrdenes());
            }
        });

        const modalElement = document.getElementById('modalOrdenCompra');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', () => this.resetForm());
        }
    },

    /**
     * Cargar órdenes
     */
    async loadOrdenes() {
        try {
            Loader.show('Cargando órdenes...');

            const filtros = {
                proveedor_id: document.getElementById('filterProveedor')?.value || '',
                sucursal_id: document.getElementById('filterSucursal')?.value || '',
                estado: document.getElementById('filterEstado')?.value || '',
                desde: document.getElementById('filterDesde')?.value || '',
                hasta: document.getElementById('filterHasta')?.value || ''
            };

            const response = await ComprasService.getOrdenes(filtros);
            this.ordenes = response.data || [];

            this.renderOrdenes();
            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando órdenes:', error);
            Alerts.error('Error al cargar las órdenes');
        }
    },

    /**
     * Renderizar tabla de órdenes
     */
    renderOrdenes() {
        const tbody = document.getElementById('ordenesTableBody');
        if (!tbody) return;

        if (this.ordenes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="empty-state">
                            <i class="bi bi-inbox"></i>
                            <h4>No hay órdenes de compra</h4>
                            <p class="text-muted">Crea tu primera orden de compra</p>
                            <button class="btn btn-primary" onclick="ComprasController.openCreateModal()">
                                Nueva Orden
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.ordenes.map(orden => {
            const estadoBadge = this.getEstadoBadge(orden.estado);

            return `
                <tr>
                    <td>
                        <span class="badge bg-secondary">${orden.serie || 'OC'}-${orden.numero}</span>
                    </td>
                    <td>${Formatter.date(orden.fecha_orden)}</td>
                    <td>${orden.proveedor?.nombre || orden.Proveedor?.nombre || '-'}</td>
                    <td>${orden.sucursal?.nombre || orden.Sucursal?.nombre || '-'}</td>
                    <td class="fw-bold text-primary">${Formatter.currency(orden.total)}</td>
                    <td>${estadoBadge}</td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button type="button" 
                                    class="btn btn-outline-primary" 
                                    onclick="ComprasController.viewDetalle(${orden.id})"
                                    title="Ver detalle">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${orden.estado === 'PENDIENTE' || orden.estado === 'PARCIAL' ? `
                                <button type="button" 
                                        class="btn btn-outline-success" 
                                        onclick="ComprasController.viewDetalleAndRecepcionar(${orden.id})"
                                        title="Recepcionar">
                                    <i class="bi bi-box-arrow-in-down"></i>
                                </button>
                            ` : ''}
                            ${orden.estado === 'PENDIENTE' ? `
                                <button type="button" 
                                        class="btn btn-outline-danger" 
                                        onclick="ComprasController.confirmCancelar(${orden.id})"
                                        title="Cancelar">
                                    <i class="bi bi-x-octagon"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Badge de estado
     */
    getEstadoBadge(estado) {
        const badges = {
            'PENDIENTE': '<span class="badge bg-warning">Pendiente</span>',
            'PARCIAL': '<span class="badge bg-info">Parcial</span>',
            'RECIBIDA': '<span class="badge bg-success">Recibida</span>',
            'CANCELADA': '<span class="badge bg-danger">Cancelada</span>'
        };
        return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
    },

    /**
     * Abrir modal crear
     */
    openCreateModal() {
        this.isEditMode = false;
        this.currentOrdenId = null;
        this.itemsOrden = [];

        this.resetForm();

        document.getElementById('modalOrdenTitle').textContent = 'Nueva Orden de Compra';

        // Fecha actual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fecha_orden').value = today;

        this.renderItemsTable();
        this.modalOrden.show();
    },

    /**
     * Abrir selector de producto
     */
    openProductSelector() {
        // Limpiar campos
        document.getElementById('producto_presentacion_selector').value = '';
        document.getElementById('cantidad_selector').value = '1';
        document.getElementById('precio_selector').value = '';
        document.getElementById('descuento_selector').value = '0';

        this.modalProductSelector.show();
    },

    /**
     * Agregar producto a la orden
     */
    addProductoToOrden() {
        const ppId = parseInt(document.getElementById('producto_presentacion_selector').value);
        const cantidad = parseFloat(document.getElementById('cantidad_selector').value);
        const precio = parseFloat(document.getElementById('precio_selector').value);
        const descuento = parseFloat(document.getElementById('descuento_selector').value) || 0;

        if (!ppId) {
            Alerts.warning('Selecciona un producto');
            return;
        }
        if (!cantidad || cantidad <= 0) {
            Alerts.warning('Ingresa una cantidad válida');
            return;
        }
        if (!precio || precio < 0) {
            Alerts.warning('Ingresa un precio válido');
            return;
        }

        // Buscar el producto en el catálogo
        const productoPresentacion = this.catalogoVendible.find(item => item.id === ppId);
        if (!productoPresentacion) {
            Alerts.error('Producto no encontrado');
            return;
        }

        // Verificar si ya está en la lista
        const existe = this.itemsOrden.find(item => item.producto_presentacion_id === ppId);
        if (existe) {
            Alerts.warning('Este producto ya fue agregado');
            return;
        }

        // Calcular subtotal
        const subtotalBruto = cantidad * precio;
        const descuentoMonto = subtotalBruto * (descuento / 100);
        const subtotal = subtotalBruto - descuentoMonto;

        // Agregar al array
        this.itemsOrden.push({
            producto_presentacion_id: ppId,
            productoPresentacion: productoPresentacion,
            cantidad,
            precio_unitario: precio,
            descuento_pct: descuento,
            subtotal
        });

        this.renderItemsTable();
        this.modalProductSelector.hide();
        Alerts.success('Producto agregado');
    },

    /**
     * Renderizar tabla de items
     */
    renderItemsTable() {
        const tbody = document.getElementById('itemsTableBody');
        const noItems = document.getElementById('noItems');

        if (!tbody) return;

        if (this.itemsOrden.length === 0) {
            tbody.innerHTML = '';
            if (noItems) noItems.style.display = 'block';

            document.getElementById('ordenSubtotal').textContent = 'Q 0.00';
            document.getElementById('ordenDescuento').textContent = 'Q 0.00';
            document.getElementById('ordenTotal').textContent = 'Q 0.00';
            return;
        }

        if (noItems) noItems.style.display = 'none';

        tbody.innerHTML = this.itemsOrden.map((item, index) => {
            const producto = item.productoPresentacion?.producto || item.productoPresentacion?.Producto;
            const presentacion = item.productoPresentacion?.presentacion || item.productoPresentacion?.Presentacion;

            return `
                <tr>
                    <td>${producto?.descripcion || '-'}</td>
                    <td>${presentacion?.nombre || '-'}</td>
                    <td>
                        <input type="number" 
                               class="form-control form-control-sm" 
                               value="${item.cantidad}"
                               min="1"
                               onchange="ComprasController.updateItemCantidad(${index}, this.value)">
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control form-control-sm" 
                               value="${item.precio_unitario}"
                               step="0.01"
                               min="0"
                               onchange="ComprasController.updateItemPrecio(${index}, this.value)">
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control form-control-sm" 
                               value="${item.descuento_pct}"
                               step="0.01"
                               min="0"
                               max="100"
                               onchange="ComprasController.updateItemDescuento(${index}, this.value)">
                    </td>
                    <td class="fw-bold">${Formatter.currency(item.subtotal)}</td>
                    <td class="text-center">
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger" 
                                onclick="ComprasController.removeItem(${index})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.updateTotals();
    },

    /**
     * Actualizar cantidad
     */
    updateItemCantidad(index, nuevaCantidad) {
        const cantidad = parseFloat(nuevaCantidad);
        if (cantidad <= 0) {
            Alerts.warning('Cantidad inválida');
            this.renderItemsTable();
            return;
        }

        this.itemsOrden[index].cantidad = cantidad;
        this.recalculateItemSubtotal(index);
        this.renderItemsTable();
    },

    /**
     * Actualizar precio
     */
    updateItemPrecio(index, nuevoPrecio) {
        const precio = parseFloat(nuevoPrecio);
        if (precio < 0) {
            Alerts.warning('Precio inválido');
            this.renderItemsTable();
            return;
        }

        this.itemsOrden[index].precio_unitario = precio;
        this.recalculateItemSubtotal(index);
        this.renderItemsTable();
    },

    /**
     * Actualizar descuento
     */
    updateItemDescuento(index, nuevoDescuento) {
        const descuento = parseFloat(nuevoDescuento);
        if (descuento < 0 || descuento > 100) {
            Alerts.warning('Descuento inválido');
            this.renderItemsTable();
            return;
        }

        this.itemsOrden[index].descuento_pct = descuento;
        this.recalculateItemSubtotal(index);
        this.renderItemsTable();
    },

    /**
     * Recalcular subtotal de un item
     */
    recalculateItemSubtotal(index) {
        const item = this.itemsOrden[index];
        const subtotalBruto = item.cantidad * item.precio_unitario;
        const descuentoMonto = subtotalBruto * (item.descuento_pct / 100);
        item.subtotal = subtotalBruto - descuentoMonto;
    },

    /**
     * Remover item
     */
    removeItem(index) {
        this.itemsOrden.splice(index, 1);
        this.renderItemsTable();
    },

    /**
     * Actualizar totales
     */
    updateTotals() {
        let subtotalTotal = 0;
        let descuentoTotal = 0;

        this.itemsOrden.forEach(item => {
            const subtotalBruto = item.cantidad * item.precio_unitario;
            const descuentoMonto = subtotalBruto * (item.descuento_pct / 100);

            subtotalTotal += subtotalBruto;
            descuentoTotal += descuentoMonto;
        });

        const total = subtotalTotal - descuentoTotal;

        document.getElementById('ordenSubtotal').textContent = Formatter.currency(subtotalTotal);
        document.getElementById('ordenDescuento').textContent = Formatter.currency(descuentoTotal);
        document.getElementById('ordenTotal').textContent = Formatter.currency(total);
    },

    /**
     * Guardar orden
     */
    async saveOrden() {
        try {
            // Validar
            if (!this.validateOrdenForm()) {
                Alerts.warning('Por favor completa todos los campos obligatorios');
                return;
            }

            if (this.itemsOrden.length === 0) {
                Alerts.warning('Debes agregar al menos un producto');
                return;
            }

            const btnGuardar = document.getElementById('btnGuardarOrden');
            Loader.showInButton(btnGuardar, 'Guardando...');

            const user = Storage.getUser();

            const ordenData = {
                proveedor_id: parseInt(document.getElementById('proveedor_id').value),
                sucursal_id: parseInt(document.getElementById('sucursal_id').value),
                usuario_id: user.id,
                fecha_orden: document.getElementById('fecha_orden').value,
                fecha_entrega_estimada: document.getElementById('fecha_entrega_estimada').value || null,
                serie: document.getElementById('serie').value,
                items: this.itemsOrden.map(item => ({
                    producto_presentacion_id: item.producto_presentacion_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento_pct: item.descuento_pct
                })),
                observaciones: document.getElementById('observaciones').value || null
            };

            const response = await ComprasService.createOrden(ordenData);

            Loader.hideInButton(btnGuardar);
            Alerts.success(response.message || 'Orden creada exitosamente');

            this.modalOrden.hide();
            await this.loadOrdenes();

        } catch (error) {
            const btnGuardar = document.getElementById('btnGuardarOrden');
            Loader.hideInButton(btnGuardar);
            console.error('Error guardando orden:', error);
            Alerts.error(error.message || 'Error al guardar la orden');
        }
    },

    /**
     * Validar formulario
     */
    validateOrdenForm() {
        let isValid = true;

        const requiredFields = [
            { id: 'proveedor_id', name: 'Proveedor' },
            { id: 'sucursal_id', name: 'Sucursal' },
            { id: 'fecha_orden', name: 'Fecha de Orden' }
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
     * Ver detalle
     */
    async viewDetalle(id) {
        try {
            Loader.show('Cargando detalle...');

            const response = await ComprasService.getOrdenById(id);
            const orden = response.data;
            this.currentOrdenData = orden;
            this.currentOrdenId = id;

            // Llenar información
            document.getElementById('detalle_numero').textContent = `${orden.serie}-${orden.numero}`;
            document.getElementById('detalle_fecha').textContent = Formatter.date(orden.fecha_orden);
            document.getElementById('detalle_proveedor').textContent = orden.proveedor?.nombre || orden.Proveedor?.nombre || '-';
            document.getElementById('detalle_sucursal').textContent = orden.sucursal?.nombre || orden.Sucursal?.nombre || '-';
            document.getElementById('detalle_estado').innerHTML = this.getEstadoBadge(orden.estado);
            document.getElementById('detalle_total').textContent = Formatter.currency(orden.total);
            document.getElementById('detalle_observaciones').textContent = orden.observaciones || '-';

            // Items
            const tbodyItems = document.getElementById('detalle_items');
            if (tbodyItems && orden.detalles) {
                tbodyItems.innerHTML = orden.detalles.map(detalle => {
                    const pp = detalle.productoPresentacion || detalle.ProductoPresentacion;
                    const producto = pp?.producto || pp?.Producto;
                    const presentacion = pp?.presentacion || pp?.Presentacion;

                    return `
                        <tr>
                            <td>${producto?.descripcion || '-'}</td>
                            <td>${presentacion?.nombre || '-'}</td>
                            <td>${detalle.cantidad}</td>
                            <td>${detalle.cantidad_recibida || 0}</td>
                            <td>${Formatter.currency(detalle.precio_unitario)}</td>
                            <td>${detalle.descuento_pct}%</td>
                            <td>${Formatter.currency(detalle.subtotal)}</td>
                        </tr>
                    `;
                }).join('');
            }

            // Recepciones
            const divRecepciones = document.getElementById('detalle_recepciones');
            if (divRecepciones) {
                if (!orden.recepciones || orden.recepciones.length === 0) {
                    divRecepciones.innerHTML = '<p class="text-muted">No hay recepciones registradas</p>';
                } else {
                    divRecepciones.innerHTML = orden.recepciones.map(rec => `
                        <div class="card mb-2">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <strong>Recepción #${rec.id}</strong> - ${Formatter.date(rec.fecha_recepcion, true)}
                                    </div>
                                    <div>
                                        <small class="text-muted">Por: ${rec.usuario?.nombre || '-'}</small>
                                    </div>
                                </div>
                                ${rec.observaciones ? `<p class="mb-0 mt-2"><small>${rec.observaciones}</small></p>` : ''}
                            </div>
                        </div>
                    `).join('');
                }
            }

            // Botones
            const btnRecepcionar = document.getElementById('btnRecepcionar');
            const btnCancelar = document.getElementById('btnCancelar');

            if (btnRecepcionar) {
                btnRecepcionar.style.display = (orden.estado === 'PENDIENTE' || orden.estado === 'PARCIAL') ? 'inline-block' : 'none';
            }

            if (btnCancelar) {
                btnCancelar.style.display = orden.estado === 'PENDIENTE' ? 'inline-block' : 'none';
            }

            Loader.hide();
            this.modalDetalle.show();

        } catch (error) {
            Loader.hide();
            console.error('Error cargando detalle:', error);
            Alerts.error('Error al cargar el detalle');
        }
    },

    /**
     * Ver detalle y abrir recepción
     */
    async viewDetalleAndRecepcionar(id) {
        await this.viewDetalle(id);
        setTimeout(() => {
            this.openRecepcionModal();
        }, 500);
    },

    /**
     * Abrir modal de recepción
     */
    openRecepcionModal() {
        if (!this.currentOrdenData) {
            Alerts.error('No hay orden seleccionada');
            return;
        }

        const orden = this.currentOrdenData;

        // Info básica
        document.getElementById('recepcion_orden_id').value = orden.id;
        document.getElementById('recepcion_numero_orden').textContent = `${orden.serie}-${orden.numero}`;
        document.getElementById('recepcion_proveedor').textContent = orden.proveedor?.nombre || orden.Proveedor?.nombre || '-';
        document.getElementById('recepcion_observaciones').value = '';

        // Tabla de productos
        const tbody = document.getElementById('recepcionItemsBody');
        if (tbody && orden.detalles) {
            tbody.innerHTML = orden.detalles.map(detalle => {
                const pp = detalle.productoPresentacion || detalle.ProductoPresentacion;
                const producto = pp?.producto || pp?.Producto;
                const presentacion = pp?.presentacion || pp?.Presentacion;
                const pendiente = detalle.cantidad - (detalle.cantidad_recibida || 0);

                return `
                    <tr>
                        <td>
                            ${producto?.descripcion || '-'} - ${presentacion?.nombre || '-'}
                            <input type="hidden" class="detalle-orden-id" value="${detalle.id}">
                        </td>
                        <td>${detalle.cantidad}</td>
                        <td>${detalle.cantidad_recibida || 0}</td>
                        <td class="fw-bold text-warning">${pendiente}</td>
                        <td>
                            <input type="number" 
                                   class="form-control form-control-sm cantidad-recibir" 
                                   min="0" 
                                   max="${pendiente}"
                                   value="${pendiente}">
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.modalRecepcion.show();
    },

    /**
     * Confirmar recepción
     */
    async confirmarRecepcion() {
        try {
            const ordenId = parseInt(document.getElementById('recepcion_orden_id').value);
            const observaciones = document.getElementById('recepcion_observaciones').value;

            // Obtener items
            const rows = document.querySelectorAll('#recepcionItemsBody tr');
            const items = [];

            rows.forEach(row => {
                const detalleOrdenId = parseInt(row.querySelector('.detalle-orden-id').value);
                const cantidadRecibir = parseFloat(row.querySelector('.cantidad-recibir').value) || 0;

                if (cantidadRecibir > 0) {
                    items.push({
                        detalle_orden_id: detalleOrdenId,
                        cantidad_recibida: cantidadRecibir
                    });
                }
            });

            if (items.length === 0) {
                Alerts.warning('Debes recibir al menos un producto');
                return;
            }

            const btnConfirmar = document.getElementById('btnConfirmarRecepcion');
            Loader.showInButton(btnConfirmar, 'Procesando...');

            const user = Storage.getUser();

            const recepcionData = {
                orden_compra_id: ordenId,
                usuario_id: user.id,
                items,
                observaciones: observaciones || null
            };

            const response = await ComprasService.createRecepcion(recepcionData);

            Loader.hideInButton(btnConfirmar);
            Alerts.success(response.message || 'Recepción registrada exitosamente');

            this.modalRecepcion.hide();
            this.modalDetalle.hide();
            await this.loadOrdenes();

        } catch (error) {
            const btnConfirmar = document.getElementById('btnConfirmarRecepcion');
            Loader.hideInButton(btnConfirmar);
            console.error('Error en recepción:', error);
            Alerts.error(error.message || 'Error al registrar la recepción');
        }
    },

    /**
     * Confirmar cancelación
     */
    confirmCancelar(id) {
        Alerts.confirm(
            '¿Estás seguro de cancelar esta orden de compra? Esta acción no se puede deshacer.',
            'Cancelar Orden',
            () => this.cancelarOrdenConfirmed(id)
        );
    },

    /**
     * Cancelar orden
     */
    async cancelarOrdenConfirmed(id) {
        try {
            Loader.show('Cancelando orden...');

            await ComprasService.cancelarOrden(id);

            Loader.hide();
            Alerts.success('Orden cancelada exitosamente');

            this.modalDetalle.hide();
            await this.loadOrdenes();

        } catch (error) {
            Loader.hide();
            console.error('Error cancelando orden:', error);
            Alerts.error(error.message || 'Error al cancelar la orden');
        }
    },

    /**
     * Cancelar orden desde el detalle
     */
    async cancelarOrden() {
        if (!this.currentOrdenId) {
            Alerts.error('No hay orden seleccionada');
            return;
        }

        this.confirmCancelar(this.currentOrdenId);
    },

    /**
     * Resetear formulario
     */
    resetForm() {
        const form = document.getElementById('formOrdenCompra');
        if (form) {
            form.reset();
        }

        // Limpiar errores
        document.querySelectorAll('.is-invalid').forEach(el => {
            Validator.clearError(el);
        });

        // Limpiar items
        this.itemsOrden = [];
        this.renderItemsTable();

        // Fecha actual
        const today = new Date().toISOString().split('T')[0];
        const fechaOrdenInput = document.getElementById('fecha_orden');
        if (fechaOrdenInput) {
            fechaOrdenInput.value = today;
        }

        // Resetear estado
        this.isEditMode = false;
        this.currentOrdenId = null;
        this.currentOrdenData = null;
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    ComprasController.init();
});