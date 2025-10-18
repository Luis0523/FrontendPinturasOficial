/**
 * Servicio de Productos
 */

const ProductosService = {
    /**
     * Obtener todos los productos (incluye categoría y marca)
     */
    async getProductos(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.buscar) params.append('buscar', filtros.buscar);
            if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
            if (filtros.marca_id) params.append('marca_id', filtros.marca_id);
            if (filtros.activo !== undefined) params.append('activo', filtros.activo);
            if (filtros.page) params.append('page', filtros.page);
            if (filtros.limit) params.append('limit', filtros.limit);

            const response = await axios.get(`/productos?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener producto por ID
     */
    async getProductoById(id) {
        try {
            const response = await axios.get(`/productos/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear producto (solo info base)
     */
    async createProducto(data) {
        try {
            const response = await axios.post('/productos', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar producto
     */
    async updateProducto(id, data) {
        try {
            const response = await axios.put(`/productos/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar producto
     */
    async deleteProducto(id) {
        try {
            const response = await axios.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener presentaciones de un producto
     */
    async getPresentacionesDeProducto(productoId) {
        try {
            const response = await axios.get(`/productos/${productoId}/presentaciones`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Agregar presentaciones a un producto (solo IDs)
     */
    async agregarPresentacionesAProducto(productoId, presentacionesIds) {
        try {
            const response = await axios.post(`/productos/${productoId}/presentaciones`, {
                presentaciones: presentacionesIds
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Desactivar una presentación del producto
     */
    async desactivarProductoPresentacion(productoPresentacionId) {
        try {
            const response = await axios.patch(`/producto-presentacion/${productoPresentacionId}/desactivar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Reactivar una presentación del producto
     */
    async reactivarProductoPresentacion(productoPresentacionId) {
        try {
            const response = await axios.patch(`/producto-presentacion/${productoPresentacionId}/reactivar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener catálogo vendible
     */
    async getCatalogoVendible(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.buscar) params.append('buscar', filtros.buscar);
            if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
            if (filtros.marca_id) params.append('marca_id', filtros.marca_id);
            if (filtros.activo !== undefined) params.append('activo', filtros.activo);

            const response = await axios.get(`/catalogo-vendible?${params.toString()}`);
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