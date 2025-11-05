/**
 * Servicio de Proveedores
 */

const ProveedoresService = {

    /**
     * Obtener inventario de un producto por sucursal (NUEVO)
     */
    async getInventarioProducto(productoId, sucursalId = null) {
        try {
            let url = `/productos/${productoId}/inventario`;
            if (sucursalId) {
                url += `?sucursal_id=${sucursalId}`;
            }
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },
    /**
     * Obtener todos los proveedores activos
     */
    async getProveedores(filtros = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filtros.activo !== undefined) params.append('activo', filtros.activo);
            if (filtros.buscar) params.append('buscar', filtros.buscar);

            const response = await axios.get(`/compras/proveedores?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener proveedor por ID
     */
    async getProveedorById(id) {
        try {
            const response = await axios.get(`/compras/proveedores/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear proveedor
     */
    async createProveedor(data) {
        try {
            const response = await axios.post('/compras/proveedores', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Actualizar proveedor
     */
    async updateProveedor(id, data) {
        try {
            const response = await axios.put(`/compras/proveedores/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Eliminar (desactivar) proveedor
     */
    async deleteProveedor(id) {
        try {
            const response = await axios.delete(`/compras/proveedores/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Validar datos del proveedor
     */
    validarDatosProveedor(proveedorData) {
        const errores = [];

        // Validar nombre (obligatorio)
        if (!proveedorData.nombre || proveedorData.nombre.trim() === '') {
            errores.push('El nombre del proveedor es obligatorio');
        } else if (proveedorData.nombre.trim().length < 3) {
            errores.push('El nombre debe tener al menos 3 caracteres');
        }

        // Validar email si está presente
        if (proveedorData.email && proveedorData.email.trim() !== '') {
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(proveedorData.email)) {
                errores.push('El email no tiene un formato válido');
            }
        }

        // Validar teléfono si está presente
        if (proveedorData.telefono && proveedorData.telefono.trim() !== '') {
            const telefonoLimpio = proveedorData.telefono.replace(/\D/g, '');
            if (telefonoLimpio.length !== 8) {
                errores.push('El teléfono debe tener 8 dígitos');
            }
        }

        return {
            valido: errores.length === 0,
            errores
        };
    },

    /**
     * Formatear teléfono (agregar guión)
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
     * Validar email
     */
    validarEmail(email) {
        if (!email || email.trim() === '') return true; // Email es opcional

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(email);
    },

    /**
     * Validar teléfono guatemalteco
     */
    validarTelefono(telefono) {
        if (!telefono || telefono.trim() === '') return true; // Teléfono es opcional

        const telefonoLimpio = telefono.replace(/\D/g, '');
        return telefonoLimpio.length === 8;
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

// Hacer disponible globalmente
window.ProveedoresService = ProveedoresService;