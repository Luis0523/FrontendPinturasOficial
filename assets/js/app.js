/**
 * Configuración global de la aplicación
 */

// Información de la aplicación
const APP_INFO = {
    name: 'Sistema de Pinturas',
    version: '1.0.0',
    company: 'Tu Empresa'
};

/**
 * Función para cargar componentes HTML (navbar, sidebar, footer)
 */
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error('No se pudo cargar el componente');
        
        const html = await response.text();
        const element = document.getElementById(elementId);
        
        if (element) {
            element.innerHTML = html;
        }
    } catch (error) {
        console.error(`Error cargando componente ${componentPath}:`, error);
    }
}

/**
 * Cargar layout completo (navbar + sidebar + footer)
 */


async function loadLayout() {
    await Promise.all([
        loadComponent('navbar-container', '/components/navbar.html'),
        loadComponent('sidebar-container', '/components/sidebar.html'),
        loadComponent('footer-container', '/components/footer.html')
    ]);
    
    console.log('components/sidebar.html cargado');
    // Inicializar componentes después de cargar
    initializeSidebar();
    updateUserInfo();
    applyPermissions();  // ✅ NUEVO: Aplicar permisos
}

/**
 * Aplicar permisos al sidebar (ocultar opciones sin acceso)
 */
function applyPermissions() {
    const menuItems = document.querySelectorAll('[data-permission]');
    
    menuItems.forEach(item => {
        const permission = item.getAttribute('data-permission');
        
        // Verificar si el usuario tiene el permiso
        if (Permissions[permission] && !Permissions[permission]()) {
            item.style.display = 'none';  // Ocultar el item
        }
    });
}

/**
 * Inicializar funcionalidad del sidebar
 */
function initializeSidebar() {
    // Toggle sidebar en móvil
    console.log("cargando SIDEBAR");
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Marcar item activo en el menú
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.sidebar .nav-link');
    
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

/**
 * Actualizar información del usuario en el navbar
 */
function updateUserInfo() {
    const user = Storage.getUser();
    if (!user) return;

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const userAvatarElement = document.getElementById('userAvatar');

    if (userNameElement) userNameElement.textContent = user.nombre;
    if (userRoleElement) userRoleElement.textContent = user.rol;
    if (userAvatarElement) {
        // Mostrar iniciales del nombre
        const initials = user.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        userAvatarElement.textContent = initials;
    }
}

/**
 * Función de logout
 */
async function logout() {
    Alerts.confirm(
        '¿Estás seguro que deseas cerrar sesión?',
        'Cerrar Sesión',
        async () => {
            Loader.show('Cerrando sesión...');
            
            try {
                await AuthService.logout();
                Alerts.success('Sesión cerrada exitosamente');
                
                setTimeout(() => {
                    window.location.href = '/views/auth/login.html';
                }, 1000);
            } catch (error) {
                // Aunque falle, redirigir al login
                Storage.clear();
                window.location.href = '/views/auth/login.html';
            }
        }
    );
}

/**
 * Función helper para hacer peticiones GET
 */
async function fetchData(endpoint, showLoader = true) {
    if (showLoader) Loader.show();
    
    try {
        const response = await axios.get(endpoint);
        return response.data;
    } catch (error) {
        Alerts.error(error.message || 'Error al cargar los datos');
        throw error;
    } finally {
        if (showLoader) Loader.hide();
    }
}

/**
 * Función helper para hacer peticiones POST
 */
async function postData(endpoint, data, showLoader = true) {
    if (showLoader) Loader.show();
    
    try {
        const response = await axios.post(endpoint, data);
        return response.data;
    } catch (error) {
        Alerts.error(error.response?.data?.message || 'Error al guardar los datos');
        throw error;
    } finally {
        if (showLoader) Loader.hide();
    }
}

/**
 * Función helper para hacer peticiones PUT
 */
async function putData(endpoint, data, showLoader = true) {
    if (showLoader) Loader.show();
    
    try {
        const response = await axios.put(endpoint, data);
        return response.data;
    } catch (error) {
        Alerts.error(error.response?.data?.message || 'Error al actualizar los datos');
        throw error;
    } finally {
        if (showLoader) Loader.hide();
    }
}

/**
 * Función helper para hacer peticiones DELETE
 */
async function deleteData(endpoint, showLoader = true) {
    if (showLoader) Loader.show();
    
    try {
        const response = await axios.delete(endpoint);
        return response.data;
    } catch (error) {
        Alerts.error(error.response?.data?.message || 'Error al eliminar');
        throw error;
    } finally {
        if (showLoader) Loader.hide();
    }
}

/**
 * Debounce function para búsquedas
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}