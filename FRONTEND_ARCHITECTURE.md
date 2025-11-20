# Frontend Project Analysis - Sistema de Pinturas

## 1. PROJECT STRUCTURE AND ORGANIZATION

```
frontend/
├── index.html                           # Public landing page
├── package.json                         # NPM dependencies (only axios)
├── assets/                              # Static assets
│   ├── css/
│   │   ├── style.css                   # Main admin styles
│   │   ├── public.css                  # Public site styles
│   │   └── dashboard.css               # Dashboard styles
│   ├── js/
│   │   └── app.js                      # Global app configuration
│   └── img/                            # Images and logos
├── config/                              # Configuration files
│   └── api.js                          # API configuration & Axios setup
├── services/                            # API service layer
│   ├── auth.service.js
│   ├── reportes.service.js
│   ├── ventas.service.js
│   ├── compras.service.js
│   ├── productos.service.js
│   ├── clientes.service.js
│   ├── usuarios.service.js
│   ├── proveedores.service.js
│   └── ... (other services)
├── controllers/                         # Business logic layer
│   ├── auth.controller.js
│   ├── reportes.controller.js
│   ├── ventas.controller.js
│   ├── compras.controller.js
│   ├── productos.controller.js
│   ├── clientes.controller.js
│   ├── usuarios.controller.js
│   └── ... (other controllers)
├── views/                               # Page templates
│   ├── auth/
│   │   └── login.html
│   ├── dashboard/
│   │   └── index.html
│   ├── productos/
│   │   ├── index.html
│   │   └── catalogo.html
│   ├── ventas/
│   │   ├── pos.html
│   │   └── facturas.html
│   ├── compras/
│   │   └── index.html
│   ├── clientes/
│   │   └── index.html
│   ├── proveedores/
│   │   └── index.html
│   ├── usuarios/
│   │   ├── lista.html
│   │   └── perfil.html
│   ├── reportes/
│   │   └── index.html                  # ✅ EXISTS - Reports module
│   ├── configuracion/
│   │   ├── general.html
│   │   ├── categorias.html
│   │   ├── marcas.html
│   │   ├── roles.html
│   │   ├── presentaciones.html
│   │   └── sucursales.html
├── components/                          # Reusable HTML components
│   ├── navbar.html
│   ├── sidebar.html
│   ├── footer.html
│   └── modals/                         # Modal templates
│       ├── modal-cliente.html
│       ├── modal-producto.html
│       ├── modal-orden-compra.html
│       └── ... (other modals)
├── utils/                               # Utility functions
│   ├── storage.js                      # LocalStorage wrapper
│   ├── permissions.js                  # Role-based permissions
│   ├── alerts.js                       # Alert/notification system
│   ├── loader.js                       # Loading spinner
│   ├── formatter.js                    # Data formatting utilities
│   └── validator.js                    # Form validation
├── repositories/                        # (Mostly empty)
├── modals/                              # (Mostly empty)
└── js/                                  # (Mostly empty)
```

## 2. TECHNOLOGY STACK

### Frontend Framework
- **Vanilla JavaScript** (No framework like React, Vue, or Angular)
- **Bootstrap 5.3.0** - CSS Framework
- **Bootstrap Icons 1.11.0** - Icon library

### Libraries
- **Axios 1.12.2** - HTTP client for API requests
- **Chart.js 4.4.0** - Data visualization library

### Build/Package Management
- **Node.js** (npm)
- **package.json** with minimal dependencies (just axios)

### Architecture Pattern
- **MVC-like pattern**: Separation between Views (HTML), Controllers (JS), and Services (API calls)
- **Client-side routing**: Direct HTML file navigation
- **Single Page Components**: Some pages have modal-based interactions

## 3. REPORTS MODULE STATUS

### Reports Module EXISTS: ✅ YES

**Location**: `/frontend/views/reportes/index.html`

**Components**:
```
REPORTES MODULE FILES:
├── views/reportes/index.html                    # Main view
├── controllers/reportes.controller.js           # Business logic
├── services/reportes.service.js                 # API calls
└── Sidebar integration (data-permission attribute)
```

**Current Reports Functionality**:
1. Dashboard Statistics
   - Sales today, this week, this month
   - Number of invoices today

2. Charts & Visualizations
   - Line chart: Purchases vs Sales (monthly comparison)
   - Doughnut chart: Sales by Category (last 30 days)
   - Pie chart: Payment Methods (last 30 days)

3. Data Tables
   - Top 10 Best-Selling Products
   - Daily sales transactions
   - Sales details by date

4. Filters
   - Month/Year selection
   - Daily sales date picker

5. Features
   - Invoice detail viewing (modal)
   - Invoice reprint functionality
   - Dynamic chart recreation on filter changes

**Existing API Endpoints** (from reportes.service.js):
```javascript
GET /reportes/dashboard
GET /reportes/ventas/semana
GET /reportes/ventas/mes?mes=X&anio=Y
GET /reportes/ventas/dia?fecha=YYYY-MM-DD
GET /reportes/compras/mes?mes=X&anio=Y
GET /reportes/ventas/categorias?dias=30
GET /reportes/pagos/metodos?dias=30
GET /reportes/ventas/top-productos?limit=10&dias=30
GET /ventas/facturas/{facturaId}  # For detailed invoice view
```

## 4. MODULE STRUCTURE PATTERNS

All modules follow a consistent 3-tier architecture:

### Example: Compras Module

**1. VIEW (HTML Template)**
```html
<!-- /views/compras/index.html -->
- Page header with title and breadcrumb
- Filter card with form controls
- Data table with tbody for dynamic content
- Inline event handlers: onclick="ComprasController.methodName()"
- Modal imports via script tags
- Script loading order:
  1. Bootstrap & Axios
  2. Config (api.js)
  3. Utilities (storage, permissions, alerts, loader, formatter)
  4. Services (auth.service.js, specific service)
  5. App.js (global app functions)
  6. Controller
  7. Initialization script with DOMContentLoaded
```

**2. SERVICE (API Communication)**
```javascript
// /services/compras.service.js
const ComprasService = {
    async getAllCompras() { /* GET request */ },
    async getCompraById(id) { /* GET request */ },
    async createCompra(data) { /* POST request */ },
    async updateCompra(id, data) { /* PUT request */ },
    async deleteCompra(id) { /* DELETE request */ },
    handleError(error) { /* Error handling */ }
};
window.ComprasService = ComprasService;  // Global exposure
```

**3. CONTROLLER (Business Logic)**
```javascript
// /controllers/compras.controller.js
const ComprasController = {
    // STATE
    estado: { /* component state */ },
    
    // LIFECYCLE
    async init() { /* Initialize */ },
    
    // DATA LOADING
    async cargarCompras() { /* Call service */ },
    
    // EVENT HANDLERS
    configurarEventos() { /* Wire up DOM events */ },
    
    // UI UPDATES
    renderTable() { /* Update HTML */ },
    
    // MODALS
    openCreateModal() { /* Show modal */ },
    
    // UTILITIES
    formatMoney() { /* Format values */ }
};
window.ComprasController = ComprasController;  // Global exposure
```

## 5. API INTEGRATION PATTERNS

### Configuration (config/api.js)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request Interceptor - Add Bearer token
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor - Handle 401
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/views/auth/login.html';
        }
        return Promise.reject(error);
    }
);
```

### Service Methods Pattern
```javascript
async getComprasMes(mes, anio) {
    try {
        const params = mes && anio ? `?mes=${mes}&anio=${anio}` : '';
        const response = await axios.get(`/compras/mes${params}`);
        return response.data;
    } catch (error) {
        throw this.handleError(error);
    }
}

handleError(error) {
    if (error.response) {
        return new Error(error.response.data.message || 'Error al obtener datos');
    } else if (error.request) {
        return new Error('No se pudo conectar con el servidor');
    } else {
        return new Error('Error al procesar la solicitud');
    }
}
```

## 6. ROUTING SETUP

### Type: Direct HTML File Navigation
- **No router library** (no React Router, Vue Router, etc.)
- **Navigation**: Direct href links to `.html` files
- **URL structure**: `/views/{module}/index.html` or `/views/{module}/{page}.html`

### Sidebar Navigation (components/sidebar.html)
```html
<a class="nav-link" href="/views/productos/index.html">
<a class="nav-link" href="/views/ventas/pos.html">
<a class="nav-link" href="/views/compras/index.html">
<a class="nav-link" href="/views/reportes/index.html">  ✅ Reports
```

### Permission-based Navigation
```html
<li class="nav-item mb-2" data-permission="canViewAllReports">
    <a class="nav-link text-white" href="/views/reportes/index.html">
        <i class="bi bi-graph-up-arrow me-2"></i>
        <span>Reportes y Estadísticas</span>
    </a>
</li>
```

The permission is enforced both in:
1. **Sidebar** (hidden with `display: none` if no permission)
2. **Page load** (redirects if no permission via `requirePermission()`)

## 7. COMPONENT ARCHITECTURE

### View Components
Pages are composed of:
1. **Navbar** (shared component)
2. **Sidebar** (shared component with permission-based menu items)
3. **Page Header** (unique to each view)
4. **Content Area** (unique page content)
5. **Modals** (for CRUD operations, inline in page)
6. **Footer** (shared component)

### Component Loading Pattern
```javascript
// In app.js
async function loadLayout() {
    await Promise.all([
        loadComponent('navbar-container', '/components/navbar.html'),
        loadComponent('sidebar-container', '/components/sidebar.html'),
        loadComponent('footer-container', '/components/footer.html')
    ]);
    initializeSidebar();
    updateUserInfo();
    applyPermissions();
}
```

### Modal Pattern
```html
<div class="modal fade" id="modalCreateCompra" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <!-- Form inputs -->
            <button onclick="ComprasController.saveCompra()">Guardar</button>
        </div>
    </div>
</div>

<script>
    // In controller
    openCreateModal() {
        const modal = new bootstrap.Modal(document.getElementById('modalCreateCompra'));
        modal.show();
    }
</script>
```

## 8. STATE MANAGEMENT APPROACH

### Pattern: Client-Side Object State
- **No Redux, Vuex, or Pinia**
- **LocalStorage for persistence**: User and token
- **Object-based state** in controllers:

```javascript
const ComprasController = {
    estado: {
        compras: [],
        comprasFiltradas: [],
        filtros: {
            proveedor: '',
            estado: '',
            fecha_desde: '',
            fecha_hasta: ''
        },
        paginaActual: 1
    }
};
```

### Session Storage
```javascript
// Storage utility (/utils/storage.js)
const Storage = {
    setToken(token) { localStorage.setItem('token', token); },
    getToken() { return localStorage.getItem('token'); },
    setUser(user) { localStorage.setItem('user', JSON.stringify(user)); },
    getUser() { 
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated() { return this.getToken() && this.getUser(); },
    clear() { /* logout */ }
};
```

### Local Component State
- Filters are stored in the controller's `estado` object
- Updated via input change listeners
- Used to call services with filter parameters

## 9. UI LIBRARY/FRAMEWORK

### Bootstrap 5.3.0
- **Grid system** for responsive layouts
- **Cards** for content sections
- **Tables** for data display
- **Modals** for dialogs
- **Forms** for input
- **Alerts/Badges** for status indicators
- **Navs/Tabs** for navigation

### Bootstrap Icons 1.11.0
- Icon classes like `bi bi-cart`, `bi bi-graph-up`, etc.

### Custom Styling
- `/assets/css/style.css` - Main admin theme
- `/assets/css/public.css` - Public site theme
- `/assets/css/dashboard.css` - Dashboard-specific styles

### Color Scheme
From public.css:
```css
--rojo-principal: #C41E3A
--amarillo-principal: #FDB913
--blanco: #FFFFFF
--blanco-suave: #F8F9FA
--texto-oscuro: #333333
--texto-medio: #666666
--texto-claro: #999999
```

## 10. FILE NAMING CONVENTIONS

### Controllers
- **Pattern**: `{module}.controller.js`
- **Examples**:
  - `reportes.controller.js`
  - `compras.controller.js`
  - `ventas.controller.js`
  - `auth.controller.js`

### Services
- **Pattern**: `{module}.service.js`
- **Examples**:
  - `reportes.service.js`
  - `compras.service.js`
  - `ventas.service.js`
  - `auth.service.js`

### Views/Pages
- **Pattern**: `/views/{module}/{page}.html`
- **Examples**:
  - `/views/reportes/index.html`
  - `/views/compras/index.html`
  - `/views/usuarios/lista.html`
  - `/views/productos/catalogo.html`

### Utilities
- **Pattern**: `{name}.js` (lowercase, descriptive)
- **Examples**:
  - `storage.js`
  - `permissions.js`
  - `alerts.js`
  - `formatter.js`
  - `loader.js`
  - `validator.js`

### HTML Components
- **Pattern**: `{component-name}.html`
- **Examples**:
  - `navbar.html`
  - `sidebar.html`
  - `footer.html`

### Modals
- **Pattern**: `modal-{name}.html`
- **Examples**:
  - `modal-cliente.html`
  - `modal-producto.html`
  - `modal-compra.html`

### CSS Files
- **Pattern**: `{scope}.css`
- **Examples**:
  - `style.css` (main admin styles)
  - `public.css` (public site styles)
  - `dashboard.css` (dashboard-specific)

## 11. KEY ARCHITECTURAL PATTERNS

### 1. Permission-Based Access Control
```javascript
// Sidebar shows/hides based on permissions
<li data-permission="canViewAllReports">

// Page enforces permissions on load
if (!requirePermission(Permissions.canViewAllReports)) {
    return;
}

// Role-based permission system
const Permissions = {
    canViewAllReports() {
        return this.hasAnyRole(['Administrador', 'Gerente']);
    }
};
```

### 2. Event-Driven UI Updates
```javascript
// Set up listeners
configurarEventos() {
    document.getElementById('selectMes').addEventListener('change', () => {
        this.mesActual = parseInt(document.getElementById('selectMes').value);
        this.cargarGraficas();
    });
}

// Inline handlers
<button onclick="ReportesController.cargarVentasDia()">
```

### 3. Async/Await with Error Handling
```javascript
async cargarDashboardStats() {
    try {
        const response = await ReportesService.getDashboardStats();
        // Update UI
    } catch (error) {
        console.error('Error al cargar stats:', error);
        // Show user-friendly error
    }
}
```

### 4. Dynamic Table Rendering
```javascript
async cargarTopProductos() {
    const response = await ReportesService.getTopProductos(10, 30);
    const productos = response.data || [];
    
    const tbody = document.getElementById('tablaTopProductos');
    tbody.innerHTML = productos.map((p, index) => `
        <tr>
            <td>${p.producto}</td>
            <td>${p.cantidad_vendida}</td>
        </tr>
    `).join('');
}
```

### 5. Chart.js Integration
```javascript
const ctx = document.getElementById('chartComprasVsVentas').getContext('2d');
this.charts.comprasVsVentas = new Chart(ctx, {
    type: 'line',
    data: { /* data */ },
    options: { /* config */ }
});

// Destroy old chart before creating new one
if (this.charts.comprasVsVentas) {
    this.charts.comprasVsVentas.destroy();
}
```

## 12. KEY UTILITIES

### Storage (storage.js)
- `setToken()`, `getToken()`, `removeToken()`
- `setUser()`, `getUser()`, `removeUser()`
- `isAuthenticated()`, `clear()`
- `setSession(token, user)`

### Permissions (permissions.js)
- Role checking: `hasRole()`, `hasAnyRole()`, `isAdmin()`
- Module permissions: `canViewAllReports()`, `canAccessPOS()`, etc.
- Access control: `redirectIfUnauthorized()`

### Alerts (alerts.js)
- Show notifications to users
- Used for error/success messages

### Loader (loader.js)
- Show/hide loading spinners
- Used during async operations

### Formatter (formatter.js)
- Format money values
- Format dates
- Format other data types

### Validator (validator.js)
- Form validation functions
- Email, phone, etc. validation

## 13. AUTHENTICATION FLOW

### Login Process
1. User submits login form
2. `AuthService.login(email, password)` calls `/usuarios/login`
3. Backend returns: `{ token, user: { id, nombre, rol, ... } }`
4. `Storage.setSession(token, user)` saves to localStorage
5. Redirect to dashboard

### Token Management
- Token stored in `localStorage['token']`
- Automatically added to all requests via axios interceptor
- Token checked on page load via `AuthService.requireAuth()`
- Expired token (401) triggers redirect to login

### Role-Based Access
- User role stored in `localStorage['user'].rol`
- Permissions checked via `Permissions.canViewAllReports()` etc.
- Sidebar menu items hidden if no permission
- Pages redirect if no permission

## 14. RESPONSIVE DESIGN

### Breakpoints
- Uses Bootstrap responsive classes: `col-md-`, `d-none d-lg-block`, etc.
- Mobile-first approach with breakpoints at:
  - xs: 0px
  - sm: 576px
  - md: 768px
  - lg: 992px
  - xl: 1200px

### Sidebar Behavior
- Mobile: Collapsible sidebar with overlay
- Desktop: Fixed sidebar

## SUMMARY

This is a **lightweight, vanilla JavaScript frontend** with:
- **No framework** (React/Vue/Angular)
- **Bootstrap 5** for UI
- **Axios** for HTTP
- **Chart.js** for charts
- **MVC-like architecture** (Views, Controllers, Services)
- **Role-based access control**
- **Direct HTML routing**
- **LocalStorage for state**
- **Responsive Bootstrap-based design**

The Reports module is **already implemented** with:
- Dashboard statistics cards
- Multiple data visualizations (charts)
- Sales summary tables
- Daily sales drill-down
- Invoice details and reprint capability

The architecture is **consistent** and easy to extend with new features or modifications.
