/**
 * =====================================================
 * REPORTES SERVICE
 * =====================================================
 */

const ReportesService = {

    /**
     * Obtener estadísticas para el dashboard
     */
    async getDashboardStats() {
        try {
            const response = await axios.get('/reportes/dashboard');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas de la semana
     */
    async getVentasSemana() {
        try {
            const response = await axios.get('/reportes/ventas/semana');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas del mes
     */
    async getVentasMes(mes, anio) {
        try {
            const params = mes && anio ? `?mes=${mes}&anio=${anio}` : '';
            const response = await axios.get(`/reportes/ventas/mes${params}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas de un día específico
     */
    async getVentasDia(fecha) {
        try {
            const response = await axios.get(`/reportes/ventas/dia?fecha=${fecha}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener compras del mes
     */
    async getComprasMes(mes, anio) {
        try {
            const params = mes && anio ? `?mes=${mes}&anio=${anio}` : '';
            const response = await axios.get(`/reportes/compras/mes${params}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas por categoría
     */
    async getVentasPorCategoria(dias = 30) {
        try {
            const response = await axios.get(`/reportes/ventas/categorias?dias=${dias}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener métodos de pago más usados
     */
    async getMetodosPago(dias = 30) {
        try {
            const response = await axios.get(`/reportes/pagos/metodos?dias=${dias}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener top productos más vendidos
     */
    async getTopProductos(limit = 10, dias = 30) {
        try {
            const response = await axios.get(`/reportes/ventas/top-productos?limit=${limit}&dias=${dias}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener detalles completos de una factura por ID
     */
    async getDetalleFactura(facturaId) {
        try {
            const response = await axios.get(`/ventas/facturas/${facturaId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // ========================================
    // NUEVOS REPORTES
    // ========================================

    /**
     * Reporte 1: Total facturado por método de pago entre fechas
     */
    async getReporteVentasPorMetodo(fechaInicio, fechaFin) {
        try {
            const response = await axios.get('/reportes/ventas/metodo-pago', {
                params: { desde: fechaInicio, hasta: fechaFin }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 2: Productos que más dinero generan entre fechas
     */
    async getReporteTopProductosIngresos(fechaInicio, fechaFin, limite = 20) {
        try {
            const response = await axios.get('/reportes/productos/mas-ingresos', {
                params: { desde: fechaInicio, hasta: fechaFin, limit: limite }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 3: Productos más vendidos por cantidad entre fechas
     */
    async getReporteTopProductosCantidad(fechaInicio, fechaFin, limite = 20) {
        try {
            const response = await axios.get('/reportes/productos/mas-vendidos', {
                params: { desde: fechaInicio, hasta: fechaFin, limit: limite }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 4: Inventario actual general
     */
    async getReporteInventarioGeneral(categoriaId = null) {
        try {
            const params = categoriaId ? { categoria_id: categoriaId } : {};
            const response = await axios.get('/reportes/inventario/actual', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 5: Productos con menos ventas
     */
    async getReporteProductosMenosVentas(fechaInicio, fechaFin, limite = 20) {
        try {
            const response = await axios.get('/reportes/productos/menos-vendidos', {
                params: { desde: fechaInicio, hasta: fechaFin, limit: limite }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 6: Productos sin stock
     */
    async getReporteProductosSinStock() {
        try {
            const response = await axios.get('/reportes/inventario/sin-stock');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 7: Buscar factura por número
     */
    async getReporteFacturaPorNumero(serie, numero) {
        try {
            const response = await axios.get('/reportes/factura/buscar', {
                params: { serie, numero }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 8: Ingresos al inventario (compras)
     */
    async getReporteIngresosInventario(fechaInicio, fechaFin, proveedorId = null) {
        try {
            const params = { desde: fechaInicio, hasta: fechaFin };
            if (proveedorId) params.proveedor_id = proveedorId;
            const response = await axios.get('/reportes/ingresos-inventario', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 9: Productos con stock mínimo
     */
    async getReporteProductosStockMinimo() {
        try {
            const response = await axios.get('/reportes/productos-stock-minimo');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reporte 10: Inventario por tienda
     */
    async getReporteInventarioPorTienda(tiendaId = null) {
        try {
            const params = tiendaId ? { sucursal_id: tiendaId } : {};
            const response = await axios.get('/reportes/inventario/actual', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener lista de categorías (para filtros)
     */
    async getCategorias() {
        try {
            const response = await axios.get('/categorias');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener lista de proveedores (para filtros)
     */
    async getProveedores() {
        try {
            const response = await axios.get('/compras/proveedores');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener lista de tiendas/sucursales (para filtros)
     */
    async getTiendas() {
        try {
            const response = await axios.get('/sucursales');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Manejo de errores
     */
    handleError(error) {
        if (error.response && error.response.data) {
            return new Error(error.response.data.message || 'Error al obtener reportes');
        } else if (error.request) {
            return new Error('No se pudo conectar con el servidor');
        } else {
            return new Error(error.message || 'Error al procesar la solicitud');
        }
    }
};

// Hacer disponible globalmente
window.ReportesService = ReportesService;
