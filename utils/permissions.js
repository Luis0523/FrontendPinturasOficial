/**
 * Sistema de permisos basado en roles
 */

const Permissions = {
    /**
     * Roles del sistema
     */
    ROLES: {
        ADMINISTRADOR: 'Administrador',
        BODEGUERO: 'Bodeguero',
        CAJERO: 'Cajero',
        GERENTE: 'Gerente',
        VENDEDOR: 'Vendedor'
    },

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole(requiredRole) {
        const user = Storage.getUser();
        console.log(user);
        console.log('user role:', user ? user.rol : 'no user' );
        if (!user || !user.rol) return false;
        return user.rol === requiredRole;
    },

    /**
     * Verificar si el usuario tiene alguno de los roles especificados
     */
    hasAnyRole(roles = []) {
        const user = Storage.getUser();
        if (!user || !user.rol) return false;
        return roles.includes(user.rol);
    },

    /**
     * Verificar si es administrador
     */
    isAdmin() {
        return this.hasRole(this.ROLES.ADMINISTRADOR);
    },

    /**
     * PERMISOS POR MÓDULO
     * Define qué roles pueden acceder a cada funcionalidad
     */

    // ========== PRODUCTOS ==========
    canViewProducts() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO,
            this.ROLES.VENDEDOR
        ]);
    },

    canCreateProducts() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO,
            this.ROLES.VENDEDOR
            
        ]);
    },

    canEditProducts() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO,
            this.ROLES.VENDEDOR
        ]);
    },

    canDeleteProducts() {
        return this.hasRole(this.ROLES.ADMINISTRADOR);
    },

    // ========== INVENTARIO ==========
    canViewInventory() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    canAdjustInventory() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    canTransferInventory() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    // ========== VENTAS ==========
    canAccessPOS() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.CAJERO,
            this.ROLES.VENDEDOR
        ]);
    },

    canViewSales() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.CAJERO,
            this.ROLES.VENDEDOR
        ]);
    },

    canCancelInvoices() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    // ========== COMPRAS ==========
    canCreatePurchaseOrders() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    canReceivePurchases() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    // ========== CLIENTES ==========
    canViewClients() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.VENDEDOR
        ]);
    },

    canManageClients() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    // ========== PROVEEDORES ==========
    canViewProviders() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    canManageProviders() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    // ========== USUARIOS ==========
    canViewUsers() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    canManageUsers() {
        return this.hasRole(this.ROLES.ADMINISTRADOR);
    },

    // ========== CONFIGURACIÓN ==========
    canAccessSettings() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    canManageSettings() {
        return this.hasRole(this.ROLES.ADMINISTRADOR);
    },

    // ========== REPORTES ==========
    canViewSalesReports() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    canViewInventoryReports() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE,
            this.ROLES.BODEGUERO
        ]);
    },

    canViewAllReports() {
        return this.hasAnyRole([
            this.ROLES.ADMINISTRADOR,
            this.ROLES.GERENTE
        ]);
    },

    /**
     * Obtener información del usuario actual
     */
    getCurrentUser() {
        return Storage.getUser();
    },

    /**
     * Obtener nombre del rol actual
     */
    getCurrentRole() {
        const user = this.getCurrentUser();
        return user ? user.rol : null;
    },

    /**
     * Mostrar mensaje de acceso denegado
     */
    showAccessDenied() {
        Alerts.warning(
            'No tienes permisos para acceder a esta funcionalidad',
            'Acceso Denegado'
        );
    },

    /**
     * Redirigir si no tiene permisos
     */
    redirectIfUnauthorized(checkFunction, redirectTo = '/views/dashboard/index.html') {
        if (!checkFunction.call(this)) {
            this.showAccessDenied();
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 2000);
            return false;
        }
        return true;
    }
};