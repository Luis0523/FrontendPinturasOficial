/**
 * Servicio de Configuración
 * Maneja categorías, marcas y presentaciones
 */

const ConfiguracionService = {
    // ===== CATEGORÍAS =====
    async getCategorias(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await axios.get(`/categorias${queryString ? '?' + queryString : ''}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getCategoriaById(id) {
        try {
            const response = await axios.get(`/categorias/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async createCategoria(data) {
        try {
            const response = await axios.post('/categorias', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async updateCategoria(id, data) {
        try {
            const response = await axios.put(`/categorias/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async deleteCategoria(id) {
        try {
            const response = await axios.delete(`/categorias/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // ===== MARCAS =====
    async getMarcas(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await axios.get(`/marcas${queryString ? '?' + queryString : ''}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getMarcaById(id) {
        try {
            const response = await axios.get(`/marcas/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async createMarca(data) {
        try {
            const response = await axios.post('/marcas', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async updateMarca(id, data) {
        try {
            const response = await axios.put(`/marcas/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async deleteMarca(id) {
        try {
            const response = await axios.delete(`/marcas/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async desactivarMarca(id) {
        try {
            const response = await axios.patch(`/marcas/${id}/desactivar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async reactivarMarca(id) {
        try {
            const response = await axios.patch(`/marcas/${id}/reactivar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // ===== PRESENTACIONES =====
    async getPresentaciones(includeInactive = false) {
        try {
            const endpoint = includeInactive ? '/presentaciones/all' : '/presentaciones';
            const response = await axios.get(endpoint);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getPresentacionById(id) {
        try {
            const response = await axios.get(`/presentaciones/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async createPresentacion(data) {
        try {
            const response = await axios.post('/presentaciones', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async updatePresentacion(id, data) {
        try {
            const response = await axios.put(`/presentaciones/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async deletePresentacion(id) {
        try {
            const response = await axios.delete(`/presentaciones/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async reactivarPresentacion(id) {
        try {
            const response = await axios.patch(`/presentaciones/${id}/reactivar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    // ===== MANEJO DE ERRORES =====
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
window.ConfiguracionService = ConfiguracionService;
