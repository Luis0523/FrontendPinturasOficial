/**
 * =====================================================
 * CATÁLOGO CONTROLLER - VISTA PÚBLICA
 * =====================================================
 * Controller para manejar el catálogo público de productos
 *
 * Funcionalidades:
 * - Carga de inventario por sucursal
 * - Vista de detalles de productos
 * - Búsqueda de productos
 * - Consulta por WhatsApp
 * =====================================================
 */

const CatalogoController = {
    // ==================== ESTADO ====================
    estado: {
        sucursalSeleccionada: null,
        inventario: [],
        inventarioFiltrado: [],
        productoSeleccionado: null,
        terminoBusqueda: '',
        numeroWhatsApp: '50232013122'
    },

    // ==================== INICIALIZACIÓN ====================

    /**
     * Inicializar el catálogo
     */
    async init() {
        try {
            console.log('⚙️ Inicializando Catálogo Público...');

            // Cargar sucursales
            await this.cargarSucursales();

            // Configurar eventos
            this.configurarEventos();

            console.log('✅ Catálogo inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar catálogo:', error);
            this.mostrarError('Error al inicializar el catálogo');
        }
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
                if (!select) {
                    console.error('No se encontró el elemento selectSucursal');
                    return;
                }

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

            // Mostrar loader
            this.mostrarLoader();
            const mensajeInicial = document.getElementById('mensajeInicial');
            if (mensajeInicial) {
                mensajeInicial.style.display = 'none';
            }

            // Habilitar búsqueda
            const inputBuscar = document.getElementById('inputBuscarProducto');
            const btnLimpiar = document.getElementById('btnLimpiarBusqueda');

            if (inputBuscar) inputBuscar.disabled = false;
            if (btnLimpiar) btnLimpiar.disabled = false;

            // Cargar inventario de la sucursal
            const response = await InventarioService.getInventarioSucursal(sucursalId);

            if (response.success && response.data) {
                const selectSucursal = document.getElementById('selectSucursal');
                this.estado.sucursalSeleccionada = {
                    id: parseInt(sucursalId),
                    nombre: selectSucursal ? selectSucursal.selectedOptions[0].text : 'Sucursal'
                };

                this.estado.inventario = response.data;
                this.estado.inventarioFiltrado = response.data;

                // Actualizar estadísticas
                this.actualizarEstadisticas();

                // Renderizar productos
                this.renderizarProductos();

                // Mostrar estadísticas
                const statsContainer = document.getElementById('statsContainer');
                if (statsContainer) {
                    statsContainer.style.display = 'flex';
                }

                console.log(`📦 Inventario cargado: ${response.data.length} productos`);
            }
        } catch (error) {
            console.error('Error al cargar inventario:', error);
            this.mostrarError('Error al cargar el inventario');
        } finally {
            this.ocultarLoader();
        }
    },

    // ==================== PRODUCTOS ====================

    /**
     * Renderizar productos en el grid
     */
    renderizarProductos() {
        const grid = document.getElementById('productosGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.estado.inventarioFiltrado.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search" style="font-size: 5rem; color: var(--texto-claro);"></i>
                    <h3 class="mt-3" style="color: var(--texto-medio);">No se encontraron productos</h3>
                    <p style="color: var(--texto-claro);">Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        // Renderizar cada producto
        this.estado.inventarioFiltrado.forEach(item => {
            const card = this.crearCardProducto(item);
            grid.appendChild(card);
        });
    },

    /**
     * Crear card de producto
     */
    crearCardProducto(item) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3';

        const producto = item.productoPresentacion?.producto || {};
        const presentacion = item.productoPresentacion?.presentacion || {};

        // Determinar estado del stock
        let badgeClass = 'disponible';
        let badgeText = 'Disponible';
        let btnDisabled = '';

        if (item.existencia === 0) {
            badgeClass = 'agotado';
            badgeText = 'Agotado';
            btnDisabled = 'disabled';
        } else if (item.estado === 'BAJO') {
            badgeClass = 'stock-bajo';
            badgeText = 'Stock Bajo';
        }

        // Imagen del producto
        const imagenUrl = producto.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+Imagen';

        col.innerHTML = `
            <div class="producto-card">
                <div class="position-relative">
                    <div class="producto-imagen" style="overflow: hidden; height: 200px; background: var(--blanco-suave);">
                        <img src="${imagenUrl}"
                             alt="${producto.descripcion || 'Producto'}"
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                    </div>
                    <span class="producto-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-body">
                    <small class="text-muted d-block mb-1">
                        <i class="bi bi-upc"></i> ${producto.codigo_sku || 'N/A'}
                    </small>
                    <h5 class="producto-title">${producto.descripcion || 'Producto'}</h5>
                    <p class="producto-descripcion mb-2">
                        <strong>${presentacion.nombre || 'N/A'}</strong>
                        ${producto.color ? `<br><small><i class="bi bi-palette"></i> ${producto.color}</small>` : ''}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <small class="text-muted">
                            <i class="bi bi-box-seam"></i> Stock: <strong>${item.existencia}</strong>
                        </small>
                    </div>
                    <div class="d-flex gap-2">
                        <button
                            class="btn btn-outline-secondary flex-grow-1"
                            onclick="CatalogoController.verDetalleProducto(${item.producto_presentacion_id})"
                            ${btnDisabled}
                        >
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button
                            class="btn btn-agregar flex-grow-1"
                            onclick="CatalogoController.agregarAlCarrito(${item.producto_presentacion_id})"
                            ${btnDisabled}
                        >
                            <i class="bi bi-cart-plus"></i> Agregar
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

        const elemDisponibles = document.getElementById('statsProductosDisponibles');
        const elemStockBajo = document.getElementById('statsStockBajo');
        const elemAgotados = document.getElementById('statsAgotados');

        if (elemDisponibles) elemDisponibles.textContent = disponibles;
        if (elemStockBajo) elemStockBajo.textContent = stockBajo;
        if (elemAgotados) elemAgotados.textContent = agotados;
    },

    // ==================== DETALLE DE PRODUCTO ====================

    /**
     * Ver detalle de un producto
     */
    async verDetalleProducto(productoPresentacionId) {
        try {
            // Buscar el producto en el inventario
            const itemInventario = this.estado.inventario.find(
                i => i.producto_presentacion_id === productoPresentacionId
            );

            if (!itemInventario) {
                this.mostrarError('Producto no encontrado');
                return;
            }

            // Obtener precio vigente
            const responsePrecio = await PreciosService.getPrecioVigente(
                productoPresentacionId,
                this.estado.sucursalSeleccionada.id
            );

            const producto = itemInventario.productoPresentacion?.producto || {};
            const presentacion = itemInventario.productoPresentacion?.presentacion || {};
            const precio = responsePrecio.success && responsePrecio.data ? responsePrecio.data.precio_venta : 0;

            // Guardar producto seleccionado
            this.estado.productoSeleccionado = {
                producto_presentacion_id: productoPresentacionId,
                codigo_sku: producto.codigo_sku,
                descripcion: producto.descripcion,
                color: producto.color || 'N/A',
                presentacion: presentacion.nombre,
                existencia: itemInventario.existencia,
                estado: itemInventario.estado,
                precio: parseFloat(precio)
            };

            // Mostrar modal con detalles
            this.mostrarModalDetalle();

        } catch (error) {
            console.error('Error al cargar detalle:', error);
            this.mostrarError('Error al cargar los detalles del producto');
        }
    },

    /**
     * Mostrar modal con detalle del producto
     */
    mostrarModalDetalle() {
        const prod = this.estado.productoSeleccionado;
        if (!prod) return;

        // Actualizar contenido del modal
        const detalleSku = document.getElementById('detalle_sku');
        const detalleDescripcion = document.getElementById('detalle_descripcion');
        const detallePresentacion = document.getElementById('detalle_presentacion');
        const detalleColor = document.getElementById('detalle_color');
        const detalleStock = document.getElementById('detalle_stock');
        const detalleSucursal = document.getElementById('detalle_sucursal');
        const detalleEstado = document.getElementById('detalle_estado');

        if (detalleSku) detalleSku.textContent = prod.codigo_sku || '-';
        if (detalleDescripcion) detalleDescripcion.textContent = prod.descripcion || '-';
        if (detallePresentacion) detallePresentacion.textContent = prod.presentacion || '-';
        if (detalleColor) detalleColor.textContent = prod.color || '-';
        if (detalleStock) detalleStock.textContent = prod.existencia;
        if (detalleSucursal) detalleSucursal.textContent = this.estado.sucursalSeleccionada?.nombre || '-';

        // Estado con badge
        let badgeClass = 'badge bg-success';
        let badgeText = 'Disponible';

        if (prod.existencia === 0) {
            badgeClass = 'badge bg-secondary';
            badgeText = 'Agotado';
        } else if (prod.estado === 'BAJO') {
            badgeClass = 'badge bg-warning';
            badgeText = 'Stock Bajo';
        }

        if (detalleEstado) {
            detalleEstado.innerHTML = `<span class="${badgeClass}">${badgeText}</span>`;
        }

        // Abrir modal
        const modalElement = document.getElementById('modalDetalleProducto');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    },

    /**
     * Enviar consulta por WhatsApp
     */
    enviarWhatsApp() {
        const prod = this.estado.productoSeleccionado;
        if (!prod) {
            this.mostrarError('No hay producto seleccionado');
            return;
        }

        // Crear mensaje personalizado
        let mensaje = 'Hola, me interesa el siguiente producto:\n\n';
        mensaje += `📦 Producto: ${prod.descripcion}\n`;
        mensaje += `🏷️ SKU: ${prod.codigo_sku}\n`;
        mensaje += `📏 Presentación: ${prod.presentacion}\n`;
        mensaje += `🎨 Color: ${prod.color}\n`;
        mensaje += `🏪 Sucursal: ${this.estado.sucursalSeleccionada?.nombre}\n`;
        mensaje += `📊 Stock disponible: ${prod.existencia} unidades\n\n`;
        mensaje += '¿Podrían brindarme más información y el precio?';

        const url = `https://wa.me/${this.estado.numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

        // Abrir WhatsApp en nueva ventana
        window.open(url, '_blank');

        // Cerrar modal
        const modalElement = document.getElementById('modalDetalleProducto');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    },

    // ==================== CARRITO ====================

    /**
     * Agregar producto al carrito
     */
    agregarAlCarrito(productoPresentacionId) {
        try {
            // Buscar el producto en el inventario
            const itemInventario = this.estado.inventario.find(
                i => i.producto_presentacion_id === productoPresentacionId
            );

            if (!itemInventario) {
                this.mostrarError('Producto no encontrado');
                return;
            }

            // Verificar si hay stock
            if (itemInventario.existencia <= 0) {
                this.mostrarNotificacion('No hay stock disponible', 'warning');
                return;
            }

            // Agregar información de sucursal al producto
            const productoConSucursal = {
                ...itemInventario,
                sucursal: this.estado.sucursalSeleccionada
            };

            // Usar el CarritoController para agregar al carrito
            const agregado = CarritoController.agregarAlCarrito(productoConSucursal);

            if (agregado) {
                console.log('✅ Producto agregado al carrito');
            }
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            this.mostrarNotificacion('Error al agregar producto al carrito', 'danger');
        }
    },

    // ==================== EVENTOS ====================

    /**
     * Configurar todos los eventos
     */
    configurarEventos() {
        // Sucursal
        const selectSucursal = document.getElementById('selectSucursal');
        if (selectSucursal) {
            selectSucursal.addEventListener('change', (e) => {
                this.onSucursalChange(e.target.value);
            });
        }

        // Búsqueda de productos
        const inputBuscar = document.getElementById('inputBuscarProducto');
        if (inputBuscar) {
            inputBuscar.addEventListener('input', (e) => {
                this.buscarProductos(e.target.value);
            });
        }

        const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                if (inputBuscar) inputBuscar.value = '';
                this.buscarProductos('');
            });
        }

        // WhatsApp
        const btnWhatsApp = document.getElementById('btnContactarWhatsApp');
        if (btnWhatsApp) {
            btnWhatsApp.addEventListener('click', () => {
                this.enviarWhatsApp();
            });
        }
    },

    // ==================== UTILIDADES ====================

    /**
     * Mostrar loader
     */
    mostrarLoader() {
        const loader = document.getElementById('productosLoader');
        const grid = document.getElementById('productosGrid');

        if (loader) loader.style.display = 'flex';
        if (grid) grid.style.display = 'none';
    },

    /**
     * Ocultar loader
     */
    ocultarLoader() {
        const loader = document.getElementById('productosLoader');
        const grid = document.getElementById('productosGrid');

        if (loader) loader.style.display = 'none';
        if (grid) grid.style.display = 'block';
    },

    /**
     * Formatear moneda
     */
    formatearMoneda(monto) {
        return parseFloat(monto || 0).toFixed(2);
    },

    /**
     * Mostrar mensaje de éxito
     */
    mostrarExito(mensaje) {
        console.log('✅', mensaje);
        this.mostrarNotificacion(mensaje, 'success');
    },

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        console.error('❌', mensaje);
        this.mostrarNotificacion(mensaje, 'danger');
    },

    /**
     * Mostrar notificación toast
     */
    mostrarNotificacion(mensaje, tipo = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.log(`${tipo.toUpperCase()}: ${mensaje}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${mensaje}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
};

// ==================== INICIALIZACIÓN ====================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CatalogoController.init();
    });
} else {
    CatalogoController.init();
}

// Hacer disponible globalmente
window.CatalogoController = CatalogoController;
