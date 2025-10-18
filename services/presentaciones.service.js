/**
 * Servicio de Presentaciones
 */

const PresentacionesService = {
    /**
     * Obtener todas las presentaciones activas
     */
    async getPresentaciones() {
        try {
            const response = await axios.get('/presentaciones');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener todas (incluyendo inactivas)
     */
    async getAllPresentaciones() {
        try {
            const response = await axios.get('/presentaciones/all');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener presentación por ID
     */
    async getPresentacionById(id) {
        try {
            const response = await axios.get(`/presentaciones/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

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