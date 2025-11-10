/**
 * =====================================================
 * USUARIOS SERVICE
 * =====================================================
 * Servicio para manejar todas las operaciones relacionadas
 * con usuarios en el sistema.
 *
 * Endpoints del backend:
 * - GET /api/usuarios
 * - GET /api/usuarios/:id
 * - POST /api/usuarios
 * - PUT /api/usuarios/:id
 * - DELETE /api/usuarios/:id
 * =====================================================
 */

const UsuariosService = {

    /**
     * Obtener todos los usuarios
     * @param {Object} filtros - Filtros opcionales (activo, rol_id, sucursal_id)
     * @returns {Promise<Object>} Lista de usuarios
     */
    async getUsuarios(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.activo !== undefined && filtros.activo !== '') {
                params.append('activo', filtros.activo);
            }
            if (filtros.rol_id) params.append('rol_id', filtros.rol_id);
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);

            const response = await axios.get(`/usuarios?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Buscar usuario por email o DPI
     * @param {Object} params - { email, dpi }
     * @returns {Promise<Object>} Usuario encontrado
     */
    async buscarUsuario(params) {
        try {
            const query = new URLSearchParams();
            if (params.email) query.append('email', params.email);
            if (params.dpi) query.append('dpi', params.dpi);

            const response = await axios.get(`/usuarios/buscar?${query.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener un usuario por ID
     * @param {Number} id - ID del usuario
     * @returns {Promise<Object>} Usuario
     */
    async getUsuarioById(id) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            const response = await axios.get(`/usuarios/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear nuevo usuario
     * @param {Object} usuarioData - Datos del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    async createUsuario(usuarioData) {
        try {
            // Validaciones básicas
            if (!usuarioData.nombre || usuarioData.nombre.trim() === '') {
                throw new Error('El nombre del usuario es requerido');
            }

            if (!usuarioData.dpi || usuarioData.dpi.trim() === '') {
                throw new Error('El DPI es requerido');
            }

            if (!usuarioData.email || usuarioData.email.trim() === '') {
                throw new Error('El email del usuario es requerido');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.email)) {
                throw new Error('El formato del email no es válido');
            }

            if (!usuarioData.password || usuarioData.password.trim() === '') {
                throw new Error('La contraseña es requerida');
            }

            if (usuarioData.password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            if (!usuarioData.rol_id) {
                throw new Error('El rol del usuario es requerido');
            }

            // Limpiar datos
            const cleanData = {
                nombre: usuarioData.nombre.trim(),
                dpi: usuarioData.dpi.trim(),
                email: usuarioData.email.trim().toLowerCase(),
                password: usuarioData.password,
                rol_id: parseInt(usuarioData.rol_id),
                sucursal_id: usuarioData.sucursal_id ? parseInt(usuarioData.sucursal_id) : null,
                activo: usuarioData.activo !== undefined ? usuarioData.activo : true
            };

            const response = await axios.post('/usuarios', cleanData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar usuario existente
     * @param {Number} id - ID del usuario
     * @param {Object} usuarioData - Datos actualizados del usuario
     * @returns {Promise<Object>} Usuario actualizado
     */
    async updateUsuario(id, usuarioData) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            // Validaciones básicas
            if (!usuarioData.nombre || usuarioData.nombre.trim() === '') {
                throw new Error('El nombre del usuario es requerido');
            }

            if (!usuarioData.dpi || usuarioData.dpi.trim() === '') {
                throw new Error('El DPI es requerido');
            }

            if (!usuarioData.email || usuarioData.email.trim() === '') {
                throw new Error('El email del usuario es requerido');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.email)) {
                throw new Error('El formato del email no es válido');
            }

            if (!usuarioData.rol_id) {
                throw new Error('El rol del usuario es requerido');
            }

            // Limpiar datos (sin password, se actualiza por separado)
            const cleanData = {
                nombre: usuarioData.nombre.trim(),
                dpi: usuarioData.dpi.trim(),
                email: usuarioData.email.trim().toLowerCase(),
                rol_id: parseInt(usuarioData.rol_id),
                sucursal_id: usuarioData.sucursal_id ? parseInt(usuarioData.sucursal_id) : null,
                activo: usuarioData.activo !== undefined ? usuarioData.activo : true
            };

            // Si viene password, agregarla
            if (usuarioData.password && usuarioData.password.trim() !== '') {
                if (usuarioData.password.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }
                cleanData.password = usuarioData.password;
            }

            const response = await axios.put(`/usuarios/${id}`, cleanData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Cambiar contraseña de usuario
     * @param {Number} id - ID del usuario
     * @param {String} currentPassword - Contraseña actual
     * @param {String} newPassword - Nueva contraseña
     * @returns {Promise<Object>} Resultado
     */
    async cambiarPassword(id, currentPassword, newPassword) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            if (!currentPassword || currentPassword.trim() === '') {
                throw new Error('La contraseña actual es requerida');
            }

            if (!newPassword || newPassword.trim() === '') {
                throw new Error('La nueva contraseña es requerida');
            }

            if (newPassword.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            const data = {
                currentPassword,
                newPassword
            };

            const response = await axios.patch(`/usuarios/${id}/cambiar-password`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar usuario (soft delete - desactivar)
     * @param {Number} id - ID del usuario
     * @returns {Promise<Object>} Resultado
     */
    async deleteUsuario(id) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            const response = await axios.delete(`/usuarios/${id}`);
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
        console.error('Error en UsuariosService:', error);

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
