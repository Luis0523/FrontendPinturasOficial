/**
 * Servicio de Productos
 */

const ProductosService = {
    /**
     * Obtener todos los productos
     */
    async getProductos(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.buscar) params.append('buscar', filtros.buscar);
            if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
            if (filtros.marca_id) params.append('marca_id', filtros.marca_id);
            if (filtros.activo !== undefined && filtros.activo !== '') params.append('activo', filtros.activo);
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
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
     * Crear producto
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
     * Eliminar producto (Soft Delete - marca como inactivo)
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
     * Reactivar producto desactivado
     */
    async reactivarProducto(id) {
        try {
            const response = await axios.patch(`/productos/${id}/reactivar`);
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
     * Agregar presentaciones a un producto
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
     * Desactivar presentación del producto
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
     * Reactivar presentación del producto
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
     * Eliminar presentación del producto (DELETE permanente)
     */
    async deleteProductoPresentacion(productoPresentacionId) {
        try {
            const response = await axios.delete(`/producto-presentacion/${productoPresentacionId}`);
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

    /**
     * Subir imagen de producto
     */
    async uploadImagenProducto(productoId, file) {
        try {
            const formData = new FormData();
            formData.append('imagen', file);

            const response = await axios.post(`/productos/${productoId}/imagen`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar imagen de producto
     */
    async deleteImagenProducto(productoId) {
        try {
            const response = await axios.delete(`/productos/${productoId}/imagen`);
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