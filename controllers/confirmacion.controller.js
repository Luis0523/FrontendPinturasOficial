
const ConfirmacionController = {
    
    estado: {
        numeroPedido: null
    },

    

    async init() {
        console.log('⚙️ Inicializando Confirmación...');

        
        const urlParams = new URLSearchParams(window.location.search);
        this.estado.numeroPedido = urlParams.get('pedido');

        if (!this.estado.numeroPedido) {
            
            alert('No se encontró información del pedido');
            window.location.href = 'catalogo.html';
            return;
        }

        
        document.getElementById('numeroPedido').textContent = `#${this.estado.numeroPedido}`;

        
        const ahora = new Date();
        const opciones = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('fechaPedido').textContent = ahora.toLocaleDateString('es-GT', opciones);

        
        this.cargarDatosPedido();

        
        this.crearConfetti();

        console.log('✅ Confirmación inicializada');
    },

    

    cargarDatosPedido() {
        try {
            
            const ultimoPedido = localStorage.getItem('ultimo_pedido');

            if (ultimoPedido) {
                const datos = JSON.parse(ultimoPedido);

                
                if (datos.email_cliente) {
                    document.getElementById('emailCliente').textContent = datos.email_cliente;
                }

                
                if (datos.total) {
                    document.getElementById('totalPedido').textContent = parseFloat(datos.total).toFixed(2);
                }

                
                if (datos.direccion_envio) {
                    document.getElementById('direccionEnvio').textContent = datos.direccion_envio;
                }

                if (datos.ciudad_envio && datos.departamento_envio) {
                    document.getElementById('ciudadDepartamento').textContent =
                        `${datos.ciudad_envio}, ${datos.departamento_envio}`;
                }

                
                localStorage.removeItem('ultimo_pedido');
            } else {
                
                this.obtenerPedidoDelBackend();
            }
        } catch (error) {
            console.error('Error al cargar datos del pedido:', error);
        }
    },

    async obtenerPedidoDelBackend() {
        try {
            
            console.log('Intentando obtener pedido del backend...');
            
            
        } catch (error) {
            console.error('Error al obtener pedido:', error);
        }
    },

    

    crearConfetti() {
        const colores = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
        const cantidad = 50;

        for (let i = 0; i < cantidad; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';

                document.body.appendChild(confetti);

                
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 100);
        }
    }
};




document.addEventListener('DOMContentLoaded', () => {
    ConfirmacionController.init();
});


window.ConfirmacionController = ConfirmacionController;
