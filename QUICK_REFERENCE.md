# Frontend Quick Reference Guide

## Key Files & Locations

### Configuration
- **API Setup**: `/frontend/config/api.js`
  - Base URL: `http://localhost:5000/api`
  - Axios interceptors for auth & error handling

### Reports Module
- **View**: `/frontend/views/reportes/index.html`
- **Controller**: `/frontend/controllers/reportes.controller.js`
- **Service**: `/frontend/services/reportes.service.js`
- **Sidebar Link**: `/frontend/components/sidebar.html` (line 165)

### Shared Components
- **Navbar**: `/frontend/components/navbar.html`
- **Sidebar**: `/frontend/components/sidebar.html`
- **Footer**: `/frontend/components/footer.html`

### Utilities
- **Storage**: `/frontend/utils/storage.js` - LocalStorage wrapper
- **Permissions**: `/frontend/utils/permissions.js` - Role-based access
- **Alerts**: `/frontend/utils/alerts.js` - Notifications
- **Loader**: `/frontend/utils/loader.js` - Loading spinners
- **Formatter**: `/frontend/utils/formatter.js` - Data formatting
- **Validator**: `/frontend/utils/validator.js` - Form validation

### Global App Functions
- **App Config**: `/frontend/assets/js/app.js`
  - `loadLayout()` - Load navbar/sidebar/footer
  - `loadComponent()` - Load HTML components
  - `requirePermission()` - Check access
  - `fetchData()`, `postData()`, `putData()`, `deleteData()` - HTTP helpers
  - `debounce()` - Debounce function

## Code Patterns

### Creating a New Module (4 files needed)

#### 1. View (`/views/{module}/index.html`)
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <title>My Module - Sistema de Pinturas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="../../assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div class="main-wrapper">
        <div id="sidebar-container"></div>
        <div class="main-content">
            <div id="navbar-container"></div>
            <div class="content-wrapper">
                <!-- Your content -->
            </div>
            <div id="footer-container"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    
    <script src="../../config/api.js"></script>
    <script src="../../utils/storage.js"></script>
    <script src="../../utils/permissions.js"></script>
    <script src="../../utils/alerts.js"></script>
    <script src="../../utils/loader.js"></script>
    <script src="../../utils/formatter.js"></script>
    
    <script src="../../services/auth.service.js"></script>
    <script src="../../services/{module}.service.js"></script>
    
    <script src="../../assets/js/app.js"></script>
    <script src="../../controllers/{module}.controller.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            await loadLayout();
            await {Module}Controller.init();
        });
    </script>
</body>
</html>
```

#### 2. Service (`/services/{module}.service.js`)
```javascript
const {Module}Service = {
    async getAll() {
        try {
            const response = await axios.get('/{module}');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async getById(id) {
        try {
            const response = await axios.get(`/{module}/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async create(data) {
        try {
            const response = await axios.post('/{module}', data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async update(id, data) {
        try {
            const response = await axios.put(`/{module}/${id}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async delete(id) {
        try {
            const response = await axios.delete(`/{module}/${id}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    handleError(error) {
        if (error.response) {
            return new Error(error.response.data.message || 'Error al obtener datos');
        } else if (error.request) {
            return new Error('No se pudo conectar con el servidor');
        } else {
            return new Error('Error al procesar la solicitud');
        }
    }
};

window.{Module}Service = {Module}Service;
```

#### 3. Controller (`/controllers/{module}.controller.js`)
```javascript
const {Module}Controller = {
    // STATE
    estado: {
        items: [],
        itemsFiltrados: [],
        filtros: {},
        paginaActual: 1
    },

    // LIFECYCLE
    async init() {
        try {
            console.log('🚀 Inicializando {Module}...');

            if (!requirePermission(Permissions.canView{Module})) {
                return;
            }

            this.configurarEventos();
            await this.cargarItems();

            console.log('✅ {Module} inicializado');
        } catch (error) {
            console.error('❌ Error:', error);
        }
    },

    // DATA LOADING
    async cargarItems() {
        try {
            const response = await {Module}Service.getAll();
            this.estado.items = response.data || [];
            this.renderTable();
        } catch (error) {
            console.error('Error al cargar items:', error);
            Alerts.error('Error al cargar los datos');
        }
    },

    // EVENT HANDLERS
    configurarEventos() {
        // Wire up event listeners
    },

    // UI UPDATES
    renderTable() {
        const tbody = document.getElementById('{module}TableBody');
        tbody.innerHTML = this.estado.items.map(item => `
            <tr>
                <td>${item.nombre}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="{Module}Controller.edit(${item.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="{Module}Controller.delete(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // CRUD OPERATIONS
    async save(data) {
        try {
            Loader.show('Guardando...');
            await {Module}Service.create(data);
            Alerts.success('Guardado exitosamente');
            await this.cargarItems();
            // Close modal
        } catch (error) {
            Alerts.error('Error al guardar');
        } finally {
            Loader.hide();
        }
    },

    async edit(id) {
        // Open modal and load item
    },

    async delete(id) {
        if (!confirm('¿Estás seguro?')) return;
        try {
            Loader.show('Eliminando...');
            await {Module}Service.delete(id);
            Alerts.success('Eliminado exitosamente');
            await this.cargarItems();
        } catch (error) {
            Alerts.error('Error al eliminar');
        } finally {
            Loader.hide();
        }
    }
};

window.{Module}Controller = {Module}Controller;
```

#### 4. Sidebar Menu Item
In `/components/sidebar.html`, add:
```html
<li class="nav-item mb-2" data-permission="canView{Module}">
    <a class="nav-link text-white" href="/views/{module}/index.html">
        <i class="bi bi-icon-name me-2"></i>
        <span>{Module} Name</span>
    </a>
</li>
```

#### 5. Permission
In `/utils/permissions.js`, add:
```javascript
canView{Module}() {
    return this.hasAnyRole([
        this.ROLES.ADMINISTRADOR,
        this.ROLES.GERENTE
    ]);
},
```

## API Response Format

### Success Response
```json
{
    "success": true,
    "data": { /* actual data */ },
    "message": "Operation successful"
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "error": "error_code"
}
```

## Roles Available
- `Administrador` - Full access
- `Gerente` - Most access except user management
- `Bodeguero` - Inventory and purchases
- `Cajero` - Sales operations
- `Vendedor` - Sales operations (limited)

## Common Tasks

### Show Loading Spinner
```javascript
Loader.show('Loading data...');
// ... do work
Loader.hide();
```

### Show Alert
```javascript
Alerts.success('Success message');
Alerts.error('Error message');
Alerts.warning('Warning message');
Alerts.info('Info message');
```

### Format Money
```javascript
const formatted = Formatter.formatMoney(1234.56);
// Output: Q1,234.56
```

### Check Permissions
```javascript
if (Permissions.canViewAllReports()) {
    // User has permission
}
```

### Get Current User
```javascript
const user = Storage.getUser();
console.log(user.nombre, user.rol);
```

### Make API Call
```javascript
try {
    const response = await axios.get('/endpoint');
    console.log(response.data);
} catch (error) {
    console.error(error);
}
```

## Bootstrap Classes Quick Reference

### Grid
- `container` - Fixed width container
- `row` - Create a row
- `col-md-6` - 50% width on medium+ screens
- `g-3` - Gap/spacing (1rem)

### Cards
- `card` - Card container
- `card-header` - Header section
- `card-body` - Body section
- `card-footer` - Footer section

### Buttons
- `btn btn-primary` - Primary button
- `btn btn-secondary` - Secondary button
- `btn btn-danger` - Danger/delete button
- `btn btn-sm` - Small button
- `btn-outline-primary` - Outlined button

### Tables
- `table` - Table styling
- `table-hover` - Hover effect
- `table-sm` - Smaller padding
- `table-responsive` - Horizontal scroll on mobile

### Alerts
- `alert alert-success` - Success message
- `alert alert-danger` - Error message
- `alert alert-warning` - Warning message
- `alert alert-info` - Info message

### Spacing
- `m-3` - Margin (1rem)
- `p-3` - Padding (1rem)
- `mb-4` - Margin bottom (1.5rem)
- `mt-3` - Margin top (1rem)

### Text
- `text-center` - Center text
- `text-end` - Right align text
- `fw-bold` - Font weight bold
- `text-muted` - Muted/gray text

## File Locations Reference

| What | Where |
|------|-------|
| Reports View | `/views/reportes/index.html` |
| Reports Controller | `/controllers/reportes.controller.js` |
| Reports Service | `/services/reportes.service.js` |
| API Config | `/config/api.js` |
| Global App | `/assets/js/app.js` |
| Bootstrap CSS | CDN (5.3.2) |
| Bootstrap JS | CDN (5.3.2) |
| Axios | CDN (1.12.2) |
| Chart.js | CDN (4.4.0) |
| Main Styles | `/assets/css/style.css` |
| Public Styles | `/assets/css/public.css` |
| Landing Page | `/index.html` |
| Login Page | `/views/auth/login.html` |
| Dashboard | `/views/dashboard/index.html` |

## Git Status
- **Current Branch**: master
- **Status**: Clean (no uncommitted changes)
- **Last Commits**:
  1. Configuracion y checkout
  2. Revision de catalogo, compras, ventas y reportes, y usuarios
  3. He arreglado la parte de catalogo y el sidebar

## Key Notes

1. **No Build Process** - Files are served as-is (no webpack, babel, etc.)
2. **Browser Compatibility** - Uses modern JavaScript (async/await, template literals)
3. **Mobile Ready** - Bootstrap responsive classes throughout
4. **Permission-Based UI** - Menu items and pages check permissions
5. **Consistent Patterns** - All modules follow same structure
6. **Easy to Extend** - Adding new features follows predictable patterns

