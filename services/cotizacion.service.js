/**
 * ===================================================
 * COTIZACIÓN SERVICE
 * =====================================================
 * Servicio para generar cotizaciones en PDF
 * ===================================================
 */

const CotizacionService = {

    /**
     * Generar cotización PDF desde el carrito
     * @param {Object} datosCarrito - Datos del carrito con items y totales
     * @param {Object} datosCliente - Información opcional del cliente
     */
    generarCotizacionPDF(datosCarrito, datosCliente = {}) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // ============ CONFIGURACIÓN ============
            const pageWidth = doc.internal.pageSize.getWidth();
            const marginLeft = 15;
            const marginRight = 15;
            let currentY = 20;

            // Colores corporativos
            const colorPrincipal = [220, 38, 38]; // Rojo
            const colorSecundario = [75, 85, 99]; // Gris
            const colorTexto = [31, 41, 55]; // Gris oscuro

            // ============ ENCABEZADO ============
            // Título principal
            doc.setFontSize(24);
            doc.setTextColor(...colorPrincipal);
            doc.setFont('helvetica', 'bold');
            doc.text('COTIZACIÓN', pageWidth / 2, currentY, { align: 'center' });

            currentY += 10;

            // Información de la empresa
            doc.setFontSize(14);
            doc.setTextColor(...colorTexto);
            doc.setFont('helvetica', 'bold');
            doc.text('Pinturas Premium', pageWidth / 2, currentY, { align: 'center' });

            currentY += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorSecundario);
            doc.text('Tu aliado en cada proyecto de pintura', pageWidth / 2, currentY, { align: 'center' });

            currentY += 5;
            doc.text('Tel: (502) 3201-3122 | Email: info@pinturaspremium.com', pageWidth / 2, currentY, { align: 'center' });

            currentY += 12;

            // Línea separadora
            doc.setDrawColor(...colorPrincipal);
            doc.setLineWidth(0.5);
            doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

            currentY += 10;

            // ============ INFORMACIÓN DE LA COTIZACIÓN ============
            const fechaActual = new Date();
            const fechaFormateada = fechaActual.toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const numeroCotizacion = `COT-${fechaActual.getTime()}`;
            const vigenciaHasta = new Date(fechaActual);
            vigenciaHasta.setDate(vigenciaHasta.getDate() + 15);
            const vigenciaFormateada = vigenciaHasta.toLocaleDateString('es-GT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.setFontSize(10);
            doc.setTextColor(...colorTexto);
            doc.setFont('helvetica', 'bold');
            doc.text(`Número de Cotización:`, marginLeft, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(numeroCotizacion, marginLeft + 50, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text(`Fecha de Emisión:`, marginLeft, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(fechaFormateada, marginLeft + 50, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text(`Válida hasta:`, marginLeft, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(vigenciaFormateada, marginLeft + 50, currentY);

            // Información del cliente (si está disponible)
            if (datosCliente.nombre_cliente) {
                currentY += 10;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('DATOS DEL CLIENTE', marginLeft, currentY);

                currentY += 6;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Nombre: ${datosCliente.nombre_cliente}`, marginLeft, currentY);

                if (datosCliente.telefono_cliente) {
                    currentY += 5;
                    doc.text(`Teléfono: ${datosCliente.telefono_cliente}`, marginLeft, currentY);
                }

                if (datosCliente.email_cliente) {
                    currentY += 5;
                    doc.text(`Email: ${datosCliente.email_cliente}`, marginLeft, currentY);
                }

                if (datosCliente.nit_cliente && datosCliente.nit_cliente !== 'CF') {
                    currentY += 5;
                    doc.text(`NIT: ${datosCliente.nit_cliente}`, marginLeft, currentY);
                }
            }

            currentY += 12;

            // ============ TABLA DE PRODUCTOS ============
            const tableData = datosCarrito.items.map((item, index) => {
                return [
                    (index + 1).toString(),
                    item.codigo_sku || 'N/A',
                    item.nombre_completo || 'Producto',
                    item.cantidad.toString(),
                    `Q ${item.precio_unitario.toFixed(2)}`,
                    `Q ${item.subtotal.toFixed(2)}`
                ];
            });

            doc.autoTable({
                startY: currentY,
                head: [['#', 'Código SKU', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: colorPrincipal,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: colorTexto
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: 'center' },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 65 },
                    3: { cellWidth: 12, halign: 'center' },
                    4: { cellWidth: 23, halign: 'right' },
                    5: { cellWidth: 23, halign: 'right' }
                },
                margin: { left: marginLeft, right: marginRight }
            });

            // Obtener la posición Y después de la tabla
            currentY = doc.lastAutoTable.finalY + 10;

            // ============ TOTALES ============
            const totalesX = pageWidth - marginRight - 60;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorSecundario);
            doc.text('Subtotal:', totalesX, currentY);
            doc.text(`Q ${datosCarrito.totales.subtotal.toFixed(2)}`, totalesX + 35, currentY, { align: 'right' });

            if (datosCarrito.totales.descuento_total > 0) {
                currentY += 6;
                doc.text('Descuentos:', totalesX, currentY);
                doc.text(`- Q ${datosCarrito.totales.descuento_total.toFixed(2)}`, totalesX + 35, currentY, { align: 'right' });
            }

            currentY += 8;
            doc.setDrawColor(...colorPrincipal);
            doc.setLineWidth(0.3);
            doc.line(totalesX, currentY, pageWidth - marginRight, currentY);

            currentY += 6;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorPrincipal);
            doc.text('TOTAL:', totalesX, currentY);
            doc.text(`Q ${datosCarrito.totales.total.toFixed(2)}`, totalesX + 35, currentY, { align: 'right' });

            currentY += 6;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...colorSecundario);
            doc.text(`(${this.numeroALetras(datosCarrito.totales.total)} quetzales)`, totalesX, currentY);

            currentY += 15;

            // ============ TÉRMINOS Y CONDICIONES ============
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorTexto);
            doc.text('TÉRMINOS Y CONDICIONES:', marginLeft, currentY);

            currentY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorSecundario);

            const terminos = [
                '• Esta cotización tiene una vigencia de 15 días calendario desde la fecha de emisión.',
                '• Los precios están sujetos a cambios sin previo aviso.',
                '• El tiempo de entrega se confirmará al momento de realizar el pedido.',
                '• Los productos están sujetos a disponibilidad en stock.',
                '• Forma de pago: Se aceptan tarjetas de crédito, débito, transferencias y depósitos bancarios.',
                '• Para confirmar su pedido, contacte a nuestro equipo de ventas.'
            ];

            terminos.forEach(termino => {
                doc.text(termino, marginLeft, currentY);
                currentY += 4;
            });

            currentY += 8;

            // ============ INFORMACIÓN DE CONTACTO ============
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorPrincipal);
            doc.text('INFORMACIÓN DE CONTACTO', marginLeft, currentY);

            currentY += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorTexto);
            doc.text('Para realizar su pedido o solicitar más información:', marginLeft, currentY);

            currentY += 5;
            doc.text('📞 WhatsApp: (502) 3201-3122', marginLeft, currentY);

            currentY += 4;
            doc.text('📧 Email: info@pinturaspremium.com', marginLeft, currentY);

            currentY += 4;
            doc.text('🌐 Web: www.pinturaspremium.com', marginLeft, currentY);

            // ============ FOOTER ============
            const footerY = doc.internal.pageSize.getHeight() - 15;
            doc.setFontSize(7);
            doc.setTextColor(...colorSecundario);
            doc.setFont('helvetica', 'italic');
            doc.text('Gracias por su preferencia - Pinturas Premium', pageWidth / 2, footerY, { align: 'center' });

            // ============ GUARDAR PDF ============
            const nombreArchivo = `Cotizacion_${numeroCotizacion}.pdf`;
            doc.save(nombreArchivo);

            return {
                success: true,
                numero: numeroCotizacion,
                fecha: fechaFormateada,
                nombreArchivo: nombreArchivo
            };

        } catch (error) {
            console.error('Error al generar cotización PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Convertir número a letras (simplificado para montos comunes)
     */
    numeroALetras(numero) {
        const entero = Math.floor(numero);
        const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];

        if (entero === 0) return 'cero';
        if (entero < 10) return unidades[entero];
        if (entero >= 10 && entero < 20) return especiales[entero - 10];
        if (entero >= 20 && entero < 100) {
            const d = Math.floor(entero / 10);
            const u = entero % 10;
            return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`;
        }
        if (entero >= 100 && entero < 1000) {
            const c = Math.floor(entero / 100);
            const resto = entero % 100;
            const centenas = c === 1 ? 'cien' : `${unidades[c]}cientos`;
            return resto === 0 ? centenas : `${centenas} ${this.numeroALetras(resto)}`;
        }
        if (entero >= 1000 && entero < 10000) {
            const m = Math.floor(entero / 1000);
            const resto = entero % 1000;
            const miles = m === 1 ? 'mil' : `${unidades[m]} mil`;
            return resto === 0 ? miles : `${miles} ${this.numeroALetras(resto)}`;
        }

        return `${entero}`;
    }
};

// Hacer disponible globalmente
window.CotizacionService = CotizacionService;
