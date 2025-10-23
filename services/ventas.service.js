/**
 * =====================================================
 * VENTAS SERVICE
 * =====================================================
 * Servicio para manejar todas las operaciones relacionadas
 * con ventas y facturas en el sistema.
 * 
 * Endpoints del backend:
 * - POST /api/ventas/facturas
 * - GET /api/ventas/facturas
 * - GET /api/ventas/facturas/:id
 * - PUT /api/ventas/facturas/:id/anular
 * =====================================================
 */

const VentasService = {
    
    /**
     * Crear nueva factura
     * @param {Object} facturaData - Datos de la factura
     * @returns {Promise<Object>} Factura creada
     */
    async crearFactura(facturaData) {
        try {
            const response = await axios.post('/ventas/facturas', facturaData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener todas las facturas con filtros opcionales
     * @param {Object} filtros - Filtros para la búsqueda
     * @returns {Promise<Object>} Lista de facturas
     */
    async obtenerFacturas(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
            if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
            if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.desde) params.append('desde', filtros.desde);
            if (filtros.hasta) params.append('hasta', filtros.hasta);
            if (filtros.limite) params.append('limite', filtros.limite);

            const response = await axios.get(`/ventas/facturas?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener una factura específica por ID
     * @param {Number} id - ID de la factura
     * @returns {Promise<Object>} Factura con detalles completos
     */
    async obtenerFacturaPorId(id) {
        try {
            const response = await axios.get(`/ventas/facturas/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener los pagos de una factura específica
     * @param {Number} facturaId - ID de la factura
     * @returns {Promise<Object>} Pagos de la factura
     */
    async obtenerPagosFactura(facturaId) {
        try {
            const response = await axios.get(`/ventas/facturas/${facturaId}/pagos`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Anular una factura
     * @param {Number} id - ID de la factura a anular
     * @param {String} motivo - Motivo de la anulación
     * @returns {Promise<Object>} Factura anulada
     */
    async anularFactura(id, motivo = '') {
        try {
            const response = await axios.put(`/ventas/facturas/${id}/anular`, { motivo });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Validar stock antes de facturar
     * Usa el InventarioService para validar
     * @param {Number} sucursalId - ID de la sucursal
     * @param {Array} items - Items a validar [{producto_presentacion_id, cantidad}]
     * @returns {Promise<Object>} Resultado de la validación
     */
    async validarStock(sucursalId, items) {
        try {
            // Delegar al InventarioService que tiene la lógica completa
            if (window.InventarioService) {
                return await window.InventarioService.validarStockParaVenta(sucursalId, items);
            } else {
                throw new Error('InventarioService no está disponible');
            }
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Generar PDF de una factura (si está implementado en el backend)
     * @param {Number} id - ID de la factura
     * @returns {Promise<Blob>} PDF de la factura
     */
    async generarPDFFactura(id) {
        try {
            const response = await axios.get(`/ventas/facturas/${id}/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Imprimir factura
     * @param {Object} factura - Datos de la factura a imprimir
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
     * Generar HTML para impresión de factura
     * @param {Object} factura - Datos de la factura
     * @returns {String} HTML para imprimir
     */
    generarHTMLImpresion(factura) {
        // Helper para formatear fecha
        console.warn(factura.detalles);
        const formatDate = (date) => {
            if (!date) return '--/--/----';
            const d = new Date(date);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        };

        // Helper para formatear dinero
        const formatMoney = (amount) => {
            if (!amount) return '0.00';
            return parseFloat(amount).toFixed(2);
        };

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Factura ${factura.serie || 'A'}-${factura.numero}</title>
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
                        background-color: #333;
                        color: white;
                    }
                    .totales {
                        text-align: right;
                        margin-top: 20px;
                    }
                    .totales table {
                        width: 300px;
                        margin-left: auto;
                    }
                    .total-final {
                        font-size: 16px;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="info-empresa">
                        <h2>SISTEMA DE PINTURAS</h2>
                        <p>NIT: 123456789</p>
                        <p>Dirección de la empresa</p>
                        <p>Tel: 1234-5678</p>
                    </div>
                    <h1>FACTURA ${factura.serie || 'A'}-${String(factura.numero).padStart(6, '0')}</h1>
                </div>
                
                <div class="info-factura">
                    <p><strong>Fecha:</strong> ${formatDate(factura.fecha_factura || new Date())}</p>
                    <p><strong>Sucursal:</strong> ${factura.sucursal?.nombre || 'N/A'}</p>
                    <p><strong>Vendedor:</strong> ${factura.usuario?.nombre || 'N/A'}</p>
                </div>
                
                <div class="info-cliente">
                    <h3>INFORMACIÓN DEL CLIENTE</h3>
                    <p><strong>Nombre:</strong> ${factura.cliente?.nombre || 'CONSUMIDOR FINAL'}</p>
                    <p><strong>NIT:</strong> ${factura.cliente?.nit || 'CF'}</p>
                    ${factura.cliente?.direccion ? `<p><strong>Dirección:</strong> ${factura.cliente.direccion}</p>` : ''}
                </div>
                
                <h3>DETALLE DE LA VENTA</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Cant.</th>
                            <th>Descripción</th>
                            <th>P. Unit.</th>
                            <th>Desc.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(factura.detalles || []).map(detalle => `
                            <tr>
                                <td>${detalle.cantidad}</td>
                                <td>${detalle.productoPresentacion?.producto?.descripcion || 'N/A'} - ${detalle.productoPresentacion?.presentacion?.nombre || ''}</td>
                                <td>Q${formatMoney(detalle.precio_unitario)}</td>
                                <td>${detalle.descuento_pct || 0}%</td>
                                <td>Q${formatMoney(detalle.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totales">
                    <table>
                        <tr>
                            <td>Subtotal:</td>
                            <td>Q${formatMoney(factura.subtotal || 0)}</td>
                        </tr>
                        <tr>
                            <td>Descuento:</td>
                            <td>Q${formatMoney(factura.descuento_total || 0)}</td>
                        </tr>
                        <tr class="total-final">
                            <td>TOTAL:</td>
                            <td>Q${formatMoney(factura.total || 0)}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p>Gracias por su compra</p>
                    <p>Sistema de Gestión de Pinturas - ${new Date().getFullYear()}</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;
    },

    /**
     * Manejo de errores
     * @param {Error} error - Error capturado
     * @returns {Error} Error formateado
     */
    handleError(error) {
        if (error.response) {
            return new Error(error.response.data.message || 'Error al procesar la solicitud');
        } else if (error.request) {
            return new Error('No se pudo conectar con el servidor');
        } else {
            return new Error('Error al procesar la solicitud');
        }
    }
};

// Hacer disponible globalmente
window.VentasService = VentasService;