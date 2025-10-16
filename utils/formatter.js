/**
 * Utilidades para formatear datos
 */

const Formatter = {
    /**
     * Formatear moneda guatemalteca
     * @param {number} amount - Cantidad a formatear
     * @returns {string} - Ejemplo: "Q 1,250.50"
     */
    currency(amount) {
        if (amount === null || amount === undefined) return 'Q 0.00';
        return `Q ${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    },

    /**
     * Formatear número con comas
     * @param {number} number - Número a formatear
     * @returns {string} - Ejemplo: "1,250"
     */
    number(number) {
        if (number === null || number === undefined) return '0';
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Formatear fecha
     * @param {string} dateString - Fecha en formato ISO
     * @param {boolean} includeTime - Si incluir hora
     * @returns {string} - Ejemplo: "16/10/2024" o "16/10/2024 10:30"
     */
    date(dateString, includeTime = false) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        let formatted = `${day}/${month}/${year}`;
        
        if (includeTime) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            formatted += ` ${hours}:${minutes}`;
        }
        
        return formatted;
    },

    /**
     * Formatear fecha relativa (hace X tiempo)
     * @param {string} dateString - Fecha en formato ISO
     * @returns {string} - Ejemplo: "Hace 2 horas"
     */
    dateRelative(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} horas`;
        if (diffDays < 7) return `Hace ${diffDays} días`;
        
        return this.date(dateString);
    },

    /**
     * Formatear porcentaje
     * @param {number} value - Valor decimal (0.15 = 15%)
     * @returns {string} - Ejemplo: "15%"
     */
    percentage(value) {
        if (value === null || value === undefined) return '0%';
        return `${(value * 100).toFixed(2)}%`;
    },

    /**
     * Truncar texto
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @returns {string}
     */
    truncate(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};