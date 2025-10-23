

const InventarioService = {
    
    /**
     * Obtener inventario completo de una sucursal
     * @param {Number} sucursalId - ID de la sucursal
     * @param {Object} opciones - Opciones adicionales (alerta, buscar)
     * @returns {Promise<Object>} Inventario de la sucursal
     */
    async getInventarioSucursal(sucursalId, opciones = {}) {
        try {
            const params = new URLSearchParams();
            
            if (opciones.alerta) params.append('alerta', opciones.alerta);
            if (opciones.buscar) params.append('buscar', opciones.buscar);
            console.log(`/inventario/sucursal/${sucursalId}?${params.toString()}`);
            const response = await axios.get(`/inventario/sucursal/${sucursalId}?${params.toString()}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener inventario con alertas de stock bajo
     * @param {Number} sucursalId - ID de la sucursal
     * @returns {Promise<Object>} Productos con stock bajo
     */
    async getInventarioConAlertas(sucursalId) {
        try {
            const response = await axios.get(`/inventario/sucursal/${sucursalId}/alertas`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener stock de un producto en todas las sucursales
     * @param {Number} productoPresentacionId - ID del producto-presentación
     * @returns {Promise<Object>} Stock en todas las sucursales
     */
    async getStockProducto(productoPresentacionId) {
        try {
            const response = await axios.get(`/inventario/producto-presentacion/${productoPresentacionId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener todas las alertas de stock bajo
     * @param {Number} sucursalId - ID de la sucursal (opcional)
     * @returns {Promise<Object>} Productos con stock bajo
     */
    async getAlertasStock(sucursalId = null) {
        try {
            const url = sucursalId 
                ? `/inventario/alertas?sucursal_id=${sucursalId}`
                : '/inventario/alertas';
            
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener productos agotados
     * @param {Number} sucursalId - ID de la sucursal (opcional)
     * @returns {Promise<Object>} Productos sin stock
     */
    async getProductosAgotados(sucursalId = null) {
        try {
            const url = sucursalId 
                ? `/inventario/agotados?sucursal_id=${sucursalId}`
                : '/inventario/agotados';
            
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Crear o actualizar inventario
     * @param {Object} data - Datos del inventario
     * @returns {Promise<Object>} Inventario creado/actualizado
     */
    async upsertInventario(data) {
        try {
            const response = await axios.post('/inventario', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Ajustar inventario (sumar o restar stock)
     * @param {Object} data - Datos del ajuste
     * @returns {Promise<Object>} Inventario ajustado
     */
    async ajustarInventario(data) {
        try {
            // data = {
            //   sucursal_id: 1,
            //   producto_presentacion_id: 1,
            //   cantidad: 10 (positivo para sumar, negativo para restar),
            //   motivo: "Descripción del ajuste"
            // }
            const response = await axios.post('/inventario/ajuste', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Trasladar stock entre sucursales
     * @param {Object} data - Datos del traslado
     * @returns {Promise<Object>} Resultado del traslado
     */
    async trasladarInventario(data) {
        try {
            // data = {
            //   producto_presentacion_id: 1,
            //   sucursal_origen_id: 1,
            //   sucursal_destino_id: 2,
            //   cantidad: 10
            // }
            const response = await axios.post('/inventario/traslado', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Validar disponibilidad de stock para una venta
     * @param {Number} sucursalId - ID de la sucursal
     * @param {Array} items - Items a validar [{producto_presentacion_id, cantidad}]
     * @returns {Promise<Object>} Resultado de la validación
     */
    async validarStockParaVenta(sucursalId, items) {
        try {
            // Obtener inventario de la sucursal
            const inventarioResponse = await this.getInventarioSucursal(sucursalId);
            
            if (!inventarioResponse.success) {
                throw new Error('Error al obtener el inventario');
            }

            const inventario = inventarioResponse.data;
            const validacion = {
                valido: true,
                errores: [],
                advertencias: []
            };

            // Validar cada item
            items.forEach(item => {
                const stock = inventario.find(
                    inv => inv.producto_presentacion_id === item.producto_presentacion_id
                );

                if (!stock) {
                    validacion.valido = false;
                    validacion.errores.push({
                        producto_presentacion_id: item.producto_presentacion_id,
                        mensaje: 'Producto no encontrado en el inventario de esta sucursal'
                    });
                } else if (stock.existencia < item.cantidad) {
                    validacion.valido = false;
                    validacion.errores.push({
                        producto_presentacion_id: item.producto_presentacion_id,
                        producto: stock.productoPresentacion?.producto?.descripcion || 'Producto',
                        presentacion: stock.productoPresentacion?.presentacion?.nombre || '',
                        disponible: stock.existencia,
                        solicitado: item.cantidad,
                        mensaje: `Stock insuficiente. Disponible: ${stock.existencia}, Solicitado: ${item.cantidad}`
                    });
                } else if (stock.existencia === item.cantidad) {
                    // Advertencia si se va a agotar
                    validacion.advertencias.push({
                        producto_presentacion_id: item.producto_presentacion_id,
                        mensaje: 'Esta venta agotará el stock de este producto'
                    });
                } else if (stock.estado === 'BAJO' || (stock.existencia - item.cantidad) <= stock.minimo) {
                    // Advertencia si quedará con stock bajo
                    validacion.advertencias.push({
                        producto_presentacion_id: item.producto_presentacion_id,
                        mensaje: 'Después de esta venta el stock quedará bajo el mínimo'
                    });
                }
            });

            return validacion;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Obtener estadísticas del inventario de una sucursal
     * @param {Number} sucursalId - ID de la sucursal
     * @returns {Promise<Object>} Estadísticas del inventario
     */
    async getEstadisticasInventario(sucursalId) {
        try {
            const response = await this.getInventarioSucursal(sucursalId);
            
            if (!response.success) {
                throw new Error('Error al obtener el inventario');
            }

            const inventario = response.data;
            
            const estadisticas = {
                total_productos: inventario.length,
                con_stock: inventario.filter(item => item.existencia > 0).length,
                sin_stock: inventario.filter(item => item.existencia === 0).length,
                stock_bajo: inventario.filter(item => item.estado === 'BAJO').length,
                valor_total_inventario: inventario.reduce((sum, item) => {
                    // Si el item tiene precio de costo, calcularlo
                    return sum + (item.existencia * (item.precio_costo || 0));
                }, 0)
            };

            return {
                success: true,
                data: estadisticas
            };
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Buscar productos en inventario
     * @param {Number} sucursalId - ID de la sucursal
     * @param {String} termino - Término de búsqueda
     * @returns {Promise<Object>} Productos encontrados
     */
    async buscarEnInventario(sucursalId, termino) {
        try {
            const response = await this.getInventarioSucursal(sucursalId, { buscar: termino });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Verificar si un producto tiene stock disponible
     * @param {Number} sucursalId - ID de la sucursal
     * @param {Number} productoPresentacionId - ID del producto-presentación
     * @param {Number} cantidadRequerida - Cantidad requerida
     * @returns {Promise<Boolean>} Tiene stock disponible
     */
    async tieneStockDisponible(sucursalId, productoPresentacionId, cantidadRequerida) {
        try {
            const response = await this.getInventarioSucursal(sucursalId);
            
            if (!response.success) {
                return false;
            }

            const item = response.data.find(
                inv => inv.producto_presentacion_id === productoPresentacionId
            );

            return item && item.existencia >= cantidadRequerida;
        } catch (error) {
            console.error('Error al verificar stock:', error);
            return false;
        }
    },

    /**
     * Obtener cantidad disponible de un producto
     * @param {Number} sucursalId - ID de la sucursal
     * @param {Number} productoPresentacionId - ID del producto-presentación
     * @returns {Promise<Number>} Cantidad disponible
     */
    async getCantidadDisponible(sucursalId, productoPresentacionId) {
        try {
            const response = await this.getInventarioSucursal(sucursalId);
            
            if (!response.success) {
                return 0;
            }

            const item = response.data.find(
                inv => inv.producto_presentacion_id === productoPresentacionId
            );

            return item ? item.existencia : 0;
        } catch (error) {
            console.error('Error al obtener cantidad disponible:', error);
            return 0;
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
window.InventarioService = InventarioService;