/**
 * Controlador del Dashboard
 * Maneja la lógica de la vista del dashboard
 */

const DashboardController = {
    // Instancias de gráficos
    ventasChart: null,

    /**
     * Inicializar el dashboard
     */
    async init() {
        // Verificar autenticación
        if (!AuthService.requireAuth()) {
            return;
        }

        // Cargar layout
        await loadLayout();

        // Cargar datos
        await this.loadData();
    },

    /**
     * Cargar todos los datos del dashboard
     */
    async loadData() {
        try {
            Loader.show('Cargando dashboard...');

            // Cargar datos en paralelo para mayor velocidad
            await Promise.all([
                this.loadVentasHoy(),
                this.loadStockBajo(),
                this.loadVentasChart(),
                this.loadTopProductos(),
                this.loadActividadReciente(),
                this.loadAlertasStock()
            ]);

            Loader.hide();
        } catch (error) {
            Loader.hide();
            console.error('Error cargando dashboard:', error);
            Alerts.error('Error al cargar los datos del dashboard');
        }
    },

    /**
     * Cargar ventas del día
     */
    async loadVentasHoy() {
        try {
            // Por ahora usamos datos de ejemplo
            // Cuando tengas el endpoint listo, usa: const data = await DashboardService.getVentasHoy();
            
            const data = {
                total: 5250.00,
                cantidad: 12,
                cambio: 15.5
            };

            document.getElementById('ventasHoyTotal').textContent = Formatter.currency(data.total);
            document.getElementById('ventasHoyCantidad').textContent = data.cantidad;

            if (data.cambio) {
                const changeElement = document.getElementById('ventasHoyChange');
                changeElement.style.display = 'block';
                changeElement.classList.toggle('positive', data.cambio >= 0);
                changeElement.classList.toggle('negative', data.cambio < 0);
                changeElement.querySelector('i').className = data.cambio >= 0 ? 'bi bi-arrow-up' : 'bi bi-arrow-down';
                changeElement.querySelector('span').textContent = `${Math.abs(data.cambio).toFixed(1)}%`;
            }
        } catch (error) {
            console.error('Error cargando ventas del día:', error);
        }
    },

    /**
     * Cargar productos con stock bajo
     */
    async loadStockBajo() {
        try {
            // Datos de ejemplo
            const data = { cantidad: 8 };
            
            document.getElementById('stockBajoCantidad').textContent = data.cantidad;
        } catch (error) {
            console.error('Error cargando stock bajo:', error);
        }
    },

    /**
     * Cargar gráfico de ventas
     */
    async loadVentasChart() {
        try {
            // Datos de ejemplo de los últimos 7 días
            const data = {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                valores: [1200, 1900, 1500, 2200, 2800, 2100, 1800]
            };

            const ctx = document.getElementById('ventasChart');
            
            // Destruir gráfico anterior si existe
            if (this.ventasChart) {
                this.ventasChart.destroy();
            }

            // Crear nuevo gráfico
            this.ventasChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Ventas',
                        data: data.valores,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#0d6efd',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                label: function(context) {
                                    return 'Ventas: Q ' + context.parsed.y.toLocaleString('es-GT', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    });
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Q ' + value.toLocaleString('es-GT');
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error cargando gráfico de ventas:', error);
        }
    },

    /**
     * Cargar top productos
     */
    async loadTopProductos() {
        try {
            // Datos de ejemplo
            const productos = [
                { nombre: 'Pintura Látex Blanco 1G', cantidad: 45, monto: 6750.00 },
                { nombre: 'Esmalte Rojo 1/4G', cantidad: 38, monto: 5700.00 },
                { nombre: 'Pintura Acrílica Azul', cantidad: 32, monto: 4800.00 },
                { nombre: 'Barniz Transparente 1G', cantidad: 28, monto: 4200.00 },
                { nombre: 'Pintura de Aceite Negro', cantidad: 25, monto: 3750.00 }
            ];

            const container = document.getElementById('topProductosContainer');
            
            if (productos.length === 0) {
                container.innerHTML = `
                    <div class="empty-state py-4">
                        <i class="bi bi-inbox"></i>
                        <p class="text-muted mb-0">No hay datos de productos vendidos</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = productos.map((producto, index) => `
                <div class="d-flex align-items-center mb-3 pb-3 ${index < productos.length - 1 ? 'border-bottom' : ''}">
                    <div class="me-3">
                        <div class="product-rank rank-${index + 1}">
                            ${index + 1}
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-semibold text-truncate">${producto.nombre}</div>
                        <small class="text-muted">${producto.cantidad} unidades</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary">${Formatter.currency(producto.monto)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando top productos:', error);
        }
    },

    /**
     * Cargar actividad reciente
     */
    async loadActividadReciente() {
        try {
            // Datos de ejemplo
            const actividades = [
                { 
                    tipo: 'venta', 
                    titulo: 'Nueva venta', 
                    descripcion: 'Factura A-1050 por Q 1,250.00', 
                    tiempo: '5 min',
                    icono: 'cart-check',
                    color: 'success'
                },
                { 
                    tipo: 'stock', 
                    titulo: 'Stock bajo', 
                    descripcion: 'Pintura Látex Blanco tiene 5 unidades', 
                    tiempo: '15 min',
                    icono: 'exclamation-triangle',
                    color: 'warning'
                },
                { 
                    tipo: 'compra', 
                    titulo: 'Orden recibida', 
                    descripcion: 'OC-1025 recepcionada completamente', 
                    tiempo: '1 hora',
                    icono: 'bag-check',
                    color: 'info'
                },
                { 
                    tipo: 'cliente', 
                    titulo: 'Nuevo cliente', 
                    descripcion: 'María López registrada', 
                    tiempo: '2 horas',
                    icono: 'person-plus',
                    color: 'success'
                }
            ];

            const container = document.getElementById('actividadReciente');
            
            if (actividades.length === 0) {
                container.innerHTML = `
                    <div class="empty-state py-4">
                        <i class="bi bi-inbox"></i>
                        <p class="text-muted mb-0">No hay actividad reciente</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = actividades.map(actividad => `
                <li class="activity-item">
                    <div class="activity-icon ${actividad.color}">
                        <i class="bi bi-${actividad.icono}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${actividad.titulo}</div>
                        <div class="activity-description">${actividad.descripcion}</div>
                        <div class="activity-time">Hace ${actividad.tiempo}</div>
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error cargando actividad reciente:', error);
        }
    },

    /**
     * Cargar alertas de stock
     */
    async loadAlertasStock() {
        try {
            // Datos de ejemplo
            const alertas = [
                { 
                    producto: 'Pintura Látex Blanco 1G', 
                    stock: 5, 
                    minimo: 10,
                    critico: true
                },
                { 
                    producto: 'Esmalte Rojo 1/4G', 
                    stock: 8, 
                    minimo: 15,
                    critico: false
                },
                { 
                    producto: 'Barniz Transparente', 
                    stock: 3, 
                    minimo: 10,
                    critico: true
                }
            ];

            const container = document.getElementById('alertasStock');
            
            if (alertas.length === 0) {
                container.innerHTML = `
                    <div class="empty-state py-4">
                        <i class="bi bi-check-circle text-success"></i>
                        <p class="text-muted mb-0">No hay alertas de inventario</p>
                    </div>
                `;
                return;
            }

            // Actualizar contador en el card de stats
            document.getElementById('stockBajoCantidad').textContent = alertas.length;

            container.innerHTML = alertas.map(alerta => `
                <div class="alert-item ${alerta.critico ? 'critical' : ''}">
                    <i class="bi bi-exclamation-${alerta.critico ? 'octagon' : 'triangle'}-fill"></i>
                    <div class="alert-info">
                        <div class="alert-product">${alerta.producto}</div>
                        <div class="alert-details">
                            Stock actual: ${alerta.stock} | Mínimo: ${alerta.minimo}
                        </div>
                    </div>
                    <div class="alert-action">
                        <a href="/views/inventario/ajustes.html" class="btn btn-sm btn-outline-warning">
                            Ajustar
                        </a>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando alertas de stock:', error);
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    DashboardController.init();
});