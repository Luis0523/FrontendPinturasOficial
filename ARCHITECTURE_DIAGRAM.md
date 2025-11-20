# Frontend Architecture Diagram

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    HTML VIEW (index.html)                        │  │
│  │  - navbar-container                                             │  │
│  │  - sidebar-container (with permission checks)                  │  │
│  │  - content-wrapper (page-specific content)                     │  │
│  │  - footer-container                                             │  │
│  └──────────────────────┬──────────────────────────────────────────┘  │
│                         │                                              │
│                         ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │           CONTROLLER (state + business logic)                   │  │
│  │  - estado: { items, filters, currentPage, etc }               │  │
│  │  - init()                                                       │  │
│  │  - cargarItems()                                               │  │
│  │  - configurarEventos()                                         │  │
│  │  - save/edit/delete()                                          │  │
│  │  - renderTable()                                               │  │
│  └──────────────────────┬──────────────────────────────────────────┘  │
│                         │                                              │
│                         ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICE (API client)                         │  │
│  │  - getAll()                                                     │  │
│  │  - getById(id)                                                  │  │
│  │  - create(data)                                                 │  │
│  │  - update(id, data)                                             │  │
│  │  - delete(id)                                                   │  │
│  │  - handleError(error)                                           │  │
│  └──────────────────────┬──────────────────────────────────────────┘  │
│                         │                                              │
└─────────────────────────┼──────────────────────────────────────────────┘
                          │
                          ▼ (Axios HTTP Request)
          ┌───────────────────────────────────────┐
          │    API CONFIG (config/api.js)         │
          │  - Base URL: localhost:5000/api       │
          │  - Request Interceptor (Bearer token) │
          │  - Response Interceptor (401 -> login)│
          └────────────────┬──────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────┐
          │   BACKEND API (Node.js Express)   │
          │   http://localhost:5000/api       │
          │   - /usuarios/login               │
          │   - /productos                    │
          │   - /reportes                     │
          │   - /ventas                       │
          │   - /compras                      │
          │   - /clientes                     │
          │   - etc                           │
          └────────────────┬───────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────┐
          │         DATABASE                   │
          │     (MySQL/PostgreSQL)             │
          └────────────────────────────────────┘
```

## Module Structure Pattern

```
SINGLE MODULE (e.g., Reportes)
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  /views/reportes/index.html (443 lines)                     │
│  ├─ <!DOCTYPE html>                                         │
│  ├─ <head>                                                  │
│  │  ├─ Title, Meta tags                                    │
│  │  ├─ <link> Bootstrap CSS                               │
│  │  ├─ <link> Bootstrap Icons                             │
│  │  ├─ <link> Chart.js                                    │
│  │  ├─ <link> Custom CSS                                 │
│  │  └─ Language: es (Spanish)                             │
│  ├─ <body>                                                 │
│  │  ├─ <div class="main-wrapper">                         │
│  │  │  ├─ <div id="sidebar-container"></div>             │
│  │  │  ├─ <div class="main-content">                      │
│  │  │  │  ├─ <div id="navbar-container"></div>           │
│  │  │  │  ├─ <div class="content-wrapper">               │
│  │  │  │  │  ├─ <div class="page-header">               │
│  │  │  │  │  │  ├─ <h1> Page title                      │
│  │  │  │  │  │  └─ <div> Breadcrumb                     │
│  │  │  │  │  ├─ <div class="row g-3 mb-4">             │
│  │  │  │  │  │  ├─ Dashboard stat cards (4)             │
│  │  │  │  │  │  └─ Icons, values, styling               │
│  │  │  │  │  ├─ <div class="card">                       │
│  │  │  │  │  │  └─ Filters (month, year, date picker)   │
│  │  │  │  │  ├─ <div class="card">                       │
│  │  │  │  │  │  ├─ <canvas id="chartName"></canvas>    │
│  │  │  │  │  │  └─ Multiple chart containers             │
│  │  │  │  │  ├─ <div class="card">                       │
│  │  │  │  │  │  └─ <table> Top products                  │
│  │  │  │  │  └─ <div id="modalDetalleVenta">             │
│  │  │  │  │     └─ Modal for details                     │
│  │  │  │  └─ </div>                                       │
│  │  │  │  └─ <div id="footer-container"></div>           │
│  │  │  └─ </div>                                          │
│  │  └─ </div>                                             │
│  └─ <script> tags in order:                               │
│     1. Bootstrap JS (CDN)                                 │
│     2. Axios (CDN)                                        │
│     3. Config (api.js)                                    │
│     4. Utilities (storage, permissions, etc)              │
│     5. Services (auth, specific service)                  │
│     6. App (global app.js)                                │
│     7. Controller (reportes.controller.js)                │
│     8. Initialization script (DOMContentLoaded)           │
│                                                               │
│  /services/reportes.service.js (135 lines)                │
│  ├─ const ReportesService = { ... }                       │
│  ├─ Methods:                                              │
│  │  ├─ getDashboardStats()                               │
│  │  ├─ getVentasMes(mes, anio)                           │
│  │  ├─ getVentasDia(fecha)                               │
│  │  ├─ getComprasMes(mes, anio)                          │
│  │  ├─ getVentasPorCategoria(dias)                       │
│  │  ├─ getMetodosPago(dias)                              │
│  │  ├─ getTopProductos(limit, dias)                      │
│  │  ├─ getDetalleFactura(facturaId)                      │
│  │  └─ handleError(error)                                │
│  └─ window.ReportesService = ReportesService;            │
│                                                               │
│  /controllers/reportes.controller.js (717 lines)          │
│  ├─ const ReportesController = { ... }                    │
│  ├─ STATE:                                                │
│  │  ├─ charts: {}                                         │
│  │  ├─ mesActual: number                                  │
│  │  ├─ anioActual: number                                 │
│  │  └─ facturaActual: object                              │
│  ├─ METHODS:                                              │
│  │  ├─ init()                                             │
│  │  ├─ llenarSelectores()                                 │
│  │  ├─ configurarEventos()                                │
│  │  ├─ cargarDashboardStats()                             │
│  │  ├─ cargarGraficas()                                   │
│  │  ├─ cargarGraficaComprasVsVentas()                     │
│  │  ├─ cargarGraficaVentasCategorias()                    │
│  │  ├─ cargarGraficaMetodosPago()                         │
│  │  ├─ cargarTopProductos()                               │
│  │  ├─ cargarVentasDia()                                  │
│  │  ├─ verDetalleVenta(facturaId)                         │
│  │  ├─ reimprimirFactura()                                │
│  │  ├─ imprimirFactura(factura)                           │
│  │  ├─ generarHTMLImpresion(factura)                      │
│  │  ├─ getDiasDelMes(mes, anio)                           │
│  │  ├─ formatMetodoPago(metodo)                           │
│  │  └─ formatMoney(value)                                 │
│  └─ window.ReportesController = ReportesController;       │
│                                                               │
│  In /components/sidebar.html (line 165)                   │
│  ├─ <li data-permission="canViewAllReports">             │
│  │  └─ <a href="/views/reportes/index.html">             │
│  └─ Menu item visible only if user has permission        │
│                                                               │
│  In /utils/permissions.js (line 220)                      │
│  ├─ canViewAllReports() {                                 │
│  │  return this.hasAnyRole([...])                        │
│  └─ }                                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER ACTION (click button)
        │
        ▼
DOM EVENT LISTENER
        │
        ├─ onclick="Controller.method(param)"
        └─ addEventListener('change', callback)
        │
        ▼
CONTROLLER METHOD CALLED
        │
        ├─ Show loading: Loader.show()
        ├─ Update state: this.estado.xxx = value
        ├─ Call service method
        │
        ▼
SERVICE METHOD (Axios HTTP)
        │
        ├─ Build request URL
        ├─ Add auth header (interceptor)
        ├─ Execute request
        │
        ▼
BACKEND API
        │
        ├─ Route handler
        ├─ Query database
        ├─ Return JSON response
        │
        ▼
AXIOS RESPONSE
        │
        ├─ Check status (interceptor)
        ├─ If 401: redirect to login
        ├─ Return response.data
        │
        ▼
BACK TO CONTROLLER
        │
        ├─ Update state with data: this.estado.items = response.data
        ├─ Render UI: this.renderTable()
        ├─ Hide loading: Loader.hide()
        ├─ Show success alert: Alerts.success()
        │
        ▼
UI UPDATE
        │
        ├─ document.getElementById().innerHTML = template
        ├─ OR
        ├─ document.getElementById().textContent = value
        │
        ▼
USER SEES UPDATED DATA
```

## Component Tree

```
ROOT
├─ index.html (PUBLIC LANDING PAGE)
│
└─ /views/ (ADMIN AREA)
   ├─ /auth/
   │  └─ login.html
   │
   ├─ /dashboard/
   │  └─ index.html
   │
   ├─ /productos/
   │  ├─ index.html
   │  └─ catalogo.html
   │
   ├─ /ventas/
   │  ├─ pos.html
   │  └─ facturas.html
   │
   ├─ /compras/
   │  └─ index.html
   │
   ├─ /clientes/
   │  └─ index.html
   │
   ├─ /proveedores/
   │  └─ index.html
   │
   ├─ /usuarios/
   │  ├─ lista.html
   │  └─ perfil.html
   │
   ├─ /reportes/  ← REPORTS MODULE
   │  └─ index.html
   │
   └─ /configuracion/
      ├─ general.html
      ├─ categorias.html
      ├─ marcas.html
      ├─ roles.html
      ├─ presentaciones.html
      └─ sucursales.html

SHARED COMPONENTS
├─ /components/navbar.html
├─ /components/sidebar.html
├─ /components/footer.html
└─ /components/modals/
   ├─ modal-cliente.html
   ├─ modal-producto.html
   ├─ modal-orden-compra.html
   └─ ... (10+ more modals)

GLOBAL FILES
├─ /config/api.js
├─ /assets/js/app.js
├─ /assets/css/style.css
├─ /assets/css/public.css
└─ /assets/css/dashboard.css

SERVICES
├─ /services/auth.service.js
├─ /services/reportes.service.js ← REPORTS SERVICE
├─ /services/productos.service.js
├─ /services/ventas.service.js
├─ /services/compras.service.js
├─ /services/clientes.service.js
├─ /services/usuarios.service.js
├─ /services/proveedores.service.js
└─ ... (9+ more services)

CONTROLLERS
├─ /controllers/auth.controller.js
├─ /controllers/reportes.controller.js ← REPORTS CONTROLLER
├─ /controllers/productos.controller.js
├─ /controllers/ventas.controller.js
├─ /controllers/compras.controller.js
├─ /controllers/clientes.controller.js
├─ /controllers/usuarios.controller.js
├─ /controllers/proveedores.controller.js
└─ ... (11+ more controllers)

UTILITIES
├─ /utils/storage.js
├─ /utils/permissions.js
├─ /utils/alerts.js
├─ /utils/loader.js
├─ /utils/formatter.js
└─ /utils/validator.js
```

## Permission Enforcement Flow

```
SIDEBAR MENU RENDERING
├─ Read data-permission attribute
│  └─ e.g., data-permission="canViewAllReports"
│
├─ Call applyPermissions() in app.js
│  └─ Query all [data-permission] elements
│     └─ For each element:
│        └─ Check Permissions[permissionName]()
│
└─ If permission returns false:
   └─ Hide element with display: none

PAGE LOAD ACCESS CONTROL
├─ Controller init() method
│  └─ Call requirePermission(Permissions.canViewAllReports)
│
├─ In requirePermission():
│  ├─ Check authentication: AuthService.isAuthenticated()
│  ├─ Check token expiry: AuthService.isTokenExpired()
│  └─ Check permission: Permissions.canViewAllReports()
│
└─ If any check fails:
   └─ Redirect to login or dashboard

PERMISSION CHECK EXAMPLE
Permissions.canViewAllReports() {
    return this.hasAnyRole([
        this.ROLES.ADMINISTRADOR,  ← Roles that can view
        this.ROLES.GERENTE         ← Can access reports
    ]);
}

├─ Gets user role from Storage.getUser().rol
├─ Checks if role is in allowed list
└─ Returns true/false

ROLES HIERARCHY
├─ Administrador (ALL PERMISSIONS)
├─ Gerente (MOST PERMISSIONS)
├─ Bodeguero (INVENTORY & PURCHASES)
├─ Cajero (SALES OPERATIONS)
└─ Vendedor (LIMITED SALES)
```

## Chart.js Integration

```
CHART LIFECYCLE
└─ cargarGraficaComprasVsVentas()
   │
   ├─ Fetch data:
   │  ├─ ReportesService.getVentasMes(mes, anio)
   │  └─ ReportesService.getComprasMes(mes, anio)
   │
   ├─ Prepare data:
   │  ├─ getDiasDelMes(mes, anio) → [1,2,3...,31]
   │  └─ Map days to values
   │
   ├─ Destroy old chart:
   │  └─ this.charts.comprasVsVentas?.destroy()
   │
   ├─ Get canvas context:
   │  └─ document.getElementById('chartComprasVsVentas').getContext('2d')
   │
   ├─ Create new Chart:
   │  ├─ type: 'line'
   │  ├─ data: { labels, datasets }
   │  └─ options: { responsive, scales, tooltip, legend }
   │
   ├─ Store reference:
   │  └─ this.charts.comprasVsVentas = chartInstance
   │
   └─ On filter change (month/year):
      └─ Call cargarGraficas() → Repeat above process
```

## Error Handling Flow

```
TRY/CATCH PATTERN

try {
    // Call service method
    const response = await ServiceName.method();
    
    // Update state
    this.estado.items = response.data;
    
    // Render UI
    this.renderTable();
    
} catch (error) {
    // Log for debugging
    console.error('Error message:', error);
    
    // Show user-friendly alert
    Alerts.error('Human-readable error message');
    
    // Optional: fallback rendering
    document.getElementById('table').innerHTML = 
        '<tr><td>Error loading data</td></tr>';
        
} finally {
    // Always cleanup
    Loader.hide();
    modal?.hide();
}

SERVICE ERROR HANDLING

handleError(error) {
    if (error.response) {
        // Server returned error response
        return new Error(error.response.data.message);
    } else if (error.request) {
        // Request made but no response
        return new Error('No se pudo conectar con el servidor');
    } else {
        // Request setup error
        return new Error('Error al procesar la solicitud');
    }
}

AXIOS INTERCEPTOR (Global Error Handling)

axios.interceptors.response.use(
    response => response,
    error => {
        // Handle 401 (Unauthorized)
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/views/auth/login.html';
        }
        return Promise.reject(error);
    }
);
```

## State Management Pattern

```
CONTROLLER STATE STRUCTURE

const ModuleController = {
    
    // STATE - All data for this module
    estado: {
        // Data arrays
        items: [],
        itemsFiltrados: [],
        
        // Single item being edited
        itemActual: null,
        
        // Filter values
        filtros: {
            proveedor: '',
            estado: '',
            fecha_desde: '',
            fecha_hasta: ''
        },
        
        // Pagination
        paginaActual: 1,
        productosPorPagina: 12,
        
        // Search term
        terminoBusqueda: ''
    },
    
    // ACTIONS - Methods that modify state
    async cargarItems() {
        const response = await ModuleService.getAll();
        this.estado.items = response.data;
        this.renderTable();
    },
    
    updateFiltro(nombre, valor) {
        this.estado.filtros[nombre] = valor;
        this.aplicarFiltros();
    },
    
    aplicarFiltros() {
        // Filter this.estado.items based on this.estado.filtros
        // Update this.estado.itemsFiltrados
        this.renderTable();
    }
};

STATE UPDATE FLOW
┌──────────────────────┐
│ User Action (click)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Event Handler Called             │
│ updateFiltro('estado', 'ACTIVO')│
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Update State                     │
│ estado.filtros.estado = 'ACTIVO' │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Call Render Method               │
│ this.renderTable()               │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Update DOM                       │
│ tbody.innerHTML = html            │
└──────────────────────────────────┘
```

---

This architecture provides:
1. Clear separation of concerns (Views, Controllers, Services)
2. Consistent patterns across all modules
3. Easy to test and maintain
4. Scalable for adding new features
5. Built-in error handling and permission system
