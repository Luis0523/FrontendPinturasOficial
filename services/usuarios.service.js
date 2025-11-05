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
 * - PUT /api/usuarios/:id/estado
 * - PUT /api/usuarios/:id/password
 * =====================================================
 */

const UsuariosService = {

    /**
     * Obtener todos los usuarios
     * @param {Object} filtros - Filtros opcionales (activo, rol, limite, offset)
     * @returns {Promise<Object>} Lista de usuarios
     */
    async obtenerUsuarios(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.activo !== undefined && filtros.activo !== '') {
                params.append('activo', filtros.activo);
            }
            if (filtros.rol) params.append('rol', filtros.rol);
            if (filtros.limite) params.append('limite', filtros.limite);
            if (filtros.offset) params.append('offset', filtros.offset);
            if (filtros.buscar) params.append('buscar', filtros.buscar);
            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);

            const response = await axios.get(`/usuarios?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Buscar usuario por término (nombre, email)
     * @param {String} termino - Término de búsqueda
     * @returns {Promise<Object>} Usuarios encontrados
     */
    async buscarUsuario(termino) {
        try {
            if (!termino || termino.trim().length < 2) {
                return { success: true, data: [] };
            }

            const response = await axios.get(`/usuarios/buscar?termino=${encodeURIComponent(termino)}`);
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
    async obtenerUsuarioPorId(id) {
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
    async crearUsuario(usuarioData) {
        try {
            // Validaciones básicas
            if (!usuarioData.nombre || usuarioData.nombre.trim() === '') {
                throw new Error('El nombre del usuario es requerido');
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

            if (!usuarioData.rol || usuarioData.rol.trim() === '') {
                throw new Error('El rol del usuario es requerido');
            }

            if (!usuarioData.sucursal_id) {
                throw new Error('La sucursal del usuario es requerida');
            }

            // Limpiar datos
            const cleanData = {
                nombre: usuarioData.nombre.trim(),
                email: usuarioData.email.trim().toLowerCase(),
                password: usuarioData.password,
                rol: usuarioData.rol.trim(),
                sucursal_id: parseInt(usuarioData.sucursal_id),
                telefono: usuarioData.telefono ? usuarioData.telefono.trim() : null,
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
    async actualizarUsuario(id, usuarioData) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            // Validaciones básicas
            if (!usuarioData.nombre || usuarioData.nombre.trim() === '') {
                throw new Error('El nombre del usuario es requerido');
            }

            if (!usuarioData.email || usuarioData.email.trim() === '') {
                throw new Error('El email del usuario es requerido');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.email)) {
                throw new Error('El formato del email no es válido');
            }

            if (!usuarioData.rol || usuarioData.rol.trim() === '') {
                throw new Error('El rol del usuario es requerido');
            }

            if (!usuarioData.sucursal_id) {
                throw new Error('La sucursal del usuario es requerida');
            }

            // Limpiar datos (sin password, se actualiza por separado)
            const cleanData = {
                nombre: usuarioData.nombre.trim(),
                email: usuarioData.email.trim().toLowerCase(),
                rol: usuarioData.rol.trim(),
                sucursal_id: parseInt(usuarioData.sucursal_id),
                telefono: usuarioData.telefono ? usuarioData.telefono.trim() : null,
                activo: usuarioData.activo !== undefined ? usuarioData.activo : true
            };

            const response = await axios.put(`/usuarios/${id}`, cleanData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Cambiar contraseña de usuario
     * @param {Number} id - ID del usuario
     * @param {String} nuevaPassword - Nueva contraseña
     * @param {String} passwordActual - Contraseña actual (opcional, para validar)
     * @returns {Promise<Object>} Resultado
     */
    async cambiarPassword(id, nuevaPassword, passwordActual = null) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            if (!nuevaPassword || nuevaPassword.trim() === '') {
                throw new Error('La nueva contraseña es requerida');
            }

            if (nuevaPassword.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            const data = {
                password: nuevaPassword
            };

            if (passwordActual) {
                data.password_actual = passwordActual;
            }

            const response = await axios.put(`/usuarios/${id}/password`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Cambiar estado de usuario (activar/desactivar)
     * @param {Number} id - ID del usuario
     * @param {Boolean} activo - Nuevo estado
     * @returns {Promise<Object>} Usuario actualizado
     */
    async cambiarEstado(id, activo) {
        try {
            if (!id) {
                throw new Error('El ID del usuario es requerido');
            }

            const response = await axios.put(`/usuarios/${id}/estado`, {
                activo: Boolean(activo)
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar usuario (soft delete)
     * @param {Number} id - ID del usuario
     * @returns {Promise<Object>} Resultado
     */
    async eliminarUsuario(id) {
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
     * Obtener roles disponibles del sistema
     * @returns {Array} Lista de roles
     */
    getRolesDisponibles() {
        return [
            { value: 'Administrador', label: 'Administrador', descripcion: 'Acceso completo al sistema' },
            { value: 'Gerente', label: 'Gerente', descripcion: 'Gestión general y reportes' },
            { value: 'Bodeguero', label: 'Bodeguero', descripcion: 'Inventario y compras' },
            { value: 'Cajero', label: 'Cajero', descripcion: 'Ventas y punto de venta' },
            { value: 'Vendedor', label: 'Vendedor', descripcion: 'Productos y ventas' }
        ];
    },

    /**
     * Validar permisos para gestionar usuarios
     * @returns {Boolean} True si tiene permisos
     */
    validarPermisos() {
        // Solo administradores pueden crear/editar usuarios
        return Permissions.canManageUsers();
    },

    /**
     * Validar si puede ver usuarios
     * @returns {Boolean} True si puede ver
     */
    puedeVerUsuarios() {
        // Administradores y gerentes pueden ver usuarios
        return Permissions.canViewUsers();
    },

    /**
     * Obtener el usuario actual del sistema
     * @returns {Object} Usuario actual
     */
    getUsuarioActual() {
        return Storage.getUser();
    },

    /**
     * Verificar si el usuario puede editar/eliminar a otro usuario
     * @param {Object} usuario - Usuario objetivo
     * @returns {Boolean} True si puede editar
     */
    puedeEditarUsuario(usuario) {
        const usuarioActual = this.getUsuarioActual();

        // No puede editar su propio usuario desde este módulo
        if (usuario.id === usuarioActual.id) {
            return false;
        }

        // Solo admin puede editar usuarios
        return Permissions.canManageUsers();
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
