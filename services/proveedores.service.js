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