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

    /**
     * Manejo de errores
     */
    handleError(error) {
        if (error.response) {
            return new Error(error.response.data.message || 'Error al obtener reportes');
        } else if (error.request) {
            return new Error('No se pudo conectar con el servidor');
        } else {
            return new Error('Error al procesar la solicitud');
        }
    }
};

// Hacer disponible globalmente
window.ReportesService = ReportesService;
