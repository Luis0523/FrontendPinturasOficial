/**
 * =====================================================
 * REPORTES CONTROLLER
 * =====================================================
 */

const ReportesController = {
    // State
    charts: {},
    mesActual: new Date().getMonth() + 1,
    anioActual: new Date().getFullYear(),

    /**
     * Inicializar
     */
    async init() {
        try {
            console.log('🚀 Inicializando Reportes...');

            // Verificar autenticación
            if (!AuthService.requireAuth()) {
                return;
            }

            // Verificar permisos
            if (!requirePermission(Permissions.canViewAllReports)) {
                return; // El requirePermission ya redirige
            }

            this.llenarSelectores();
            this.configurarEventos();

            await this.cargarDashboardStats();
            await this.cargarGraficas();

            // Configurar botón de reimprimir factura
            document.getElementById('btnReimprimirFactura').addEventListener('click', () => {
                this.reimprimirFactura();
            });

            console.log('✅ Reportes inicializados');
        } catch (error) {
            console.error('❌ Error al inicializar reportes:', error);
        }
    },

    /**
     * Llenar selectores de mes y año
     */
    llenarSelectores() {
        // Año
        const selectAnio = document.getElementById('selectAnio');
        const anioInicio = 2023;
        const anioFin = new Date().getFullYear() + 1;

        for (let i = anioFin; i >= anioInicio; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === this.anioActual) option.selected = true;
            selectAnio.appendChild(option);
        }

        // Mes actual
        document.getElementById('selectMes').value = this.mesActual;

        // Fecha del día (hoy)
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('inputFechaDia').value = hoy;
    },

    /**
     * Configurar eventos
     */
    configurarEventos() {
        document.getElementById('selectMes').addEventListener('change', () => {
            this.mesActual = parseInt(document.getElementById('selectMes').value);
            this.cargarGraficas();
        });

        document.getElementById('selectAnio').addEventListener('change', () => {
            this.anioActual = parseInt(document.getElementById('selectAnio').value);
            this.cargarGraficas();
        });
    },

    /**
     * Cargar estadísticas del dashboard
     */
    async cargarDashboardStats() {
        try {
            const response = await ReportesService.getDashboardStats();
            const stats = response.data;

            document.getElementById('ventasHoy').textContent = this.formatMoney(stats.ventasHoy);
            document.getElementById('ventasSemana').textContent = this.formatMoney(stats.ventasSemana);
            document.getElementById('ventasMes').textContent = this.formatMoney(stats.ventasMes);
            document.getElementById('facturasHoy').textContent = stats.facturasHoy;
        } catch (error) {
            console.error('Error al cargar stats:', error);
        }
    },

    /**
     * Cargar todas las gráficas
     */
    async cargarGraficas() {
        await Promise.all([
            this.cargarGraficaComprasVsVentas(),
            this.cargarGraficaVentasCategorias(),
            this.cargarGraficaMetodosPago(),
            this.cargarTopProductos()
        ]);
    },

    /**
     * Gráfica: Compras vs Ventas
     */
    async cargarGraficaComprasVsVentas() {
        try {
            const [ventasRes, comprasRes] = await Promise.all([
                ReportesService.getVentasMes(this.mesActual, this.anioActual),
                ReportesService.getComprasMes(this.mesActual, this.anioActual)
            ]);

            const ventas = ventasRes.data || [];
            const compras = comprasRes.data || [];

            // Preparar datos
            const dias = this.getDiasDelMes(this.mesActual, this.anioActual);
            const ventasData = dias.map(dia => {
                const venta = ventas.find(v => new Date(v.fecha).getDate() === dia);
                return venta ? parseFloat(venta.total) : 0;
            });

            const comprasData = dias.map(dia => {
                const compra = compras.find(c => new Date(c.fecha).getDate() === dia);
                return compra ? parseFloat(compra.total) : 0;
            });

            // Destruir gráfica anterior si existe
            if (this.charts.comprasVsVentas) {
                this.charts.comprasVsVentas.destroy();
            }

            // Crear gráfica
            const ctx = document.getElementById('chartComprasVsVentas').getContext('2d');
            this.charts.comprasVsVentas = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dias.map(d => `Día ${d}`),
                    datasets: [
                        {
                            label: 'Ventas',
                            data: ventasData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Compras',
                            data: comprasData,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            tension: 0.1,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': Q' + context.parsed.y.toFixed(2);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Q' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error al cargar gráfica compras vs ventas:', error);
        }
    },

    /**
     * Gráfica: Ventas por Categoría
     */
    async cargarGraficaVentasCategorias() {
        try {
            const response = await ReportesService.getVentasPorCategoria(30);
            const categorias = response.data || [];

            if (this.charts.ventasCategorias) {
                this.charts.ventasCategorias.destroy();
            }

            const ctx = document.getElementById('chartVentasCategorias').getContext('2d');
            this.charts.ventasCategorias = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categorias.map(c => c.categoria),
                    datasets: [{
                        data: categorias.map(c => parseFloat(c.total)),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': Q' + context.parsed.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error al cargar gráfica de categorías:', error);
        }
    },

    /**
     * Gráfica: Métodos de Pago
     */
    async cargarGraficaMetodosPago() {
        try {
            const response = await ReportesService.getMetodosPago(30);
            const metodos = response.data || [];

            if (this.charts.metodosPago) {
                this.charts.metodosPago.destroy();
            }

            const ctx = document.getElementById('chartMetodosPago').getContext('2d');
            this.charts.metodosPago = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: metodos.map(m => this.formatMetodoPago(m.metodo)),
                    datasets: [{
                        data: metodos.map(m => parseFloat(m.total)),
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': Q' + context.parsed.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error al cargar gráfica de métodos de pago:', error);
        }
    },

    /**
     * Cargar Top Productos
     */
    async cargarTopProductos() {
        try {
            const response = await ReportesService.getTopProductos(10, 30);
            const productos = response.data || [];

            const tbody = document.getElementById('tablaTopProductos');
            tbody.innerHTML = productos.map((p, index) => `
                <tr>
                    <td>
                        <span class="badge bg-${index < 3 ? 'warning' : 'secondary'}">${index + 1}</span>
                    </td>
                    <td>${p.producto}</td>
                    <td>${p.presentacion}</td>
                    <td class="text-end">${p.cantidad_vendida}</td>
                    <td class="text-end"><strong>Q${this.formatMoney(p.total_vendido)}</strong></td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error al cargar top productos:', error);
            document.getElementById('tablaTopProductos').innerHTML = `
                <tr><td colspan="5" class="text-center text-danger">Error al cargar datos</td></tr>
            `;
        }
    },

    /**
     * Cargar ventas de un día específico
     */
    async cargarVentasDia() {
        try {
            const fecha = document.getElementById('inputFechaDia').value;
            if (!fecha) {
                alert('Seleccione una fecha');
                return;
            }

            const response = await ReportesService.getVentasDia(fecha);
            const { facturas, resumen } = response.data;

            // Mostrar card
            document.getElementById('cardVentasDia').style.display = 'block';
            document.getElementById('fechaSeleccionada').textContent = new Date(fecha).toLocaleDateString('es-GT');
            document.getElementById('totalFacturasDia').textContent = resumen.cantidad;
            document.getElementById('totalVentasDia').textContent = this.formatMoney(resumen.total);

            // Renderizar tabla
            const tbody = document.getElementById('tablaVentasDia');
            tbody.innerHTML = facturas.map(f => `
                <tr>
                    <td><strong>${f.serie}-${String(f.numero).padStart(6, '0')}</strong></td>
                    <td>${f.cliente?.nombre || 'N/A'}</td>
                    <td>${f.usuario?.nombre || 'N/A'}</td>
                    <td class="text-end"><strong>Q${this.formatMoney(f.total)}</strong></td>
                    <td>${new Date(f.fecha_emision).toLocaleTimeString('es-GT')}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary" onclick="ReportesController.verDetalleVenta(${f.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error al cargar ventas del día:', error);
            alert('Error al cargar las ventas del día');
        }
    },

    /**
     * Ver detalle de una venta específica
     */
    async verDetalleVenta(facturaId) {
        try {
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('modalDetalleVenta'));
            modal.show();

            // Mostrar loading
            document.getElementById('detalleVentaLoading').style.display = 'block';
            document.getElementById('detalleVentaContenido').style.display = 'none';

            // Obtener detalles de la factura
            const response = await ReportesService.getDetalleFactura(facturaId);
            const factura = response.data;

            // Guardar factura en el estado para reimprimir
            this.facturaActual = factura;

            // Llenar información básica
            document.getElementById('detalleNumeroFactura').textContent =
                `${factura.serie}-${String(factura.numero).padStart(6, '0')}`;
            document.getElementById('detalleCliente').textContent = factura.cliente?.nombre || 'N/A';
            document.getElementById('detalleNit').textContent = factura.cliente?.nit || 'C/F';
            document.getElementById('detalleDireccion').textContent = factura.cliente?.direccion || 'N/A';
            document.getElementById('detalleUsuario').textContent = factura.usuario?.nombre || 'N/A';

            const fecha = new Date(factura.fecha_emision);
            document.getElementById('detalleFecha').textContent = fecha.toLocaleDateString('es-GT');
            document.getElementById('detalleHora').textContent = fecha.toLocaleTimeString('es-GT');

            // Llenar productos
            const tbodyProductos = document.getElementById('detalleProductos');
            tbodyProductos.innerHTML = factura.detalles?.map(d => `
                <tr>
                    <td>${d.producto?.nombre || 'N/A'}</td>
                    <td>${d.presentacion?.nombre || 'N/A'}</td>
                    <td class="text-end">${d.cantidad}</td>
                    <td class="text-end">Q${this.formatMoney(d.precio_unitario)}</td>
                    <td class="text-end">Q${this.formatMoney(d.subtotal)}</td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center">No hay productos</td></tr>';

            // Llenar pagos
            const tbodyPagos = document.getElementById('detallePagos');
            tbodyPagos.innerHTML = factura.pagos?.map(p => `
                <tr>
                    <td>${this.formatMetodoPago(p.metodo_pago)}</td>
                    <td>${p.referencia || '-'}</td>
                    <td class="text-end">Q${this.formatMoney(p.monto)}</td>
                </tr>
            `).join('') || '<tr><td colspan="3" class="text-center">No hay pagos registrados</td></tr>';

            // Llenar totales
            document.getElementById('detalleSubtotal').textContent = this.formatMoney(factura.subtotal);
            document.getElementById('detalleDescuento').textContent = this.formatMoney(factura.descuento || 0);
            document.getElementById('detalleIva').textContent = this.formatMoney(factura.iva || 0);
            document.getElementById('detalleTotal').textContent = this.formatMoney(factura.total);

            // Ocultar loading y mostrar contenido
            document.getElementById('detalleVentaLoading').style.display = 'none';
            document.getElementById('detalleVentaContenido').style.display = 'block';

        } catch (error) {
            console.error('Error al cargar detalle de venta:', error);
            alert('Error al cargar los detalles de la venta');
            bootstrap.Modal.getInstance(document.getElementById('modalDetalleVenta'))?.hide();
        }
    },

    /**
     * Reimprimir factura actual
     */
    reimprimirFactura() {
        try {
            if (!this.facturaActual) {
                alert('No hay factura seleccionada');
                return;
            }

            // Necesitamos importar el servicio de ventas para imprimir
            // Por ahora vamos a usar la misma lógica pero aquí
            this.imprimirFactura(this.facturaActual);

        } catch (error) {
            console.error('Error al reimprimir factura:', error);
            alert('Error al reimprimir la factura');
        }
    },

    /**
     * Imprimir factura
     */
    imprimirFactura(factura) {
        try {
            // Crear ventana de impresión
            const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

            // Generar HTML para impresión
            const htmlImpresion = this.generarHTMLImpresion(factura);

            ventanaImpresion.document.write(htmlImpresion);
            ventanaImpresion.document.close();

            // Esperar a que cargue e imprimir
            ventanaImpresion.onload = function() {
                ventanaImpresion.focus();
                ventanaImpresion.print();
            };
        } catch (error) {
            console.error('Error en imprimirFactura:', error);
            throw error;
        }
    },

    /**
     * Generar HTML para impresión
     */
    generarHTMLImpresion(factura) {
        const formatDate = (date) => {
            if (!date) return '--/--/----';
            const d = new Date(date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        };

        const formatMoney = (amount) => {
            if (!amount) return '0.00';
            return parseFloat(amount).toFixed(2);
        };

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Factura ${factura.serie || 'A'}-${String(factura.numero).padStart(6, '0')}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        font-size: 12px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .info-empresa {
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    .info-factura {
                        margin-bottom: 15px;
                    }
                    .info-cliente {
                        margin-bottom: 15px;
                        padding: 10px;
                        background-color: #f5f5f5;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .totales {
                        float: right;
                        width: 300px;
                    }
                    .totales table {
                        margin-top: 10px;
                    }
                    .total-final {
                        font-weight: bold;
                        font-size: 14px;
                        background-color: #e8e8e8;
                    }
                    @media print {
                        body {
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="info-empresa">
                    <h2>SISTEMA DE PINTURAS</h2>
                    <p>NIT: 123456789</p>
                    <p>Dirección: Ciudad de Guatemala</p>
                    <p>Teléfono: 2222-2222</p>
                </div>

                <div class="header">
                    <h1>FACTURA</h1>
                    <h2>${factura.serie || 'A'}-${String(factura.numero).padStart(6, '0')}</h2>
                </div>

                <div class="info-factura">
                    <strong>Fecha:</strong> ${formatDate(factura.fecha_emision)}<br>
                    <strong>Hora:</strong> ${new Date(factura.fecha_emision).toLocaleTimeString('es-GT')}<br>
                    <strong>Usuario:</strong> ${factura.usuario?.nombre || 'N/A'}
                </div>

                <div class="info-cliente">
                    <strong>Cliente:</strong> ${factura.cliente?.nombre || 'N/A'}<br>
                    <strong>NIT:</strong> ${factura.cliente?.nit || 'C/F'}<br>
                    <strong>Dirección:</strong> ${factura.cliente?.direccion || 'N/A'}
                </div>

                <h3>Detalle de Productos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Producto</th>
                            <th>Presentación</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(factura.detalles || []).map(item => `
                            <tr>
                                <td>${item.cantidad}</td>
                                <td>${item.producto?.nombre || 'N/A'}</td>
                                <td>${item.presentacion?.nombre || 'N/A'}</td>
                                <td class="text-right">Q${formatMoney(item.precio_unitario)}</td>
                                <td class="text-right">Q${formatMoney(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totales">
                    <table>
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td class="text-right">Q${formatMoney(factura.subtotal)}</td>
                        </tr>
                        ${factura.descuento && factura.descuento > 0 ? `
                        <tr>
                            <td><strong>Descuento:</strong></td>
                            <td class="text-right">-Q${formatMoney(factura.descuento)}</td>
                        </tr>
                        ` : ''}
                        ${factura.iva && factura.iva > 0 ? `
                        <tr>
                            <td><strong>IVA:</strong></td>
                            <td class="text-right">Q${formatMoney(factura.iva)}</td>
                        </tr>
                        ` : ''}
                        <tr class="total-final">
                            <td><strong>TOTAL:</strong></td>
                            <td class="text-right"><strong>Q${formatMoney(factura.total)}</strong></td>
                        </tr>
                    </table>
                </div>

                <div style="clear: both; margin-top: 30px;">
                    <h3>Métodos de Pago</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Método</th>
                                <th>Referencia</th>
                                <th class="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(factura.pagos || []).map(pago => `
                                <tr>
                                    <td>${this.formatMetodoPago(pago.metodo_pago)}</td>
                                    <td>${pago.referencia || '-'}</td>
                                    <td class="text-right">Q${formatMoney(pago.monto)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 40px; text-align: center; font-size: 10px;">
                    <p>Gracias por su compra</p>
                    <p>Este documento es una representación impresa de la factura electrónica</p>
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Obtener días del mes
     */
    getDiasDelMes(mes, anio) {
        const ultimoDia = new Date(anio, mes, 0).getDate();
        return Array.from({ length: ultimoDia }, (_, i) => i + 1);
    },

    /**
     * Formatear método de pago
     */
    formatMetodoPago(metodo) {
        const nombres = {
            'EFECTIVO': 'Efectivo',
            'TARJETA_DEBITO': 'Tarjeta Débito',
            'TARJETA_CREDITO': 'Tarjeta Crédito',
            'CHEQUE': 'Cheque',
            'TRANSFERENCIA': 'Transferencia',
            'DEPOSITO': 'Depósito'
        };
        return nombres[metodo] || metodo;
    },

    /**
     * Formatear dinero
     */
    formatMoney(value) {
        return parseFloat(value || 0).toLocaleString('es-GT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
};

// Hacer disponible globalmente
window.ReportesController = ReportesController;
