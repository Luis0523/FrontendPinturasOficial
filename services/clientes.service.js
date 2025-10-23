/**
 * =====================================================
 * CLIENTES SERVICE
 * =====================================================
 * Servicio para manejar todas las operaciones relacionadas
 * con clientes en el sistema.
 * 
 * Endpoints del backend:
 * - GET /api/clientes
 * - GET /api/clientes/:id
 * - GET /api/clientes/buscar
 * - POST /api/clientes
 * - PUT /api/clientes/:id
 * - DELETE /api/clientes/:id
 * =====================================================
 */

const ClientesService = {
    
    /**
     * Obtener todos los clientes
     * @param {Object} filtros - Filtros opcionales (activo, limite, offset)
     * @returns {Promise<Object>} Lista de clientes
     */
    async obtenerClientes(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.activo !== undefined) params.append('activo', filtros.activo);
            if (filtros.limite) params.append('limite', filtros.limite);
            if (filtros.offset) params.append('offset', filtros.offset);
            if (filtros.buscar) params.append('buscar', filtros.buscar);

            const response = await axios.get(`/clientes?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Buscar cliente por término (NIT, nombre, email, teléfono)
     * @param {String} termino - Término de búsqueda
     * @returns {Promise<Object>} Clientes encontrados
     */
    async buscarCliente(termino) {
        try {
            if (!termino || termino.trim().length < 2) {
                return { success: true, data: [] };
            }

            const response = await axios.get(`/clientes/buscar?nit=${encodeURIComponent(termino)}`);
            console.log(response.data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Buscar cliente por NIT específico
     * @param {String} nit - NIT del cliente
     * @returns {Promise<Object>} Cliente encontrado
     */
    async buscarPorNit(nit) {
        try {
            if (!nit || nit.trim() === '') {
                throw new Error('El NIT es requerido');
            }

            const response = await axios.get(`/clientes/buscar?nit=${encodeURIComponent(nit)}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener un cliente por ID
     * @param {Number} id - ID del cliente
     * @returns {Promise<Object>} Cliente
     */
    async obtenerClientePorId(id) {
        try {
            const response = await axios.get(`/clientes/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear nuevo cliente
     * @param {Object} clienteData - Datos del cliente
     * @returns {Promise<Object>} Cliente creado
     */
    async crearCliente(clienteData) {
        try {
            // Validaciones básicas
            if (!clienteData.nombre || clienteData.nombre.trim() === '') {
                throw new Error('El nombre del cliente es requerido');
            }

            // Asignar valores por defecto
            const datosCliente = {
                nombre: clienteData.nombre.trim(),
                nit: clienteData.nit?.trim() || 'CF',
                email: clienteData.email?.trim() || null,
                telefono: clienteData.telefono?.trim() || null,
                direccion: clienteData.direccion?.trim() || null,
                activo: true
            };

            const response = await axios.post('/clientes', datosCliente);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar cliente existente
     * @param {Number} id - ID del cliente
     * @param {Object} clienteData - Datos actualizados
     * @returns {Promise<Object>} Cliente actualizado
     */
    async actualizarCliente(id, clienteData) {
        try {
            const response = await axios.put(`/clientes/${id}`, clienteData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar (desactivar) cliente
     * @param {Number} id - ID del cliente
     * @returns {Promise<Object>} Resultado
     */
    async eliminarCliente(id) {
        try {
            const response = await axios.delete(`/clientes/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Verificar cliente (marcar como verificado)
     * @param {Number} id - ID del cliente
     * @returns {Promise<Object>} Cliente verificado
     */
    async verificarCliente(id) {
        try {
            const response = await axios.patch(`/clientes/${id}/verificar`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener o crear cliente "Consumidor Final"
     * @returns {Object} Cliente CF (Consumer Final)
     */
    obtenerClienteCF() {
        // Cliente por defecto para ventas sin cliente específico
        return {
            id: null,
            nombre: 'CONSUMIDOR FINAL',
            nit: 'CF',
            email: null,
            telefono: null,
            direccion: null,
            esCF: true
        };
    },

    /**
     * Validar NIT guatemalteco (formato básico)
     * @param {String} nit - NIT a validar
     * @returns {Boolean} Es válido
     */
    validarNIT(nit) {
        if (!nit || nit.trim() === '') return false;
        
        // CF es válido
        if (nit.toUpperCase() === 'CF') return true;
        
        // Remover guiones y espacios
        const nitLimpio = nit.replace(/[-\s]/g, '');
        
        // Debe ser numérico y tener entre 7 y 9 dígitos
        const regexNIT = /^\d{7,9}$/;
        
        return regexNIT.test(nitLimpio);
    },

    /**
     * Formatear NIT (agregar guiones)
     * @param {String} nit - NIT sin formato
     * @returns {String} NIT formateado
     */
    formatearNIT(nit) {
        if (!nit) return '';
        
        if (nit.toUpperCase() === 'CF') return 'CF';
        
        // Remover caracteres no numéricos
        const nitLimpio = nit.replace(/\D/g, '');
        
        // Formatear según longitud
        if (nitLimpio.length === 8) {
            return `${nitLimpio.substring(0, 7)}-${nitLimpio.substring(7)}`;
        } else if (nitLimpio.length === 9) {
            return `${nitLimpio.substring(0, 8)}-${nitLimpio.substring(8)}`;
        }
        
        return nitLimpio;
    },

    /**
     * Validar email
     * @param {String} email - Email a validar
     * @returns {Boolean} Es válido
     */
    validarEmail(email) {
        if (!email || email.trim() === '') return true; // Email es opcional
        
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(email);
    },

    /**
     * Validar teléfono guatemalteco
     * @param {String} telefono - Teléfono a validar
     * @returns {Boolean} Es válido
     */
    validarTelefono(telefono) {
        if (!telefono || telefono.trim() === '') return true; // Teléfono es opcional
        
        // Remover caracteres no numéricos
        const telefonoLimpio = telefono.replace(/\D/g, '');
        
        // Debe tener 8 dígitos (formato guatemalteco)
        return telefonoLimpio.length === 8;
    },

    /**
     * Formatear teléfono (agregar guión)
     * @param {String} telefono - Teléfono sin formato
     * @returns {String} Teléfono formateado (XXXX-XXXX)
     */
    formatearTelefono(telefono) {
        if (!telefono) return '';
        
        const telefonoLimpio = telefono.replace(/\D/g, '');
        
        if (telefonoLimpio.length === 8) {
            return `${telefonoLimpio.substring(0, 4)}-${telefonoLimpio.substring(4)}`;
        }
        
        return telefonoLimpio;
    },

    /**
     * Validar datos del cliente antes de crear/actualizar
     * @param {Object} clienteData - Datos del cliente
     * @returns {Object} { valido: boolean, errores: [] }
     */
    validarDatosCliente(clienteData) {
        const errores = [];

        // Validar nombre (obligatorio)
        if (!clienteData.nombre || clienteData.nombre.trim() === '') {
            errores.push('El nombre del cliente es obligatorio');
        } else if (clienteData.nombre.trim().length < 3) {
            errores.push('El nombre debe tener al menos 3 caracteres');
        }

        // Validar NIT
        if (clienteData.nit && !this.validarNIT(clienteData.nit)) {
            errores.push('El NIT no tiene un formato válido');
        }

        // Validar email
        if (clienteData.email && !this.validarEmail(clienteData.email)) {
            errores.push('El email no tiene un formato válido');
        }

        // Validar teléfono
        if (clienteData.telefono && !this.validarTelefono(clienteData.telefono)) {
            errores.push('El teléfono debe tener 8 dígitos');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    },

    /**
     * Obtener clientes cercanos por GPS (si está implementado)
     * @param {Number} latitud - Latitud actual
     * @param {Number} longitud - Longitud actual
     * @param {Number} radio - Radio en km (default: 5)
     * @returns {Promise<Object>} Clientes cercanos
     */
    async obtenerClientesCercanos(latitud, longitud, radio = 5) {
        try {
            const response = await axios.get(
                `/clientes/cercanos?lat=${latitud}&lng=${longitud}&radio=${radio}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Manejo de errores
     * @param {Error} error - Error capturado
     * @returns {Error} Error formateado
     */
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
window.ClientesService = ClientesService;