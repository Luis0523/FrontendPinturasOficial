
const PedidosService = {
    async crearPedido(pedidoData) {
        try {
            const response = await axios.post(`${API_CONFIG.baseURL}/ventas/pedidos`, pedidoData);
            return response.data;
        } catch (error) {
            console.error('Error al crear pedido:', error);
            throw error.response?.data || { success: false, message: 'Error al crear el pedido' };
        }
    },

    async getPedidos(filtros = {}) {
        try {
            const params = new URLSearchParams();

            if (filtros.sucursal_id) params.append('sucursal_id', filtros.sucursal_id);
            if (filtros.email) params.append('email', filtros.email);
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.estado_pago) params.append('estado_pago', filtros.estado_pago);
            if (filtros.desde) params.append('desde', filtros.desde);
            if (filtros.hasta) params.append('hasta', filtros.hasta);
            if (filtros.limite) params.append('limite', filtros.limite);

            const queryString = params.toString();
            const url = queryString ? `${API_CONFIG.baseURL}/ventas/pedidos?${queryString}` : `${API_CONFIG.baseURL}/ventas/pedidos`;

            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pedidos:', error);
            throw error.response?.data || { success: false, message: 'Error al obtener los pedidos' };
        }
    },

    async getPedidoById(pedidoId) {
        try {
            const response = await axios.get(`${API_CONFIG.baseURL}/ventas/pedidos/${pedidoId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pedido:', error);
            throw error.response?.data || { success: false, message: 'Error al obtener el pedido' };
        }
    },

    async actualizarEstado(pedidoId, estado, notasInternas = null) {
        try {
            const response = await axios.put(`${API_CONFIG.baseURL}/ventas/pedidos/${pedidoId}/estado`, {
                estado,
                notas_internas: notasInternas
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            throw error.response?.data || { success: false, message: 'Error al actualizar el estado' };
        }
    },

    async cancelarPedido(pedidoId, motivoCancelacion) {
        try {
            const response = await axios.put(`${API_CONFIG.baseURL}/ventas/pedidos/${pedidoId}/cancelar`, {
                motivo_cancelacion: motivoCancelacion
            });
            return response.data;
        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            throw error.response?.data || { success: false, message: 'Error al cancelar el pedido' };
        }
    }
};
