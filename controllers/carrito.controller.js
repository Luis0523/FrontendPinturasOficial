
const CarritoController = {
    
    estado: {
        carrito: [], 
        sucursal: null, 
    },

    

    init() {
        this.cargarCarritoDesdeStorage();
        this.actualizarContadorCarrito();
    },

    

    agregarAlCarrito(producto) {
        try {
            
            if (producto.existencia <= 0) {
                this.mostrarNotificacion('No hay stock disponible', 'warning');
                return false;
            }

            
            const itemExistente = this.estado.carrito.find(
                item => item.producto_presentacion_id === producto.producto_presentacion_id
            );

            if (itemExistente) {
                
                if (itemExistente.cantidad + 1 > producto.existencia) {
                    this.mostrarNotificacion(`Stock máximo: ${producto.existencia}`, 'warning');
                    return false;
                }

                
                itemExistente.cantidad++;
                itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio_unitario;
            } else {
                
                const precio = this.obtenerPrecioVigente(producto);

                
                const nuevoItem = {
                    producto_presentacion_id: producto.producto_presentacion_id,
                    codigo_sku: producto.productoPresentacion.producto.codigo_sku,
                    nombre_completo: `${producto.productoPresentacion.producto.descripcion} - ${producto.productoPresentacion.presentacion.nombre}`,
                    color: producto.productoPresentacion.producto.color || 'N/A',
                    cantidad: 1,
                    precio_unitario: precio,
                    stock_disponible: producto.existencia,
                    subtotal: precio,
                    descuento_pct: 0
                };

                this.estado.carrito.push(nuevoItem);
            }

            
            if (!this.estado.sucursal && producto.sucursal) {
                this.estado.sucursal = producto.sucursal;
            }

            
            this.guardarCarritoEnStorage();

            
            this.actualizarContadorCarrito();

            
            this.mostrarNotificacion('Producto agregado al carrito', 'success');

            return true;
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            this.mostrarNotificacion('Error al agregar producto', 'danger');
            return false;
        }
    },

    actualizarCantidad(producto_presentacion_id, nuevaCantidad) {
        const item = this.estado.carrito.find(
            i => i.producto_presentacion_id === producto_presentacion_id
        );

        if (!item) return false;

        
        if (nuevaCantidad <= 0) {
            return this.eliminarDelCarrito(producto_presentacion_id);
        }

        if (nuevaCantidad > item.stock_disponible) {
            this.mostrarNotificacion(`Stock máximo: ${item.stock_disponible}`, 'warning');
            return false;
        }

        
        item.cantidad = nuevaCantidad;
        item.subtotal = item.cantidad * item.precio_unitario;

        this.guardarCarritoEnStorage();
        return true;
    },

    eliminarDelCarrito(producto_presentacion_id) {
        this.estado.carrito = this.estado.carrito.filter(
            item => item.producto_presentacion_id !== producto_presentacion_id
        );

        this.guardarCarritoEnStorage();
        this.actualizarContadorCarrito();
        this.mostrarNotificacion('Producto eliminado del carrito', 'info');

        return true;
    },

    vaciarCarrito() {
        this.estado.carrito = [];
        this.estado.sucursal = null;
        this.guardarCarritoEnStorage();
        this.actualizarContadorCarrito();
    },

    getCarrito() {
        return {
            items: this.estado.carrito,
            sucursal: this.estado.sucursal,
            totales: this.calcularTotales()
        };
    },

    calcularTotales() {
        let subtotal = 0;
        let descuento_total = 0;

        this.estado.carrito.forEach(item => {
            const subtotal_item = item.cantidad * item.precio_unitario;
            const descuento_item = subtotal_item * (item.descuento_pct / 100);

            subtotal += subtotal_item;
            descuento_total += descuento_item;
        });

        const total = subtotal - descuento_total;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            descuento_total: parseFloat(descuento_total.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            cantidad_items: this.estado.carrito.reduce((sum, item) => sum + item.cantidad, 0)
        };
    },

    

    guardarCarritoEnStorage() {
        try {
            localStorage.setItem('carrito', JSON.stringify(this.estado.carrito));
            localStorage.setItem('carrito_sucursal', JSON.stringify(this.estado.sucursal));
        } catch (error) {
            console.error('Error al guardar carrito:', error);
        }
    },

    cargarCarritoDesdeStorage() {
        try {
            const carritoGuardado = localStorage.getItem('carrito');
            const sucursalGuardada = localStorage.getItem('carrito_sucursal');

            if (carritoGuardado) {
                this.estado.carrito = JSON.parse(carritoGuardado);
            }

            if (sucursalGuardada) {
                this.estado.sucursal = JSON.parse(sucursalGuardada);
            }
        } catch (error) {
            console.error('Error al cargar carrito:', error);
            this.estado.carrito = [];
            this.estado.sucursal = null;
        }
    },

    

    actualizarContadorCarrito() {
        const contador = document.getElementById('carritoContador');
        if (!contador) return;

        const totalItems = this.estado.carrito.reduce((sum, item) => sum + item.cantidad, 0);

        if (totalItems > 0) {
            contador.textContent = totalItems;
            contador.style.display = 'inline-block';
        } else {
            contador.style.display = 'none';
        }
    },

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
    },

    

    obtenerPrecioVigente(producto) {
        if (producto.precios && producto.precios.length > 0) {
            return parseFloat(producto.precios[0].precio_venta);
        }
        return 0;
    },

    estaVacio() {
        return this.estado.carrito.length === 0;
    },

    getCantidadTotal() {
        return this.estado.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    }
};


document.addEventListener('DOMContentLoaded', () => {
    CarritoController.init();
});
