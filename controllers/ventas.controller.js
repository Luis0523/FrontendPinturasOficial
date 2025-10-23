/**
 * =====================================================
 * VENTAS CONTROLLER - PUNTO DE VENTA (POS)
 * =====================================================
 * Controller principal para manejar toda la lógica del
 * Punto de Venta (POS).
 * 
 * Funcionalidades:
 * - Gestión de sucursales
 * - Carga de inventario
 * - Carrito de compras
 * - Búsqueda de productos y clientes
 * - Facturación
 * - Validaciones
 * =====================================================
 */

const VentasController = {
    // ==================== ESTADO DEL POS ====================
    estado: {
        sucursalSeleccionada: null,
        inventario: [],
        inventarioFiltrado: [],
        carrito: [],
        clienteActivo: null,
        usuario: null,
        metodoPago: 'EFECTIVO',
        montoRecibido: 0,
        paginaActual: 1,
        productosPorPagina: 12,
        terminoBusqueda: ''
    },

    // ==================== INICIALIZACIÓN ====================

    /**
     * Inicializar el POS
     */
    async init() {
        try {
            console.log('🚀 Inicializando POS...');


            // Cargar usuario actual
            this.cargarUsuario();
            console.log(this.estado.usuario);

            // Cargar cliente CF por defecto
            this.cargarClienteCF();

            // Cargar sucursales
            await this.cargarSucursales();

            // Configurar eventos
            this.configurarEventos();

            // Actualizar fecha actual
            this.actualizarFecha();

            console.log('✅ POS inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar POS:', error);
            this.mostrarError('Error al inicializar el POS: ' + error.message);
        }
    },

    /**
     * Cargar información del usuario actual
     */
    cargarUsuario() {
        const usuarioStr = Storage.getUser();
        if (usuarioStr) {
            console.log(usuarioStr);
            this.estado.usuario = usuarioStr
            document.getElementById('usuarioNombre').textContent = this.estado.usuario.nombre || 'Usuario';
        }
    },

    /**
     * Cargar cliente CF por defecto
     */
    cargarClienteCF() {
        this.estado.clienteActivo = ClientesService.obtenerClienteCF();
        this.actualizarVistaCliente();
    },

    /**
     * Actualizar fecha actual
     */
    actualizarFecha() {
        const fecha = new Date();
        const fechaFormateada = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
        document.getElementById('fechaActual').textContent = fechaFormateada;
    },

    // ==================== SUCURSALES ====================

    /**
     * Cargar sucursales disponibles
     */
    async cargarSucursales() {
        try {
            const response = await SucursalesService.getSucursales();

            if (response.success && response.data) {
                const select = document.getElementById('selectSucursal');
                select.innerHTML = '<option value="" selected disabled>-- Seleccione una sucursal --</option>';

                response.data.forEach(sucursal => {
                    const option = document.createElement('option');
                    option.value = sucursal.id;
                    option.textContent = sucursal.nombre;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
            this.mostrarError('Error al cargar las sucursales');
        }
    },

    /**
     * Manejar cambio de sucursal
     */
    async onSucursalChange(sucursalId) {
        try {
            if (!sucursalId) return;

            // Limpiar carrito si había productos de otra sucursal
            if (this.estado.carrito.length > 0) {
                if (!confirm('Al cambiar de sucursal se limpiará el carrito. ¿Desea continuar?')) {
                    // Revertir selección
                    return;
                }
                this.limpiarCarrito();
            }

            // Mostrar loader
            this.mostrarLoaderProductos();

            // Cargar inventario de la sucursal
            const response = await InventarioService.getInventarioSucursal(sucursalId);

            if (response.success && response.data) {
                this.estado.sucursalSeleccionada = {
                    id: parseInt(sucursalId),
                    nombre: document.getElementById('selectSucursal').selectedOptions[0].text
                };

                this.estado.inventario = response.data;
                this.estado.inventarioFiltrado = response.data;

                // Actualizar estadísticas
                this.actualizarEstadisticas();

                // Renderizar productos
                this.renderizarProductos();

                // Mostrar contenido principal
                document.getElementById('posMainContent').style.display = 'flex';

                console.log(`✅ Inventario cargado: ${response.data.length} productos`);
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            this.mostrarError('Error al cargar el inventario de la sucursal');
        } finally {
            this.ocultarLoaderProductos();
        }
    },

    // ==================== PRODUCTOS ====================

    /**
     * Renderizar productos en el grid
     */
    renderizarProductos() {
        const grid = document.getElementById('productosGrid');
        const mensajeInicial = document.getElementById('mensajeInicialProductos');


        if (mensajeInicial) {
            mensajeInicial.style.display = 'none';
        }

        // Limpiar grid
        grid.innerHTML = '';

        // Calcular paginación
        const inicio = (this.estado.paginaActual - 1) * this.estado.productosPorPagina;
        const fin = inicio + this.estado.productosPorPagina;
        const productosPagina = this.estado.inventarioFiltrado.slice(inicio, fin);

        if (productosPagina.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search text-muted" style="font-size: 4rem;"></i>
                    <p class="text-muted mt-3">No se encontraron productos</p>
                </div>
            `;
            return;
        }

        // Renderizar cada producto
        productosPagina.forEach(item => {
            const card = this.crearCardProducto(item);
            grid.appendChild(card);
        });

        // Actualizar paginación (si es necesario)
        // this.actualizarPaginacion();
    },

    /**
     * Crear card de producto
     */
    crearCardProducto(item) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';

        const producto = item.productoPresentacion?.producto || {};
        const presentacion = item.productoPresentacion?.presentacion || {};

        // Determinar estado del stock
        let badgeStock = '';
        let btnDisabled = '';

        if (item.existencia === 0) {
            badgeStock = '<span class="badge bg-danger">Agotado</span>';
            btnDisabled = 'disabled';
        } else if (item.estado === 'BAJO') {
            badgeStock = '<span class="badge bg-warning text-dark">Stock Bajo</span>';
        } else {
            badgeStock = '<span class="badge bg-success">Disponible</span>';
        }

        col.innerHTML = `
            <div class="card h-100 shadow-sm producto-card">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <small class="text-muted">${producto.codigo_sku || 'N/A'}</small>
                        ${badgeStock}
                    </div>
                    <h6 class="card-title" style="font-size: 0.9rem; min-height: 40px;">
                        ${producto.descripcion || 'Producto'}
                    </h6>
                    <p class="card-text mb-2">
                        <small class="text-muted">
                            ${presentacion.nombre || 'N/A'}
                            ${producto.color ? `<br>Color: ${producto.color}` : ''}
                        </small>
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">Stock: <strong>${item.existencia}</strong></small>
                    </div>
                    <div class="d-grid">
                        <button 
                            class="btn btn-primary btn-sm" 
                            onclick="VentasController.agregarAlCarrito(${item.producto_presentacion_id})"
                            ${btnDisabled}
                        >
                            <i class="bi bi-plus-circle"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        `;

        return col;
    },

    /**
     * Buscar productos
     */
    buscarProductos(termino) {
        this.estado.terminoBusqueda = termino.toLowerCase();

        if (!termino) {
            this.estado.inventarioFiltrado = this.estado.inventario;
        } else {
            this.estado.inventarioFiltrado = this.estado.inventario.filter(item => {
                const producto = item.productoPresentacion?.producto || {};
                const presentacion = item.productoPresentacion?.presentacion || {};

                return (
                    producto.codigo_sku?.toLowerCase().includes(termino) ||
                    producto.descripcion?.toLowerCase().includes(termino) ||
                    producto.color?.toLowerCase().includes(termino) ||
                    presentacion.nombre?.toLowerCase().includes(termino)
                );
            });
        }

        this.estado.paginaActual = 1;
        this.renderizarProductos();
        this.actualizarEstadisticas();
    },

    /**
     * Actualizar estadísticas del inventario
     */
    actualizarEstadisticas() {
        const inventario = this.estado.inventarioFiltrado;

        const disponibles = inventario.filter(i => i.existencia > 0).length;
        const stockBajo = inventario.filter(i => i.estado === 'BAJO').length;
        const agotados = inventario.filter(i => i.existencia === 0).length;

        document.getElementById('statsProductosDisponibles').textContent = disponibles;
        document.getElementById('statsStockBajo').textContent = stockBajo;
        document.getElementById('statsAgotados').textContent = agotados;
    },

    // ==================== CARRITO ====================

    /**
     * Agregar producto al carrito
     */
    async agregarAlCarrito(productoPresentacionId) {
        try {
            // Buscar el producto en el inventario
            const itemInventario = this.estado.inventario.find(
                i => i.producto_presentacion_id === productoPresentacionId
            );

            if (!itemInventario) {
                this.mostrarError('Producto no encontrado en el inventario');
                return;
            }

            // Verificar stock disponible
            if (itemInventario.existencia <= 0) {
                this.mostrarError('Producto sin stock disponible');
                return;
            }

            // Verificar si ya está en el carrito
            const itemCarrito = this.estado.carrito.find(
                i => i.producto_presentacion_id === productoPresentacionId
            );

            if (itemCarrito) {
                // Verificar si hay stock suficiente para agregar uno más
                if (itemCarrito.cantidad >= itemInventario.existencia) {
                    this.mostrarError('No hay suficiente stock disponible');
                    return;
                }

                // Incrementar cantidad
                itemCarrito.cantidad++;
                itemCarrito.subtotal = itemCarrito.cantidad * itemCarrito.precio_unitario;
            } else {
                // Obtener precio vigente
                const responsePrecio = await PreciosService.getPrecioVigente(
                    productoPresentacionId,
                    this.estado.sucursalSeleccionada.id
                );

                if (!responsePrecio.success || !responsePrecio.data) {
                    this.mostrarError('No se pudo obtener el precio del producto');
                    return;
                }

                const precio = responsePrecio.data.precio_venta || 0;

                // Crear nuevo item en el carrito
                const producto = itemInventario.productoPresentacion?.producto || {};
                const presentacion = itemInventario.productoPresentacion?.presentacion || {};
                //cONVERTIR STRING A NUMERO
                
                this.estado.carrito.push({
                    producto_presentacion_id: productoPresentacionId,
                    codigo_sku: producto.codigo_sku,
                    nombre_completo: `${producto.descripcion} - ${presentacion.nombre}`,
                    cantidad: 1,
                    precio_unitario: parseFloat(precio),
                    stock_disponible: itemInventario.existencia,
                    subtotal: parseFloat(precio),
                    descuento_pct: 0
                });
                console.log(this.estado.carrito);
            }

            // Actualizar vista del carrito
            this.renderizarCarrito();
            this.calcularTotales();

            // Feedback visual
            this.mostrarExito('Producto agregado al carrito');

        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            this.mostrarError('Error al agregar el producto: ' + error.message);
        }
    },

    /**
 * Renderizar carrito
 */
    renderizarCarrito() {
        const container = document.getElementById('carritoItems');
        const carritoCount = document.getElementById('carritoCount');
        const carritoVacio = document.getElementById('carritoVacio');
        const btnLimpiar = document.getElementById('btnLimpiarCarrito');
        const btnFacturar = document.getElementById('btnFacturar');

        // Actualizar contador (con validación)
        if (carritoCount) {
            carritoCount.textContent = this.estado.carrito.length;
        }

        // Si el carrito está vacío
        if (this.estado.carrito.length === 0) {
            if (carritoVacio) {
                carritoVacio.style.display = 'block';
            }
            if (btnLimpiar) {
                btnLimpiar.style.display = 'none';
            }
            if (btnFacturar) {
                btnFacturar.disabled = true;
            }
            if (container) {
                container.innerHTML = '';
            }
            return;
        }

        // Si el carrito tiene items
        if (carritoVacio) {
            carritoVacio.style.display = 'none';
        }
        if (btnLimpiar) {
            btnLimpiar.style.display = 'block';
        }
        if (btnFacturar) {
            btnFacturar.disabled = false;
        }

        // Renderizar items (con validación del container)
        if (!container) {
            console.error('❌ No se encontró el contenedor del carrito');
            return;
        }

        container.innerHTML = '';

        this.estado.carrito.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'border rounded p-2 mb-2';
            itemDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-1">
                <small class="fw-bold">${item.nombre_completo}</small>
                <button class="btn btn-sm btn-link text-danger p-0" onclick="VentasController.eliminarDelCarrito(${index})" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-secondary" onclick="VentasController.decrementarCantidad(${index})">
                        <i class="bi bi-dash"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary" disabled style="min-width: 50px;">
                        ${item.cantidad}
                    </button>
                    <button type="button" class="btn btn-outline-secondary" onclick="VentasController.incrementarCantidad(${index})">
                        <i class="bi bi-plus"></i>
                    </button>
                </div>
                <small class="text-muted">Q${this.formatearMoneda(item.subtotal)}</small>
            </div>
            <small class="text-muted d-block mt-1">Q${this.formatearMoneda(item.precio_unitario)} c/u</small>
        `;
            container.appendChild(itemDiv);
        });
    },

    /**
     * Incrementar cantidad de un item
     */
    incrementarCantidad(index) {
        const item = this.estado.carrito[index];

        if (item.cantidad >= item.stock_disponible) {
            this.mostrarError('No hay más stock disponible');
            return;
        }

        item.cantidad++;
        item.subtotal = item.cantidad * item.precio_unitario;

        this.renderizarCarrito();
        this.calcularTotales();
    },

    /**
     * Decrementar cantidad de un item
     */
    decrementarCantidad(index) {
        const item = this.estado.carrito[index];

        if (item.cantidad <= 1) {
            this.eliminarDelCarrito(index);
            return;
        }

        item.cantidad--;
        item.subtotal = item.cantidad * item.precio_unitario;

        this.renderizarCarrito();
        this.calcularTotales();
    },

    /**
     * Eliminar item del carrito
     */
    eliminarDelCarrito(index) {
        this.estado.carrito.splice(index, 1);
        this.renderizarCarrito();
        this.calcularTotales();
    },

    /**
     * Limpiar carrito completo
     */
    limpiarCarrito() {
        if (this.estado.carrito.length === 0) return;

        if (confirm('¿Está seguro de limpiar el carrito?')) {
            this.estado.carrito = [];
            this.renderizarCarrito();
            this.calcularTotales();
            this.mostrarExito('Carrito limpiado');
        }
    },

    /**
     * Calcular totales
     */
    calcularTotales() {
        const subtotal = this.estado.carrito.reduce((sum, item) => sum + item.subtotal, 0);
        const descuento = 0; // Por ahora sin descuentos globales
        const total = subtotal - descuento;

        document.getElementById('subtotal').textContent = this.formatearMoneda(subtotal);
        document.getElementById('descuento').textContent = this.formatearMoneda(descuento);
        document.getElementById('total').textContent = this.formatearMoneda(total);
    },

    // ==================== CLIENTES ====================

    /**
     * Buscar clientes (debounced)
     */
    buscarClientesTimeout: null,

    buscarClientes(termino) {
        clearTimeout(this.buscarClientesTimeout);

        if (!termino || termino.length < 2) {
            document.getElementById('dropdownClientesBusqueda').style.display = 'none';
            return;
        }

        this.buscarClientesTimeout = setTimeout(async () => {
            try {
                const response = await ClientesService.buscarCliente(termino);

                if (response.success && response.data) {
                    this.mostrarResultadosBusquedaClientes(response.data);
                }
            } catch (error) {
                console.error('Error al buscar clientes:', error);
            }
        }, 300);
    },

    /**
     * Mostrar resultados de búsqueda de clientes
     */
    mostrarResultadosBusquedaClientes(cliente) {
        const dropdown = document.getElementById('dropdownClientesBusqueda');

        if (cliente.length === 0) {
            dropdown.innerHTML = '<div class="list-group-item text-muted">No se encontraron clientes</div>';
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = '';


        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action';
        item.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${cliente.nombre}</strong><br>
                        <small class="text-muted">NIT: ${cliente.nit}</small>
                    </div>
                </div>
            `;
        item.onclick = () => this.seleccionarCliente(cliente);
        dropdown.appendChild(item);


        dropdown.style.display = 'block';
    },

    /**
     * Seleccionar cliente
     */
    seleccionarCliente(cliente) {
        this.estado.clienteActivo = {
            id: cliente.id,
            nombre: cliente.nombre,
            nit: cliente.nit,
            email: cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            esCF: false
        };

        this.actualizarVistaCliente();

        // Limpiar búsqueda
        document.getElementById('inputBuscarCliente').value = '';
        document.getElementById('dropdownClientesBusqueda').style.display = 'none';

        this.mostrarExito('Cliente seleccionado');
    },

    /**
     * Actualizar vista de cliente seleccionado
     */
    actualizarVistaCliente() {
        const cliente = this.estado.clienteActivo;
        document.getElementById('clienteNombre').textContent = cliente.nombre;
        document.getElementById('clienteNit').textContent = cliente.nit;
    },

    /**
     * Abrir modal de nuevo cliente
     */
    abrirModalNuevoCliente() {
        const modal = new bootstrap.Modal(document.getElementById('modalClienteRapido'));
        modal.show();

        // Limpiar formulario
        document.getElementById('formClienteRapido').reset();
        document.getElementById('clienteNit').value = 'CF';
    },

    /**
     * Guardar nuevo cliente
     */
    async guardarNuevoCliente() {
        try {
            const form = document.getElementById('formClienteRapido');

            // Validar formulario
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const clienteData = {
                nombre: document.getElementById('clienteNombre').value,
                nit: document.getElementById('clienteNit').value,
                email: document.getElementById('clienteEmail').value,
                telefono: document.getElementById('clienteTelefono').value,
                direccion: document.getElementById('clienteDireccion').value
            };

            // Validar datos
            const validacion = ClientesService.validarDatosCliente(clienteData);

            if (!validacion.valido) {
                this.mostrarError(validacion.errores.join('<br>'));
                return;
            }

            // Mostrar loading en botón
            const btnGuardar = document.getElementById('btnGuardarCliente');
            btnGuardar.classList.add('loading');
            btnGuardar.disabled = true;

            // Crear cliente
            const response = await ClientesService.crearCliente(clienteData);

            if (response.success && response.data) {
                this.seleccionarCliente(response.data);

                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalClienteRapido'));
                modal.hide();

                this.mostrarExito('Cliente creado exitosamente');
            }
        } catch (error) {
            console.error('Error al crear cliente:', error);
            this.mostrarError('Error al crear el cliente: ' + error.message);
        } finally {
            const btnGuardar = document.getElementById('btnGuardarCliente');
            btnGuardar.classList.remove('loading');
            btnGuardar.disabled = false;
        }
    },

    // ==================== FACTURACIÓN ====================

    /**
     * Facturar venta
     */
    async facturar() {
        try {
            // Validaciones previas
            if (!this.estado.sucursalSeleccionada) {
                this.mostrarError('Debe seleccionar una sucursal');
                return;
            }

            if (this.estado.carrito.length === 0) {
                this.mostrarError('El carrito está vacío');
                return;
            }

            if (!this.estado.usuario) {
                this.mostrarError('Usuario no identificado');
                return;
            }

            // Confirmar facturación
            const total = this.estado.carrito.reduce((sum, item) => sum + item.subtotal, 0);

            if (!confirm(`¿Confirmar venta por Q${this.formatearMoneda(total)}?`)) {
                return;
            }

            // Validar stock antes de facturar
            const validacionStock = await VentasService.validarStock(
                this.estado.sucursalSeleccionada.id,
                this.estado.carrito.map(item => ({
                    producto_presentacion_id: item.producto_presentacion_id,
                    cantidad: item.cantidad
                }))
            );

            if (!validacionStock.valido) {
                let mensajeError = 'Errores de stock:<br>';
                validacionStock.errores.forEach(err => {
                    mensajeError += `- ${err.mensaje}<br>`;
                });
                this.mostrarError(mensajeError);
                return;
            }

            // Preparar datos de la factura
            const facturaData = {
                cliente_id: this.estado.clienteActivo.id || null,
                usuario_id: this.estado.usuario.id,
                sucursal_id: this.estado.sucursalSeleccionada.id,
                serie: 'A', // Hardcodeado
                items: this.estado.carrito.map(item => ({
                    producto_presentacion_id: item.producto_presentacion_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento_pct: item.descuento_pct || 0
                })),
                pagos: [
                    {
                        tipo: this.estado.metodoPago,
                        monto: total
                    }
                ]
            };

            // Mostrar loading
            const btnFacturar = document.getElementById('btnFacturar');
            btnFacturar.disabled = true;
            btnFacturar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

            // Crear factura
            const response = await VentasService.crearFactura(facturaData);

            if (response.success && response.data) {
                // Limpiar estado
                this.estado.carrito = [];
                this.cargarClienteCF();
                this.renderizarCarrito();
                this.calcularTotales();

                // Recargar inventario
                await this.onSucursalChange(this.estado.sucursalSeleccionada.id);

                // Mostrar modal de éxito
                this.mostrarModalFacturaExitosa(response.data);
            }

        } catch (error) {
            console.error('Error al facturar:', error);
            this.mostrarError('Error al crear la factura: ' + error.message);
        } finally {
            const btnFacturar = document.getElementById('btnFacturar');
            btnFacturar.disabled = false;
            btnFacturar.innerHTML = '<i class="bi bi-receipt"></i> FACTURAR';
        }
    },

    /**
     * Mostrar modal de factura exitosa
     */
    mostrarModalFacturaExitosa(factura) {
        // Llenar datos del modal
        document.getElementById('facturaNumeroCompleto').textContent = `A-${String(factura.numero).padStart(6, '0')}`;
        document.getElementById('facturaSerie').textContent = factura.serie || 'A';

        const fecha = new Date(factura.fecha_factura || factura.createdAt);
        document.getElementById('facturaFecha').textContent = this.formatearFecha(fecha);
        document.getElementById('facturaHora').textContent = this.formatearHora(fecha);

        document.getElementById('facturaCliente').textContent = factura.cliente?.nombre || 'CONSUMIDOR FINAL';
        document.getElementById('facturaClienteNit').textContent = factura.cliente?.nit || 'CF';
        document.getElementById('facturaTotal').textContent = this.formatearMoneda(factura.total);
        document.getElementById('facturaItemsCount').textContent = factura.detalles?.length || 0;
        document.getElementById('facturaMetodoPago').textContent = this.estado.metodoPago;

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('modalFacturaExitosa'));
        modal.show();

        // Configurar eventos del modal
        this.configurarEventosModalFactura(factura);
    },

    /**
     * Configurar eventos del modal de factura
     */
    configurarEventosModalFactura(factura) {
        // Ver detalle
        document.getElementById('btnVerDetalleFactura').onclick = () => {
            // Aquí podrías abrir otra vista o modal con el detalle completo
            console.log('Ver detalle:', factura);
        };

        // Imprimir
        document.getElementById('btnImprimirFactura').onclick = () => {
            VentasService.imprimirFactura(factura);
        };

        // Nueva venta
        document.getElementById('btnNuevaVenta').onclick = () => {
            // El modal se cierra automáticamente
        };
    },

    // ==================== EVENTOS ====================

    /**
     * Configurar todos los eventos del POS
     */
    configurarEventos() {
        // Sucursal
        document.getElementById('selectSucursal').addEventListener('change', (e) => {
            this.onSucursalChange(e.target.value);
        });

        // Búsqueda de productos
        document.getElementById('inputBuscarProducto').addEventListener('input', (e) => {
            this.buscarProductos(e.target.value);
        });

        document.getElementById('btnLimpiarBusqueda').addEventListener('click', () => {
            document.getElementById('inputBuscarProducto').value = '';
            this.buscarProductos('');
        });

        // Carrito
        document.getElementById('btnLimpiarCarrito').addEventListener('click', () => {
            this.limpiarCarrito();
        });

        // Cliente
        document.getElementById('inputBuscarCliente').addEventListener('input', (e) => {
            this.buscarClientes(e.target.value);
        });

        // Ocultar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('dropdownClientesBusqueda');
            const input = document.getElementById('inputBuscarCliente');
            if (!dropdown.contains(e.target) && e.target !== input) {
                dropdown.style.display = 'none';
            }
        });

        document.getElementById('btnNuevoCliente').addEventListener('click', () => {
            this.abrirModalNuevoCliente();
        });

        //document.getElementById('btnGuardarCliente').addEventListener('click', () => {
        // this.guardarNuevoCliente();
        //});

        // Método de pago
        document.getElementById('selectMetodoPago').addEventListener('change', (e) => {
            this.estado.metodoPago = e.target.value;
        });

        // Facturar
        document.getElementById('btnFacturar').addEventListener('click', () => {
            this.facturar();
        });

        // Limpiar todo
        document.getElementById('btnLimpiarTodo').addEventListener('click', () => {
            if (confirm('¿Está seguro de limpiar todo y reiniciar?')) {
                this.limpiarTodo();
            }
        });
    },

    /**
     * Limpiar todo el POS
     */
    limpiarTodo() {
        this.estado.carrito = [];
        this.cargarClienteCF();
        this.renderizarCarrito();
        this.calcularTotales();
        document.getElementById('inputBuscarProducto').value = '';
        document.getElementById('inputBuscarCliente').value = '';
        this.mostrarExito('POS reiniciado');
    },

    // ==================== UTILIDADES ====================

    /**
     * Mostrar loader de productos
     */
    mostrarLoaderProductos() {
        document.getElementById('productosLoader').style.display = 'block';
        document.getElementById('productosGrid').style.display = 'none';
    },

    /**
     * Ocultar loader de productos
     */
    ocultarLoaderProductos() {
        document.getElementById('productosLoader').style.display = 'none';
        document.getElementById('productosGrid').style.display = 'block';
    },

    /**
     * Formatear moneda
     */
    formatearMoneda(monto) {
        return parseFloat(monto || 0).toFixed(2);
    },

    /**
     * Formatear fecha
     */
    formatearFecha(fecha) {
        const d = new Date(fecha);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    /**
     * Formatear hora
     */
    formatearHora(fecha) {
        const d = new Date(fecha);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    /**
     * Mostrar mensaje de éxito
     */
    mostrarExito(mensaje) {
        // Usar Bootstrap Toast o alert personalizado
        console.log('✅', mensaje);
        // TODO: Implementar toast notification
    },

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        console.error('❌', mensaje);
        alert(mensaje); // Por ahora usar alert, luego mejorar con toast
    }
};

// ==================== INICIALIZACIÓN ====================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VentasController.init();
    });
} else {
    VentasController.init();
}

// Hacer disponible globalmente
window.VentasController = VentasController;