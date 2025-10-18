/**
 * Servicio de Autenticación
 * Maneja login, logout y validación de token
 */

const AuthService = {
    /**
     * Login de usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise} - Promesa con la respuesta del servidor
     */
    async login(email, password) {
        try {
            const response = await axios.post(API_ENDPOINTS.login, {
                email,
                password
            });
            console.warn(response.data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Logout de usuario
     */
    async logout() {
        try {
            const response = await axios.post(API_ENDPOINTS.logout);
            return response.data;
        } catch (error) {
            // Aunque falle el logout en el servidor, limpiamos localmente
            throw this.handleError(error);
        } finally {
            // Limpiar storage local siempre
            Storage.clear();
        }
    },

    /**
     * Verificar si hay sesión activa
     */
    isAuthenticated() {
        return Storage.isAuthenticated();
    },

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        console.log(Storage.getUser());
        return Storage.getUser();
    },

    /**
     * Verificar si el token está expirado
     */
    isTokenExpired() {
        const token = Storage.getToken();
        if (!token) return true;

        try {
            // Decodificar JWT (simple, sin validación)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convertir a milisegundos
            return Date.now() >= exp;
        } catch (error) {
            return true;
        }
    },

    /**
     * Redirigir a login si no está autenticado
     */
    requireAuth() {
        if (!this.isAuthenticated() || this.isTokenExpired()) {
            window.location.href = '/views/auth/login.html';
            return false;
        }
        return true;
    },

    /**
     * Manejar errores de autenticación
     */
    handleError(error) {
        if (error.response) {
            // Error de respuesta del servidor
            const message = error.response.data.message || 'Error en el servidor';
            return new Error(message);
        } else if (error.request) {
            // No hubo respuesta del servidor
            return new Error('No se pudo conectar con el servidor');
        } else {
            // Error en la configuración de la petición
            return new Error('Error al procesar la solicitud');
        }
    }
};