/**
 * =====================================================
 * ROLES SERVICE
 * =====================================================
 * Servicio para manejar todas las operaciones relacionadas
 * con roles en el sistema.
 *
 * Endpoints del backend:
 * - GET /api/roles
 * - GET /api/roles/:id
 * - POST /api/roles
 * - PUT /api/roles/:id
 * - DELETE /api/roles/:id
 * =====================================================
 */

const RolesService = {

    /**
     * Obtener todos los roles
     * @returns {Promise<Object>} Lista de roles
     */
    async getRoles() {
        try {
            const response = await axios.get('/roles');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener un rol por ID
     * @param {Number} id - ID del rol
     * @returns {Promise<Object>} Rol
     */
    async getRolById(id) {
        try {
            if (!id) {
                throw new Error('El ID del rol es requerido');
            }

            const response = await axios.get(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear nuevo rol
     * @param {Object} rolData - Datos del rol
     * @returns {Promise<Object>} Rol creado
     */
    async createRol(rolData) {
        try {
            // Validaciones básicas
            if (!rolData.nombre || rolData.nombre.trim() === '') {
                throw new Error('El nombre del rol es requerido');
            }

            const cleanData = {
                nombre: rolData.nombre.trim()
            };

            const response = await axios.post('/roles', cleanData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar rol existente
     * @param {Number} id - ID del rol
     * @param {Object} rolData - Datos actualizados del rol
     * @returns {Promise<Object>} Rol actualizado
     */
    async updateRol(id, rolData) {
        try {
            if (!id) {
                throw new Error('El ID del rol es requerido');
            }

            // Validaciones básicas
            if (!rolData.nombre || rolData.nombre.trim() === '') {
                throw new Error('El nombre del rol es requerido');
            }

            const cleanData = {
                nombre: rolData.nombre.trim()
            };

            const response = await axios.put(`/roles/${id}`, cleanData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar rol
     * @param {Number} id - ID del rol
     * @returns {Promise<Object>} Resultado
     */
    async deleteRol(id) {
        try {
            if (!id) {
                throw new Error('El ID del rol es requerido');
            }

            const response = await axios.delete(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Manejar errores de la API
     * @param {Object} error - Error de Axios
     * @returns {Error} Error formateado
     */
    handleError(error) {
        console.error('Error en RolesService:', error);

        if (error.response) {
            // Error de respuesta del servidor
            const mensaje = error.response.data?.message || error.response.data?.error || 'Error al procesar la solicitud';
            const err = new Error(mensaje);
            err.status = error.response.status;
            err.data = error.response.data;
            return err;
        } else if (error.request) {
            // Error de red
            return new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            // Error de validación u otro
            return error;
        }
    }
};
