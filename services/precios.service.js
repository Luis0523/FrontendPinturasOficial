/**
 * Servicio de Precios
 */

const PreciosService = {
    /**
     * Obtener precios vigentes
     */
    async getPreciosVigentes(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
            if (filtros.producto_presentacion_id) params.append('producto_presentacion_id', filtros.producto_presentacion_id);

            const response = await axios.get(`/precios?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener catálogo con precios
     */
    async getCatalogoConPrecios(sucursalId) {
        try {
            const response = await axios.get(`/precios/catalogo-con-precios?sucursal_id=${sucursalId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener precio vigente de un producto en una sucursal
     */
    async getPrecioVigente(productoPresentacionId, sucursalId) {
        try {
            if(!productoPresentacionId || !sucursalId) {
                throw new Error('productoPresentacionId y sucursalId son requeridos');//
            }
            //console.log(`/precios/${productoPresentacionId}`);
            console.log(`/precios/vigente/${productoPresentacionId}/${sucursalId}`);
            const response = await axios.get(`/precios/vigente/${productoPresentacionId}/${sucursalId}`);
           // const response = await axios.get(`/precios/${productoPresentacionId}`);
            console.log(response.data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener precio por ID
     */
    async getPrecioById(id) {
        try {
            const response = await axios.get(`/precios/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear nuevo precio
     */
    async createPrecio(data) {
        try {
            const response = await axios.post('/precios', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar precio
     */
    async updatePrecio(id, data) {
        try {
            const response = await axios.put(`/precios/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Desactivar precio
     */
    async desactivarPrecio(id) {
        try {
            const response = await axios.patch(`/precios/${id}/desactivar`);
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