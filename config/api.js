/**
 * Configuración de la API
 * Aquí se definen las URLs base y se configura Axios
 */

// URL base de la API (CAMBIAR SEGÚN TU BACKEND)
const API_BASE_URL = 'http://localhost:5000/api';

// Configuración de Axios
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para agregar el token a todas las peticiones
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token inválido o expirado
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/views/auth/login.html';
        }
        return Promise.reject(error);
    }
);

// Endpoints de la API
const API_ENDPOINTS = {
    // Autenticación
    login: '/usuarios/login',
    logout: '/usuarios/logout',
    
    // Productos
    productos: '/productos',
    productoById: (id) => `/productos/${id}`,
    
    // Categorías
    categorias: '/categorias',
    categoriaById: (id) => `/categorias/${id}`,
    
    // Marcas
    marcas: '/marcas',
    marcaById: (id) => `/marcas/${id}`,
    
    // Presentaciones
    presentaciones: '/presentaciones',
    presentacionById: (id) => `/presentaciones/${id}`,
    
    // Inventario
    inventario: '/inventario',
    inventarioAjuste: '/inventario/ajustes',
    
    // Dashboard
    dashboard: '/reportes/dashboard'
};