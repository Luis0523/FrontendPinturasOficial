/**
 * Servicio de Sucursales
 */

const SucursalesService = {
    /**
     * Obtener todas las sucursales activas
     */
    async getSucursales() {
        try {
            const response = await axios.get('/sucursales');
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