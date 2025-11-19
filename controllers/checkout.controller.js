
const CheckoutController = {
    
    estado: {
        carrito: null,
        procesando: false
    },

    

    init() {
        console.log('⚙️ Inicializando Checkout...');

        
        this.estado.carrito = CarritoController.getCarrito();

        
        if (CarritoController.estaVacio()) {
            this.mostrarCarritoVacio();
            return;
        }

        
        this.renderizarResumen();

        
        this.configurarEventos();

        console.log('✅ Checkout inicializado');
    },

    

    mostrarCarritoVacio() {
        document.getElementById('carritoVacio').style.display = 'block';
        document.getElementById('checkoutContent').style.display = 'none';
    },

    renderizarResumen() {
        const resumenItems = document.getElementById('resumenItems');
        if (!resumenItems) return;

        resumenItems.innerHTML = '';

        this.estado.carrito.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'mb-3 pb-3 border-bottom';
            itemDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.nombre_completo}</h6>
                        <small class="text-muted">${item.codigo_sku}</small>
                        <div class="mt-1">
                            <small class="text-muted">
                                ${item.cantidad} x Q. ${item.precio_unitario.toFixed(2)}
                            </small>
                        </div>
                    </div>
                    <div class="text-end">
                        <strong>Q. ${item.subtotal.toFixed(2)}</strong>
                        <div class="mt-1">
                            <button class="btn btn-sm btn-outline-danger" onclick="CheckoutController.eliminarItem(${item.producto_presentacion_id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            resumenItems.appendChild(itemDiv);
        });

        
        this.actualizarTotales();
    },

    actualizarTotales() {
        const totales = this.estado.carrito.totales;

        document.getElementById('resumenSubtotal').textContent = totales.subtotal.toFixed(2);
        document.getElementById('resumenDescuento').textContent = totales.descuento_total.toFixed(2);
        document.getElementById('resumenTotal').textContent = totales.total.toFixed(2);
        document.getElementById('resumenCantidad').textContent = totales.cantidad_items;
    },

    

    eliminarItem(producto_presentacion_id) {
        if (confirm('¿Deseas eliminar este producto del carrito?')) {
            CarritoController.eliminarDelCarrito(producto_presentacion_id);
            this.estado.carrito = CarritoController.getCarrito();

            if (CarritoController.estaVacio()) {
                this.mostrarCarritoVacio();
            } else {
                this.renderizarResumen();
            }
        }
    },

    async procesarPedido() {
        try {
            
            if (!this.validarFormulario()) {
                return;
            }

            
            this.mostrarLoader();
            this.estado.procesando = true;

            
            const datosFormulario = this.recopilarDatosFormulario();

            
            const pedidoData = {
                
                nombre_cliente: datosFormulario.nombre_cliente,
                email_cliente: datosFormulario.email_cliente,
                telefono_cliente: datosFormulario.telefono_cliente,
                nit_cliente: datosFormulario.nit_cliente,

                
                direccion_envio: datosFormulario.direccion_envio,
                ciudad_envio: datosFormulario.ciudad_envio,
                departamento_envio: datosFormulario.departamento_envio,
                codigo_postal: datosFormulario.codigo_postal || null,
                referencias_direccion: datosFormulario.referencias_direccion || null,

                
                sucursal_id: this.estado.carrito.sucursal.id,

                
                items: this.estado.carrito.items.map(item => ({
                    producto_presentacion_id: item.producto_presentacion_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento_pct: item.descuento_pct
                })),

                
                pagos: [{
                    tipo: datosFormulario.tipo_pago,
                    monto: this.estado.carrito.totales.total,
                    referencia: datosFormulario.referencia_pago || null,
                    entidad: null,
                    transaccion_gateway_id: null,
                    autorizado_por: null
                }],

                
                notas_cliente: datosFormulario.notas_cliente || null
            };

            console.log('📤 Enviando pedido:', pedidoData);

            
            const response = await PedidosService.crearPedido(pedidoData);

            if (response.success) {
                console.log('✅ Pedido creado:', response.data);

                
                const datosConfirmacion = {
                    numero: response.data.numero,
                    email_cliente: datosFormulario.email_cliente,
                    total: this.estado.carrito.totales.total,
                    direccion_envio: datosFormulario.direccion_envio,
                    ciudad_envio: datosFormulario.ciudad_envio,
                    departamento_envio: datosFormulario.departamento_envio
                };
                localStorage.setItem('ultimo_pedido', JSON.stringify(datosConfirmacion));

                
                CarritoController.vaciarCarrito();

                
                window.location.href = `confirmacion.html?pedido=${response.data.numero}`;
            } else {
                throw new Error(response.message || 'Error al crear el pedido');
            }

        } catch (error) {
            console.error('Error al procesar pedido:', error);

            let mensaje = 'Error al procesar el pedido. Por favor, intenta nuevamente.';

            if (error.message) {
                mensaje = error.message;
            } else if (error.response?.data?.message) {
                mensaje = error.response.data.message;
            }

            this.mostrarNotificacion(mensaje, 'danger');

        } finally {
            this.ocultarLoader();
            this.estado.procesando = false;
        }
    },

    

    validarFormulario() {
        const campos = [
            { id: 'nombre_cliente', nombre: 'Nombre completo' },
            { id: 'telefono_cliente', nombre: 'Teléfono' },
            { id: 'email_cliente', nombre: 'Email' },
            { id: 'direccion_envio', nombre: 'Dirección de envío' },
            { id: 'ciudad_envio', nombre: 'Ciudad' },
            { id: 'departamento_envio', nombre: 'Departamento' },
            { id: 'tipo_pago', nombre: 'Método de pago' }
        ];

        for (const campo of campos) {
            const elemento = document.getElementById(campo.id);
            if (!elemento || !elemento.value.trim()) {
                this.mostrarNotificacion(`Por favor completa el campo: ${campo.nombre}`, 'warning');
                elemento?.focus();
                return false;
            }
        }

        
        const email = document.getElementById('email_cliente').value;
        if (!this.validarEmail(email)) {
            this.mostrarNotificacion('Por favor ingresa un email válido', 'warning');
            document.getElementById('email_cliente').focus();
            return false;
        }

        return true;
    },

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    recopilarDatosFormulario() {
        return {
            nombre_cliente: document.getElementById('nombre_cliente').value.trim(),
            email_cliente: document.getElementById('email_cliente').value.trim(),
            telefono_cliente: document.getElementById('telefono_cliente').value.trim(),
            nit_cliente: document.getElementById('nit_cliente').value.trim() || 'CF',
            direccion_envio: document.getElementById('direccion_envio').value.trim(),
            ciudad_envio: document.getElementById('ciudad_envio').value.trim(),
            departamento_envio: document.getElementById('departamento_envio').value.trim(),
            codigo_postal: document.getElementById('codigo_postal').value.trim(),
            referencias_direccion: document.getElementById('referencias_direccion').value.trim(),
            tipo_pago: document.getElementById('tipo_pago').value,
            referencia_pago: document.getElementById('referencia_pago').value.trim(),
            notas_cliente: document.getElementById('notas_cliente').value.trim()
        };
    },

    

    configurarEventos() {
        
        const selectTipoPago = document.getElementById('tipo_pago');
        if (selectTipoPago) {
            selectTipoPago.addEventListener('change', (e) => {
                this.onTipoPagoChange(e.target.value);
            });
        }
    },

    onTipoPagoChange(tipoPago) {
        const infoDiv = document.getElementById('infoMetodoPago');
        const textInfo = document.getElementById('textInfoPago');

        if (!tipoPago) {
            infoDiv.style.display = 'none';
            return;
        }

        infoDiv.style.display = 'block';

        let mensaje = '';
        switch(tipoPago) {
            case 'TARJETA_CREDITO':
            case 'TARJETA_DEBITO':
                mensaje = 'Te contactaremos para procesar el pago con tarjeta de forma segura.';
                break;
            case 'TRANSFERENCIA':
                mensaje = 'Realiza la transferencia a nuestra cuenta bancaria. Te enviaremos los datos por correo electrónico.';
                break;
            case 'DEPOSITO':
                mensaje = 'Realiza el depósito en cualquiera de nuestras cuentas. Te enviaremos los datos por correo electrónico.';
                break;
        }

        textInfo.textContent = mensaje;
    },

    

    mostrarLoader() {
        const loader = document.getElementById('checkoutLoader');
        if (loader) loader.style.display = 'flex';
    },

    ocultarLoader() {
        const loader = document.getElementById('checkoutLoader');
        if (loader) loader.style.display = 'none';
    },

    mostrarNotificacion(mensaje, tipo = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            alert(mensaje);
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




document.addEventListener('DOMContentLoaded', () => {
    CheckoutController.init();
});


window.CheckoutController = CheckoutController;
