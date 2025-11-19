
const FacturasController = {

    estado: {
        facturas: [],
        facturaSeleccionada: null,
        filtros: {
            desde: new Date().toISOString().split('T')[0],
            hasta: new Date().toISOString().split('T')[0],
            estado: '',
            serie: '',
            busqueda: ''
        },
        cargando: false
    },

    async init() {
        console.log('⚙️ Inicializando Gestión de Facturas...');

        this.configurarEventos();
        this.configurarFechasPorDefecto();
        await this.cargarFacturas();

        console.log('✅ Gestión de Facturas inicializada');
    },

    configurarFechasPorDefecto() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('filtroDesde').value = hoy;
        document.getElementById('filtroHasta').value = hoy;
    },

    configurarEventos() {
        const btnFiltrar = document.getElementById('btnFiltrar');
        const btnLimpiar = document.getElementById('btnLimpiarFiltros');
        const filtroBusqueda = document.getElementById('filtroBusqueda');

        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', () => this.aplicarFiltros());
        }

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarFiltros());
        }

        if (filtroBusqueda) {
            filtroBusqueda.addEventListener('input', (e) => {
                this.estado.filtros.busqueda = e.target.value;
                this.filtrarFacturasLocal();
            });
        }
    },

    async cargarFacturas() {
        try {
            this.mostrarLoader();
            this.estado.cargando = true;

            const filtros = {
                desde: document.getElementById('filtroDesde').value || undefined,
                hasta: document.getElementById('filtroHasta').value || undefined,
                estado: document.getElementById('filtroEstado').value || undefined,
                serie: document.getElementById('filtroSerie').value || undefined,
                limite: 500
            };

            const response = await FacturasService.getFacturas(filtros);

            if (response.success) {
                this.estado.facturas = response.data;
                this.renderizarFacturas(this.estado.facturas);
            } else {
                AlertsUtils.error('Error', response.message);
            }

        } catch (error) {
            console.error('Error al cargar facturas:', error);
            AlertsUtils.error('Error', error.message || 'No se pudieron cargar las facturas');
        } finally {
            this.ocultarLoader();
            this.estado.cargando = false;
        }
    },

    filtrarFacturasLocal() {
        const busqueda = this.estado.filtros.busqueda.toLowerCase();

        if (!busqueda) {
            this.renderizarFacturas(this.estado.facturas);
            return;
        }

        const facturasFiltradas = this.estado.facturas.filter(factura => {
            const numeroCompleto = `${factura.serie}-${factura.numero}`.toLowerCase();
            const numeroSolo = factura.numero.toString();
            const clienteNombre = factura.cliente?.nombre?.toLowerCase() || '';
            const serie = factura.serie.toLowerCase();

            return numeroCompleto.includes(busqueda) ||
                   numeroSolo.includes(busqueda) ||
                   clienteNombre.includes(busqueda) ||
                   serie.includes(busqueda);
        });

        this.renderizarFacturas(facturasFiltradas);
    },

    renderizarFacturas(facturas) {
        const tbody = document.getElementById('tablaFacturasBody');
        const badgeEstadisticas = document.getElementById('badgeEstadisticas');

        if (!tbody) return;

        tbody.innerHTML = '';

        if (!facturas || facturas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                        <p class="text-muted mt-3">No se encontraron facturas</p>
                    </td>
                </tr>
            `;
            if (badgeEstadisticas) {
                badgeEstadisticas.textContent = '0 facturas';
            }
            return;
        }

        facturas.forEach(factura => {
            const tr = document.createElement('tr');

            const estadoBadge = this.obtenerBadgeEstado(factura.estado);
            const fechaFormato = FormatterUtils.formatearFecha(factura.fecha_emision);
            const total = parseFloat(factura.total).toFixed(2);

            tr.innerHTML = `
                <td>
                    <strong>${factura.serie}-${factura.numero}</strong>
                </td>
                <td>${fechaFormato}</td>
                <td>${factura.cliente?.nombre || 'N/A'}</td>
                <td>${factura.cliente?.nit || 'N/A'}</td>
                <td class="text-end">Q. ${total}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="FacturasController.verDetalle(${factura.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    ${factura.estado === 'EMITIDA' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="FacturasController.confirmarAnulacion(${factura.id})">
                            <i class="bi bi-x-circle"></i> Anular
                        </button>
                    ` : ''}
                </td>
            `;

            tbody.appendChild(tr);
        });

        if (badgeEstadisticas) {
            badgeEstadisticas.textContent = `${facturas.length} factura${facturas.length !== 1 ? 's' : ''}`;
        }
    },

    obtenerBadgeEstado(estado) {
        const badges = {
            'EMITIDA': '<span class="badge bg-success">Emitida</span>',
            'ANULADA': '<span class="badge bg-danger">Anulada</span>',
            'PENDIENTE': '<span class="badge bg-warning">Pendiente</span>'
        };
        return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
    },

    async verDetalle(facturaId) {
        try {
            this.mostrarLoader();

            const response = await FacturasService.getFacturaById(facturaId);

            if (response.success) {
                this.estado.facturaSeleccionada = response.data;
                this.mostrarModalDetalle(response.data);
            }

        } catch (error) {
            console.error('Error al ver detalle:', error);
            AlertsUtils.error('Error', error.message || 'No se pudo cargar el detalle');
        } finally {
            this.ocultarLoader();
        }
    },

    mostrarModalDetalle(factura) {
        const modalBody = document.getElementById('modalDetalleFacturaBody');

        let detallesHTML = '';
        if (factura.detalles && factura.detalles.length > 0) {
            factura.detalles.forEach(detalle => {
                const producto = detalle.productoPresentacion?.producto?.nombre || 'Producto';
                const presentacion = detalle.productoPresentacion?.presentacion?.nombre || '';
                const subtotal = parseFloat(detalle.subtotal).toFixed(2);
                const precioUnit = parseFloat(detalle.precio_unitario).toFixed(2);

                detallesHTML += `
                    <tr>
                        <td>${producto} ${presentacion}</td>
                        <td class="text-center">${detalle.cantidad}</td>
                        <td class="text-end">Q. ${precioUnit}</td>
                        <td class="text-end"><strong>Q. ${subtotal}</strong></td>
                    </tr>
                `;
            });
        }

        const estadoBadge = this.obtenerBadgeEstado(factura.estado);
        const fechaEmision = FormatterUtils.formatearFecha(factura.fecha_emision);

        modalBody.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="text-muted small">Factura</label>
                    <h5>${factura.serie}-${factura.numero}</h5>
                </div>
                <div class="col-md-6">
                    <label class="text-muted small">Estado</label>
                    <div>${estadoBadge}</div>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="text-muted small">Fecha de Emisión</label>
                    <p>${fechaEmision}</p>
                </div>
                <div class="col-md-6">
                    <label class="text-muted small">Cliente</label>
                    <p><strong>${factura.cliente?.nombre || 'N/A'}</strong><br>
                    <small>NIT: ${factura.cliente?.nit || 'N/A'}</small></p>
                </div>
            </div>

            ${factura.estado === 'ANULADA' && factura.motivo_anulacion ? `
                <div class="alert alert-danger">
                    <strong>Factura Anulada</strong><br>
                    <small>Motivo: ${factura.motivo_anulacion}</small><br>
                    <small>Anulada por: ${factura.anulada_por || 'N/A'}</small><br>
                    <small>Fecha: ${factura.anulada_fecha ? FormatterUtils.formatearFecha(factura.anulada_fecha) : 'N/A'}</small>
                </div>
            ` : ''}

            <h6 class="mt-4 mb-3">Productos</h6>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-end">Precio</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${detallesHTML}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                        <td class="text-end"><strong>Q. ${parseFloat(factura.subtotal).toFixed(2)}</strong></td>
                    </tr>
                    ${factura.descuento_total > 0 ? `
                        <tr>
                            <td colspan="3" class="text-end">Descuento:</td>
                            <td class="text-end">Q. ${parseFloat(factura.descuento_total).toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr class="table-primary">
                        <td colspan="3" class="text-end"><strong>TOTAL:</strong></td>
                        <td class="text-end"><strong>Q. ${parseFloat(factura.total).toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;

        const modal = new bootstrap.Modal(document.getElementById('modalDetalleFactura'));
        modal.show();
    },

    confirmarAnulacion(facturaId) {
        this.estado.facturaSeleccionada = this.estado.facturas.find(f => f.id === facturaId);

        if (!this.estado.facturaSeleccionada) {
            AlertsUtils.error('Error', 'Factura no encontrada');
            return;
        }

        document.getElementById('facturaNumeroAnular').textContent =
            `${this.estado.facturaSeleccionada.serie}-${this.estado.facturaSeleccionada.numero}`;
        document.getElementById('motivoAnulacion').value = '';

        const modal = new bootstrap.Modal(document.getElementById('modalAnularFactura'));
        modal.show();
    },

    async anularFactura() {
        try {
            const motivoAnulacion = document.getElementById('motivoAnulacion').value.trim();

            if (!motivoAnulacion) {
                AlertsUtils.warning('Advertencia', 'Debes ingresar un motivo de anulación');
                return;
            }

            if (!this.estado.facturaSeleccionada) {
                AlertsUtils.error('Error', 'No hay factura seleccionada');
                return;
            }

            this.mostrarLoader();

            const response = await FacturasService.anularFactura(
                this.estado.facturaSeleccionada.id,
                motivoAnulacion
            );

            if (response.success) {
                AlertsUtils.success('Éxito', response.message);

                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAnularFactura'));
                modal.hide();

                await this.cargarFacturas();
            }

        } catch (error) {
            console.error('Error al anular factura:', error);
            AlertsUtils.error('Error', error.message || 'No se pudo anular la factura');
        } finally {
            this.ocultarLoader();
        }
    },

    aplicarFiltros() {
        this.cargarFacturas();
    },

    limpiarFiltros() {
        document.getElementById('filtroDesde').value = '';
        document.getElementById('filtroHasta').value = '';
        document.getElementById('filtroEstado').value = '';
        document.getElementById('filtroSerie').value = '';
        document.getElementById('filtroBusqueda').value = '';
        this.estado.filtros.busqueda = '';
        this.cargarFacturas();
    },

    mostrarLoader() {
        LoaderUtils.show();
    },

    ocultarLoader() {
        LoaderUtils.hide();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FacturasController.init();
});

window.FacturasController = FacturasController;
