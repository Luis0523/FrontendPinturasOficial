/**
 * Utilidad para manejar localStorage
 * Guarda y recupera datos de forma segura
 */

const Storage = {
    /**
     * Guardar token
     */
    setToken(token) {
        localStorage.setItem('token', token);
    },

    /**
     * Obtener token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Eliminar token
     */
    removeToken() {
        localStorage.removeItem('token');
    },

    /**
     * Guardar usuario
     */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Obtener usuario
     */
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Eliminar usuario
     */
    removeUser() {
        localStorage.removeItem('user');
    },

    /**
     * Verificar si hay sesión activa
     */
    isAuthenticated() {
        return this.getToken() !== null && this.getUser() !== null;
    },

    /**
     * Limpiar todo (logout)
     */
    clear() {
        this.removeToken();
        this.removeUser();
    },

    /**
     * Guardar sesión completa (login)
     */
    setSession(token, user) {
        this.setToken(token);
        this.setUser(user);
    }
};