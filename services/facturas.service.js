
const FacturasService = {

    async getFacturas(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
            if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
            if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.serie) params.append('serie', filtros.serie);
            if (filtros.numero) params.append('numero', filtros.numero);
            if (filtros.desde) params.append('desde', filtros.desde);
            if (filtros.hasta) params.append('hasta', filtros.hasta);
            if (filtros.limite) params.append('limite', filtros.limite);

            const queryString = params.toString();
            const url = queryString ? `${API_CONFIG.baseURL}/ventas/facturas?${queryString}` : `${API_CONFIG.baseURL}/ventas/facturas`;

            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            throw error.response?.data || { success: false, message: 'Error al obtener las facturas' };
        }
    },

    async getFacturaById(facturaId) {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/ventas/facturas/${facturaId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener factura:', error);
            throw error.response?.data || { success: false, message: 'Error al obtener la factura' };
        }
    },

    async getPagosFactura(facturaId) {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/ventas/facturas/${facturaId}/pagos`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            throw error.response?.data || { success: false, message: 'Error al obtener los pagos' };
        }
    },

    async anularFactura(facturaId, motivoAnulacion) {
        try {
            const usuarioData = StorageUtils.getItem('usuario');
            if (!usuarioData || !usuarioData.id) {
                throw { success: false, message: 'Usuario no autenticado' };
            }

            const response = await axios.put(`${API_CONFIG.baseURL}/ventas/facturas/${facturaId}/anular`, {
                usuario_id: usuarioData.id,
                motivo_anulacion: motivoAnulacion
            });
            return response.data;
        } catch (error) {
            console.error('Error al anular factura:', error);
            throw error.response?.data || { success: false, message: 'Error al anular la factura' };
        }
    }
};
