/**
 * Servicio de Dashboard
 * Obtiene las métricas y estadísticas del sistema
 */

const DashboardService = {
    /**
     * Obtener todos los datos del dashboard
     */
    async getDashboardData() {
        try {
            const response = await axios.get(API_ENDPOINTS.dashboard);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas del día
     */
    async getVentasHoy() {
        try {
            const response = await axios.get(`${API_ENDPOINTS.dashboard}/ventas-hoy`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener productos con stock bajo
     */
    async getStockBajo() {
        try {
            const response = await axios.get(`${API_ENDPOINTS.dashboard}/stock-bajo`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener ventas de los últimos días
     */
    async getVentasUltimosDias(dias = 7) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.dashboard}/ventas-ultimos-dias?dias=${dias}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener productos más vendidos
     */
    async getProductosMasVendidos(limit = 5) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.dashboard}/productos-mas-vendidos?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener actividad reciente
     */
    async getActividadReciente(limit = 10) {
        try {
            const response = await axios.get(`${API_ENDPOINTS.dashboard}/actividad-reciente?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Manejar errores
     */
    handleError(error) {
        if (error.response) {
            return new Error(error.response.data.message || 'Error al obtener datos del dashboard');
        } else if (error.request) {
            return new Error('No se pudo conectar con el servidor');
        } else {
            return new Error('Error al procesar la solicitud');
        }
    }
};