/**
 * Servicio de Compras
 */

const ComprasService = {
    /**
     * Obtener todas las órdenes de compra
     */
    async getOrdenes(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.proveedor_id) params.append('proveedor_id', filtros.proveedor_id);
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.desde) params.append('desde', filtros.desde);
            if (filtros.hasta) params.append('hasta', filtros.hasta);

            const response = await axios.get(`/compras/ordenes?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener orden por ID
     */
    async getOrdenById(id) {
        try {
            const response = await axios.get(`/compras/ordenes/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear orden de compra
     */
    async createOrden(data) {
        try {
            const response = await axios.post('/compras/ordenes', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar orden de compra
     */
    async updateOrden(id, data) {
        try {
            const response = await axios.put(`/compras/ordenes/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Cancelar orden de compra
     */
    async cancelarOrden(id) {
        try {
            const response = await axios.put(`/compras/ordenes/${id}/cancelar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear recepción
     */
    async createRecepcion(data) {
        try {
            const response = await axios.post('/compras/recepciones', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener recepciones de una orden
     */
    async getRecepcionesByOrden(ordenId) {
        try {
            const response = await axios.get(`/compras/ordenes/${ordenId}/recepciones`);
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
};4