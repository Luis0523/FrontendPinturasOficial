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
            await this.cargarDatosFiltros();

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

            const ventas = (ventasRes.data && Array.isArray(ventasRes.data)) ? ventasRes.data : [];
            const compras = (comprasRes.data && Array.isArray(comprasRes.data)) ? comprasRes.data : [];

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
            const categorias = (response.data && Array.isArray(response.data)) ? response.data : [];

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
            const metodos = (response.data && Array.isArray(response.data)) ? response.data : [];

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
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

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
    },

    // ========================================
    // NUEVOS REPORTES
    // ========================================

    /**
     * Cargar datos iniciales para filtros
     */
    async cargarDatosFiltros() {
        try {
            // Cargar categorías
            const categoriasRes = await ReportesService.getCategorias();
            const categorias = (categoriasRes.data && Array.isArray(categoriasRes.data))
                ? categoriasRes.data
                : [];
            const selectCategoria = document.getElementById('r4Categoria');
            if (selectCategoria) {
                categorias.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nombre;
                    selectCategoria.appendChild(option);
                });
            }

            // Cargar proveedores
            const proveedoresRes = await ReportesService.getProveedores();
            const proveedores = (proveedoresRes.data && Array.isArray(proveedoresRes.data))
                ? proveedoresRes.data
                : [];
            const selectProveedor = document.getElementById('r8Proveedor');
            if (selectProveedor) {
                proveedores.forEach(prov => {
                    const option = document.createElement('option');
                    option.value = prov.id;
                    option.textContent = prov.nombre;
                    selectProveedor.appendChild(option);
                });
            }

            // Cargar tiendas
            const tiendasRes = await ReportesService.getTiendas();
            const tiendas = (tiendasRes.data && Array.isArray(tiendasRes.data))
                ? tiendasRes.data
                : [];
            const selectTienda = document.getElementById('r10Tienda');
            if (selectTienda) {
                tiendas.forEach(tienda => {
                    const option = document.createElement('option');
                    option.value = tienda.id;
                    option.textContent = tienda.nombre;
                    selectTienda.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error al cargar datos de filtros:', error);
        }
    },

    /**
     * REPORTE 1: Total facturado por método de pago
     */
    async generarReporte1() {
        try {
            const fechaInicio = document.getElementById('r1FechaInicio').value;
            const fechaFin = document.getElementById('r1FechaFin').value;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione ambas fechas');
                return;
            }

            const response = await ReportesService.getReporteVentasPorMetodo(fechaInicio, fechaFin);
            const datos = response.data || {};

            this.datosReporte1 = datos; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}</h5>
                </div>
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h6>TOTAL GENERAL</h6>
                                <h3>Q${this.formatMoney(datos.total)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h6>EFECTIVO</h6>
                                <h3>Q${this.formatMoney(datos.efectivo)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-dark">
                            <div class="card-body text-center">
                                <h6>CHEQUE</h6>
                                <h3>Q${this.formatMoney(datos.cheque)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h6>TARJETA</h6>
                                <h3>Q${this.formatMoney(datos.tarjeta)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>Método de Pago</th>
                                <th class="text-end">Monto</th>
                                <th class="text-end">Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${datos.desglose?.map(item => `
                                <tr>
                                    <td>${this.formatMetodoPago(item.metodo)}</td>
                                    <td class="text-end">Q${this.formatMoney(item.total)}</td>
                                    <td class="text-end">${((item.total / datos.total) * 100).toFixed(2)}%</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3" class="text-center">No hay datos</td></tr>'}
                            <tr class="table-success fw-bold">
                                <td>TOTAL</td>
                                <td class="text-end">Q${this.formatMoney(datos.total)}</td>
                                <td class="text-end">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r1Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 1:', error);
            document.getElementById('r1Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 2: Productos que más dinero generan
     */
    async generarReporte2() {
        try {
            const fechaInicio = document.getElementById('r2FechaInicio').value;
            const fechaFin = document.getElementById('r2FechaFin').value;
            const limite = document.getElementById('r2Limite').value || 20;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione ambas fechas');
                return;
            }

            const response = await ReportesService.getReporteTopProductosIngresos(fechaInicio, fechaFin, limite);
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte2 = productos; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}</h5>
                    <p class="mb-0">Mostrando top ${limite} productos por ingresos generados</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Presentación</th>
                                <th class="text-end">Cantidad Vendida</th>
                                <th class="text-end">Total Generado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map((p, index) => `
                                <tr>
                                    <td><span class="badge bg-${index < 3 ? 'warning' : 'secondary'}">${index + 1}</span></td>
                                    <td><strong>${p.producto}</strong></td>
                                    <td>${p.presentacion}</td>
                                    <td class="text-end">${p.cantidad} ${p.unidad || ''}</td>
                                    <td class="text-end"><strong>Q${this.formatMoney(p.total)}</strong></td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r2Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 2:', error);
            document.getElementById('r2Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 3: Productos más vendidos por cantidad
     */
    async generarReporte3() {
        try {
            const fechaInicio = document.getElementById('r3FechaInicio').value;
            const fechaFin = document.getElementById('r3FechaFin').value;
            const limite = document.getElementById('r3Limite').value || 20;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione ambas fechas');
                return;
            }

            const response = await ReportesService.getReporteTopProductosCantidad(fechaInicio, fechaFin, limite);
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte3 = productos; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}</h5>
                    <p class="mb-0">Mostrando top ${limite} productos por cantidad vendida</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Presentación</th>
                                <th class="text-end">Cantidad Vendida</th>
                                <th class="text-end">Total en Ventas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map((p, index) => `
                                <tr>
                                    <td><span class="badge bg-${index < 3 ? 'success' : 'secondary'}">${index + 1}</span></td>
                                    <td><strong>${p.producto}</strong></td>
                                    <td>${p.presentacion}</td>
                                    <td class="text-end"><strong>${p.cantidad} ${p.unidad || ''}</strong></td>
                                    <td class="text-end">Q${this.formatMoney(p.total)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r3Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 3:', error);
            document.getElementById('r3Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 4: Inventario actual general
     */
    async generarReporte4() {
        try {
            const categoriaId = document.getElementById('r4Categoria').value || null;

            const response = await ReportesService.getReporteInventarioGeneral(categoriaId);
            const inventario = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte4 = inventario; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Inventario Actual General</h5>
                    <p class="mb-0">Total de productos: ${inventario.length}</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Presentación</th>
                                <th class="text-end">Stock Actual</th>
                                <th class="text-end">Stock Mínimo</th>
                                <th class="text-end">Precio</th>
                                <th class="text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventario.map(item => {
                                const estado = item.stock <= 0 ? 'danger' : item.stock <= item.stock_minimo ? 'warning' : 'success';
                                const estadoTexto = item.stock <= 0 ? 'Sin Stock' : item.stock <= item.stock_minimo ? 'Bajo' : 'OK';
                                return `
                                    <tr>
                                        <td>${item.codigo}</td>
                                        <td><strong>${item.producto}</strong></td>
                                        <td>${item.categoria}</td>
                                        <td>${item.presentacion}</td>
                                        <td class="text-end">${item.stock}</td>
                                        <td class="text-end">${item.stock_minimo}</td>
                                        <td class="text-end">Q${this.formatMoney(item.precio)}</td>
                                        <td class="text-center"><span class="badge bg-${estado}">${estadoTexto}</span></td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="8" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r4Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 4:', error);
            document.getElementById('r4Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 5: Productos con menos ventas
     */
    async generarReporte5() {
        try {
            const fechaInicio = document.getElementById('r5FechaInicio').value;
            const fechaFin = document.getElementById('r5FechaFin').value;
            const limite = document.getElementById('r5Limite').value || 20;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione ambas fechas');
                return;
            }

            const response = await ReportesService.getReporteProductosMenosVentas(fechaInicio, fechaFin, limite);
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte5 = productos; // Guardar para exportación

            let html = `
                <div class="alert alert-warning">
                    <h5>Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}</h5>
                    <p class="mb-0">Productos con menor cantidad de ventas</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Presentación</th>
                                <th class="text-end">Cantidad Vendida</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map((p, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><strong>${p.producto}</strong></td>
                                    <td>${p.presentacion}</td>
                                    <td class="text-end">${p.cantidad} ${p.unidad || ''}</td>
                                    <td class="text-end">Q${this.formatMoney(p.total)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r5Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 5:', error);
            document.getElementById('r5Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 6: Productos sin stock
     */
    async generarReporte6() {
        try {
            const response = await ReportesService.getReporteProductosSinStock();
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte6 = productos; // Guardar para exportación

            let html = `
                <div class="alert alert-danger">
                    <h5>Productos Sin Stock</h5>
                    <p class="mb-0">Total de productos: ${productos.length}</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Presentación</th>
                                <th>Proveedor</th>
                                <th class="text-end">Precio Compra</th>
                                <th class="text-end">Stock Mínimo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map(item => `
                                <tr>
                                    <td>${item.codigo}</td>
                                    <td><strong>${item.producto}</strong></td>
                                    <td>${item.categoria}</td>
                                    <td>${item.presentacion}</td>
                                    <td>${item.proveedor || 'N/A'}</td>
                                    <td class="text-end">Q${this.formatMoney(item.precio_compra)}</td>
                                    <td class="text-end">${item.stock_minimo}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="7" class="text-center">No hay productos sin stock</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r6Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 6:', error);
            document.getElementById('r6Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 7: Buscar factura por número
     */
    async generarReporte7() {
        try {
            const serie = document.getElementById('r7Serie').value || 'A';
            const numero = document.getElementById('r7Numero').value;

            if (!numero) {
                alert('Por favor ingrese el número de factura');
                return;
            }

            const response = await ReportesService.getReporteFacturaPorNumero(serie, numero);
            const factura = response.data || {};

            this.datosReporte7 = factura; // Guardar para exportación

            let html = `
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5>Factura: ${factura.serie}-${String(factura.numero).padStart(6, '0')}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p><strong>Cliente:</strong> ${factura.cliente?.nombre || 'N/A'}</p>
                                <p><strong>NIT:</strong> ${factura.cliente?.nit || 'C/F'}</p>
                                <p><strong>Dirección:</strong> ${factura.cliente?.direccion || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Usuario:</strong> ${factura.usuario?.nombre || 'N/A'}</p>
                                <p><strong>Fecha:</strong> ${new Date(factura.fecha_emision).toLocaleDateString('es-GT')}</p>
                                <p><strong>Hora:</strong> ${new Date(factura.fecha_emision).toLocaleTimeString('es-GT')}</p>
                            </div>
                        </div>

                        <h6>Productos</h6>
                        <div class="table-responsive mb-3">
                            <table class="table table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Producto</th>
                                        <th>Presentación</th>
                                        <th class="text-end">Cantidad</th>
                                        <th class="text-end">Precio</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${factura.detalles?.map(d => `
                                        <tr>
                                            <td>${d.producto?.nombre || 'N/A'}</td>
                                            <td>${d.presentacion?.nombre || 'N/A'}</td>
                                            <td class="text-end">${d.cantidad}</td>
                                            <td class="text-end">Q${this.formatMoney(d.precio_unitario)}</td>
                                            <td class="text-end">Q${this.formatMoney(d.subtotal)}</td>
                                        </tr>
                                    `).join('') || ''}
                                </tbody>
                            </table>
                        </div>

                        <h6>Métodos de Pago Empleados</h6>
                        <div class="table-responsive mb-3">
                            <table class="table table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Método</th>
                                        <th>Referencia</th>
                                        <th class="text-end">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${factura.pagos?.map(p => `
                                        <tr>
                                            <td>${this.formatMetodoPago(p.metodo_pago)}</td>
                                            <td>${p.referencia || '-'}</td>
                                            <td class="text-end">Q${this.formatMoney(p.monto)}</td>
                                        </tr>
                                    `).join('') || ''}
                                </tbody>
                            </table>
                        </div>

                        <div class="row">
                            <div class="col-md-6 offset-md-6">
                                <table class="table table-sm">
                                    <tr>
                                        <th>Subtotal:</th>
                                        <td class="text-end">Q${this.formatMoney(factura.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <th>Descuento:</th>
                                        <td class="text-end">Q${this.formatMoney(factura.descuento || 0)}</td>
                                    </tr>
                                    <tr>
                                        <th>IVA:</th>
                                        <td class="text-end">Q${this.formatMoney(factura.iva || 0)}</td>
                                    </tr>
                                    <tr class="table-primary">
                                        <th>TOTAL:</th>
                                        <th class="text-end">Q${this.formatMoney(factura.total)}</th>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('r7Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 7:', error);
            document.getElementById('r7Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>No se encontró la factura o error al buscar: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 8: Ingresos al inventario
     */
    async generarReporte8() {
        try {
            const fechaInicio = document.getElementById('r8FechaInicio').value;
            const fechaFin = document.getElementById('r8FechaFin').value;
            const proveedorId = document.getElementById('r8Proveedor').value || null;

            if (!fechaInicio || !fechaFin) {
                alert('Por favor seleccione ambas fechas');
                return;
            }

            const response = await ReportesService.getReporteIngresosInventario(fechaInicio, fechaFin, proveedorId);
            const ingresos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte8 = ingresos; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}</h5>
                    <p class="mb-0">Total de ingresos: ${ingresos.length}</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Fecha</th>
                                <th>Documento</th>
                                <th>Proveedor</th>
                                <th>Producto</th>
                                <th>Presentación</th>
                                <th class="text-end">Cantidad</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ingresos.map(item => `
                                <tr>
                                    <td>${new Date(item.fecha).toLocaleDateString('es-GT')}</td>
                                    <td>${item.documento}</td>
                                    <td>${item.proveedor}</td>
                                    <td><strong>${item.producto}</strong></td>
                                    <td>${item.presentacion}</td>
                                    <td class="text-end">${item.cantidad}</td>
                                    <td class="text-end">Q${this.formatMoney(item.precio)}</td>
                                    <td class="text-end">Q${this.formatMoney(item.total)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r8Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 8:', error);
            document.getElementById('r8Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 9: Productos con stock mínimo
     */
    async generarReporte9() {
        try {
            const response = await ReportesService.getReporteProductosStockMinimo();
            const productos = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte9 = productos; // Guardar para exportación

            let html = `
                <div class="alert alert-warning">
                    <h5>Productos con Stock Menor o Igual al Mínimo</h5>
                    <p class="mb-0">Total de productos: ${productos.length}</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Presentación</th>
                                <th class="text-end">Stock Actual</th>
                                <th class="text-end">Stock Mínimo</th>
                                <th class="text-end">Diferencia</th>
                                <th>Proveedor</th>
                                <th class="text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productos.map(item => {
                                const diferencia = item.stock_minimo - item.stock;
                                const estado = item.stock <= 0 ? 'danger' : 'warning';
                                const estadoTexto = item.stock <= 0 ? 'Sin Stock' : 'Bajo';
                                return `
                                    <tr>
                                        <td>${item.codigo}</td>
                                        <td><strong>${item.producto}</strong></td>
                                        <td>${item.categoria}</td>
                                        <td>${item.presentacion}</td>
                                        <td class="text-end">${item.stock}</td>
                                        <td class="text-end">${item.stock_minimo}</td>
                                        <td class="text-end text-danger"><strong>${diferencia}</strong></td>
                                        <td>${item.proveedor || 'N/A'}</td>
                                        <td class="text-center"><span class="badge bg-${estado}">${estadoTexto}</span></td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="9" class="text-center">No hay productos con stock mínimo</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r9Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 9:', error);
            document.getElementById('r9Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    /**
     * REPORTE 10: Inventario por tienda
     */
    async generarReporte10() {
        try {
            const tiendaId = document.getElementById('r10Tienda').value || null;

            const response = await ReportesService.getReporteInventarioPorTienda(tiendaId);
            const inventario = (response.data && Array.isArray(response.data)) ? response.data : [];

            this.datosReporte10 = inventario; // Guardar para exportación

            let html = `
                <div class="alert alert-primary">
                    <h5>Inventario por Tienda</h5>
                    <p class="mb-0">Total de registros: ${inventario.length}</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Tienda</th>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Presentación</th>
                                <th class="text-end">Stock</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${inventario.map(item => `
                                <tr>
                                    <td><strong>${item.tienda}</strong></td>
                                    <td>${item.codigo}</td>
                                    <td>${item.producto}</td>
                                    <td>${item.categoria}</td>
                                    <td>${item.presentacion}</td>
                                    <td class="text-end">${item.stock}</td>
                                    <td class="text-end">Q${this.formatMoney(item.precio)}</td>
                                    <td class="text-end">Q${this.formatMoney(item.stock * item.precio)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" class="text-center">No hay datos</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('r10Resultados').innerHTML = html;
        } catch (error) {
            console.error('Error al generar reporte 10:', error);
            document.getElementById('r10Resultados').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>Error al generar el reporte: ${error.message}
                </div>
            `;
        }
    },

    // ========================================
    // FUNCIONES DE EXPORTACIÓN
    // ========================================

    /**
     * Exportar Reporte 1
     */
    exportarReporte1(formato) {
        if (!this.datosReporte1) {
            alert('Primero debe generar el reporte');
            return;
        }

        const datos = this.datosReporte1;
        const fechaInicio = document.getElementById('r1FechaInicio').value;
        const fechaFin = document.getElementById('r1FechaFin').value;

        if (formato === 'excel') {
            const ws_data = [
                ['REPORTE DE VENTAS POR MÉTODO DE PAGO'],
                [`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`],
                [],
                ['Total General', `Q${this.formatMoney(datos.total)}`],
                ['Efectivo', `Q${this.formatMoney(datos.efectivo)}`],
                ['Cheque', `Q${this.formatMoney(datos.cheque)}`],
                ['Tarjeta', `Q${this.formatMoney(datos.tarjeta)}`],
                [],
                ['Método de Pago', 'Monto', 'Porcentaje']
            ];

            datos.desglose?.forEach(item => {
                ws_data.push([
                    this.formatMetodoPago(item.metodo),
                    parseFloat(item.total),
                    `${((item.total / datos.total) * 100).toFixed(2)}%`
                ]);
            });

            ws_data.push(['TOTAL', parseFloat(datos.total), '100%']);

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Método');
            XLSX.writeFile(wb, 'Reporte_Ventas_Por_Metodo.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Logo (placeholder - puedes agregar una imagen real)
            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 105, 15, { align: 'center' });

            doc.setFontSize(12);
            doc.text('Reporte de Ventas por Método de Pago', 105, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`, 105, 32, { align: 'center' });

            // Resumen
            let yPos = 45;
            doc.setFontSize(11);
            doc.text(`Total General: Q${this.formatMoney(datos.total)}`, 20, yPos);
            yPos += 7;
            doc.text(`Efectivo: Q${this.formatMoney(datos.efectivo)}`, 20, yPos);
            yPos += 7;
            doc.text(`Cheque: Q${this.formatMoney(datos.cheque)}`, 20, yPos);
            yPos += 7;
            doc.text(`Tarjeta: Q${this.formatMoney(datos.tarjeta)}`, 20, yPos);

            // Tabla
            const tableData = datos.desglose?.map(item => [
                this.formatMetodoPago(item.metodo),
                `Q${this.formatMoney(item.total)}`,
                `${((item.total / datos.total) * 100).toFixed(2)}%`
            ]) || [];

            doc.autoTable({
                startY: yPos + 15,
                head: [['Método de Pago', 'Monto', 'Porcentaje']],
                body: tableData,
                foot: [['TOTAL', `Q${this.formatMoney(datos.total)}`, '100%']],
                theme: 'striped'
            });

            doc.save('Reporte_Ventas_Por_Metodo.pdf');
        }
    },

    /**
     * Exportar Reporte 2
     */
    exportarReporte2(formato) {
        if (!this.datosReporte2) {
            alert('Primero debe generar el reporte');
            return;
        }

        const productos = this.datosReporte2;
        const fechaInicio = document.getElementById('r2FechaInicio').value;
        const fechaFin = document.getElementById('r2FechaFin').value;

        if (formato === 'excel') {
            const ws_data = [
                ['PRODUCTOS QUE MÁS DINERO GENERAN'],
                [`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`],
                [],
                ['#', 'Producto', 'Presentación', 'Cantidad Vendida', 'Total Generado']
            ];

            productos.forEach((p, index) => {
                ws_data.push([
                    index + 1,
                    p.producto,
                    p.presentacion,
                    `${p.cantidad} ${p.unidad || ''}`,
                    parseFloat(p.total)
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Top Productos Ingresos');
            XLSX.writeFile(wb, 'Reporte_Top_Productos_Ingresos.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Productos que Más Dinero Generan', 105, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`, 105, 32, { align: 'center' });

            const tableData = productos.map((p, index) => [
                index + 1,
                p.producto,
                p.presentacion,
                `${p.cantidad} ${p.unidad || ''}`,
                `Q${this.formatMoney(p.total)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['#', 'Producto', 'Presentación', 'Cantidad', 'Total']],
                body: tableData,
                theme: 'striped'
            });

            doc.save('Reporte_Top_Productos_Ingresos.pdf');
        }
    },

    /**
     * Exportar Reporte 3
     */
    exportarReporte3(formato) {
        if (!this.datosReporte3) {
            alert('Primero debe generar el reporte');
            return;
        }

        const productos = this.datosReporte3;
        const fechaInicio = document.getElementById('r3FechaInicio').value;
        const fechaFin = document.getElementById('r3FechaFin').value;

        if (formato === 'excel') {
            const ws_data = [
                ['PRODUCTOS MÁS VENDIDOS POR CANTIDAD'],
                [`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`],
                [],
                ['#', 'Producto', 'Presentación', 'Cantidad Vendida', 'Total en Ventas']
            ];

            productos.forEach((p, index) => {
                ws_data.push([
                    index + 1,
                    p.producto,
                    p.presentacion,
                    `${p.cantidad} ${p.unidad || ''}`,
                    parseFloat(p.total)
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Top Productos Cantidad');
            XLSX.writeFile(wb, 'Reporte_Top_Productos_Cantidad.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Productos Más Vendidos por Cantidad', 105, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`, 105, 32, { align: 'center' });

            const tableData = productos.map((p, index) => [
                index + 1,
                p.producto,
                p.presentacion,
                `${p.cantidad} ${p.unidad || ''}`,
                `Q${this.formatMoney(p.total)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['#', 'Producto', 'Presentación', 'Cantidad', 'Total']],
                body: tableData,
                theme: 'striped'
            });

            doc.save('Reporte_Top_Productos_Cantidad.pdf');
        }
    },

    /**
     * Exportar Reporte 4
     */
    exportarReporte4(formato) {
        if (!this.datosReporte4) {
            alert('Primero debe generar el reporte');
            return;
        }

        const inventario = this.datosReporte4;

        if (formato === 'excel') {
            const ws_data = [
                ['INVENTARIO ACTUAL GENERAL'],
                [`Total de productos: ${inventario.length}`],
                [],
                ['Código', 'Producto', 'Categoría', 'Presentación', 'Stock Actual', 'Stock Mínimo', 'Precio', 'Estado']
            ];

            inventario.forEach(item => {
                const estado = item.stock <= 0 ? 'Sin Stock' : item.stock <= item.stock_minimo ? 'Bajo' : 'OK';
                ws_data.push([
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.stock,
                    item.stock_minimo,
                    parseFloat(item.precio),
                    estado
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario General');
            XLSX.writeFile(wb, 'Reporte_Inventario_General.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l'); // Landscape

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 150, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Inventario Actual General', 150, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Total de productos: ${inventario.length}`, 150, 32, { align: 'center' });

            const tableData = inventario.map(item => {
                const estado = item.stock <= 0 ? 'Sin Stock' : item.stock <= item.stock_minimo ? 'Bajo' : 'OK';
                return [
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.stock,
                    item.stock_minimo,
                    `Q${this.formatMoney(item.precio)}`,
                    estado
                ];
            });

            doc.autoTable({
                startY: 40,
                head: [['Código', 'Producto', 'Categoría', 'Presentación', 'Stock', 'Mínimo', 'Precio', 'Estado']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 8 }
            });

            doc.save('Reporte_Inventario_General.pdf');
        }
    },

    /**
     * Exportar Reporte 5
     */
    exportarReporte5(formato) {
        if (!this.datosReporte5) {
            alert('Primero debe generar el reporte');
            return;
        }

        const productos = this.datosReporte5;
        const fechaInicio = document.getElementById('r5FechaInicio').value;
        const fechaFin = document.getElementById('r5FechaFin').value;

        if (formato === 'excel') {
            const ws_data = [
                ['PRODUCTOS CON MENOS VENTAS'],
                [`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`],
                [],
                ['#', 'Producto', 'Presentación', 'Cantidad Vendida', 'Total']
            ];

            productos.forEach((p, index) => {
                ws_data.push([
                    index + 1,
                    p.producto,
                    p.presentacion,
                    `${p.cantidad} ${p.unidad || ''}`,
                    parseFloat(p.total)
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Productos Menos Ventas');
            XLSX.writeFile(wb, 'Reporte_Productos_Menos_Ventas.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Productos con Menos Ventas', 105, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`, 105, 32, { align: 'center' });

            const tableData = productos.map((p, index) => [
                index + 1,
                p.producto,
                p.presentacion,
                `${p.cantidad} ${p.unidad || ''}`,
                `Q${this.formatMoney(p.total)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['#', 'Producto', 'Presentación', 'Cantidad', 'Total']],
                body: tableData,
                theme: 'striped'
            });

            doc.save('Reporte_Productos_Menos_Ventas.pdf');
        }
    },

    /**
     * Exportar Reporte 6
     */
    exportarReporte6(formato) {
        if (!this.datosReporte6) {
            alert('Primero debe generar el reporte');
            return;
        }

        const productos = this.datosReporte6;

        if (formato === 'excel') {
            const ws_data = [
                ['PRODUCTOS SIN STOCK'],
                [`Total de productos: ${productos.length}`],
                [],
                ['Código', 'Producto', 'Categoría', 'Presentación', 'Proveedor', 'Precio Compra', 'Stock Mínimo']
            ];

            productos.forEach(item => {
                ws_data.push([
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.proveedor || 'N/A',
                    parseFloat(item.precio_compra),
                    item.stock_minimo
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Productos Sin Stock');
            XLSX.writeFile(wb, 'Reporte_Productos_Sin_Stock.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l');

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 150, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Productos Sin Stock', 150, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Total de productos: ${productos.length}`, 150, 32, { align: 'center' });

            const tableData = productos.map(item => [
                item.codigo,
                item.producto,
                item.categoria,
                item.presentacion,
                item.proveedor || 'N/A',
                `Q${this.formatMoney(item.precio_compra)}`,
                item.stock_minimo
            ]);

            doc.autoTable({
                startY: 40,
                head: [['Código', 'Producto', 'Categoría', 'Presentación', 'Proveedor', 'Precio', 'Mínimo']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 8 }
            });

            doc.save('Reporte_Productos_Sin_Stock.pdf');
        }
    },

    /**
     * Exportar Reporte 7
     */
    exportarReporte7(formato) {
        if (!this.datosReporte7) {
            alert('Primero debe buscar una factura');
            return;
        }

        // Para el reporte 7, solo PDF (imprimir factura)
        this.imprimirFactura(this.datosReporte7);
    },

    /**
     * Exportar Reporte 8
     */
    exportarReporte8(formato) {
        if (!this.datosReporte8) {
            alert('Primero debe generar el reporte');
            return;
        }

        const ingresos = this.datosReporte8;
        const fechaInicio = document.getElementById('r8FechaInicio').value;
        const fechaFin = document.getElementById('r8FechaFin').value;

        if (formato === 'excel') {
            const ws_data = [
                ['INGRESOS AL INVENTARIO'],
                [`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`],
                [`Total de ingresos: ${ingresos.length}`],
                [],
                ['Fecha', 'Documento', 'Proveedor', 'Producto', 'Presentación', 'Cantidad', 'Precio', 'Total']
            ];

            ingresos.forEach(item => {
                ws_data.push([
                    new Date(item.fecha).toLocaleDateString('es-GT'),
                    item.documento,
                    item.proveedor,
                    item.producto,
                    item.presentacion,
                    item.cantidad,
                    parseFloat(item.precio),
                    parseFloat(item.total)
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Ingresos Inventario');
            XLSX.writeFile(wb, 'Reporte_Ingresos_Inventario.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l');

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 150, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Ingresos al Inventario', 150, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}`, 150, 32, { align: 'center' });

            const tableData = ingresos.map(item => [
                new Date(item.fecha).toLocaleDateString('es-GT'),
                item.documento,
                item.proveedor,
                item.producto,
                item.presentacion,
                item.cantidad,
                `Q${this.formatMoney(item.precio)}`,
                `Q${this.formatMoney(item.total)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['Fecha', 'Doc', 'Proveedor', 'Producto', 'Pres.', 'Cant', 'Precio', 'Total']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 7 }
            });

            doc.save('Reporte_Ingresos_Inventario.pdf');
        }
    },

    /**
     * Exportar Reporte 9
     */
    exportarReporte9(formato) {
        if (!this.datosReporte9) {
            alert('Primero debe generar el reporte');
            return;
        }

        const productos = this.datosReporte9;

        if (formato === 'excel') {
            const ws_data = [
                ['PRODUCTOS CON STOCK MÍNIMO'],
                [`Total de productos: ${productos.length}`],
                [],
                ['Código', 'Producto', 'Categoría', 'Presentación', 'Stock Actual', 'Stock Mínimo', 'Diferencia', 'Proveedor', 'Estado']
            ];

            productos.forEach(item => {
                const diferencia = item.stock_minimo - item.stock;
                const estado = item.stock <= 0 ? 'Sin Stock' : 'Bajo';
                ws_data.push([
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.stock,
                    item.stock_minimo,
                    diferencia,
                    item.proveedor || 'N/A',
                    estado
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Stock Mínimo');
            XLSX.writeFile(wb, 'Reporte_Stock_Minimo.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l');

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 150, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Productos con Stock Mínimo', 150, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Total de productos: ${productos.length}`, 150, 32, { align: 'center' });

            const tableData = productos.map(item => {
                const diferencia = item.stock_minimo - item.stock;
                const estado = item.stock <= 0 ? 'Sin Stock' : 'Bajo';
                return [
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.stock,
                    item.stock_minimo,
                    diferencia,
                    item.proveedor || 'N/A',
                    estado
                ];
            });

            doc.autoTable({
                startY: 40,
                head: [['Código', 'Producto', 'Cat', 'Pres.', 'Stock', 'Mín', 'Dif', 'Proveedor', 'Estado']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 7 }
            });

            doc.save('Reporte_Stock_Minimo.pdf');
        }
    },

    /**
     * Exportar Reporte 10
     */
    exportarReporte10(formato) {
        if (!this.datosReporte10) {
            alert('Primero debe generar el reporte');
            return;
        }

        const inventario = this.datosReporte10;

        if (formato === 'excel') {
            const ws_data = [
                ['INVENTARIO POR TIENDA'],
                [`Total de registros: ${inventario.length}`],
                [],
                ['Tienda', 'Código', 'Producto', 'Categoría', 'Presentación', 'Stock', 'Precio', 'Valor Total']
            ];

            inventario.forEach(item => {
                ws_data.push([
                    item.tienda,
                    item.codigo,
                    item.producto,
                    item.categoria,
                    item.presentacion,
                    item.stock,
                    parseFloat(item.precio),
                    parseFloat(item.stock * item.precio)
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario por Tienda');
            XLSX.writeFile(wb, 'Reporte_Inventario_Por_Tienda.xlsx');

        } else if (formato === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l');

            doc.setFontSize(16);
            doc.text('SISTEMA DE PINTURAS', 150, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text('Inventario por Tienda', 150, 25, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Total de registros: ${inventario.length}`, 150, 32, { align: 'center' });

            const tableData = inventario.map(item => [
                item.tienda,
                item.codigo,
                item.producto,
                item.categoria,
                item.presentacion,
                item.stock,
                `Q${this.formatMoney(item.precio)}`,
                `Q${this.formatMoney(item.stock * item.precio)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['Tienda', 'Código', 'Producto', 'Cat', 'Pres.', 'Stock', 'Precio', 'Valor']],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 7 }
            });

            doc.save('Reporte_Inventario_Por_Tienda.pdf');
        }
    }
};

// Hacer disponible globalmente
window.ReportesController = ReportesController;
