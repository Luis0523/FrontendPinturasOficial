# Sistema de Pinturas - Frontend Documentation

Welcome to the comprehensive frontend documentation for the Sistema de Pinturas platform.

## Quick Navigation

### Documentation Files

1. **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Comprehensive Reference
   - Complete project structure breakdown
   - Detailed analysis of all architectural components
   - Code examples and patterns
   - 650+ lines of detailed documentation
   - **Start here for deep understanding**

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer Quick Guide
   - Key files and locations
   - Code snippets for common tasks
   - Module creation template
   - Bootstrap class reference
   - API patterns and conventions
   - **Use this while coding**

3. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual Diagrams
   - System architecture overview
   - Module structure diagrams
   - Data flow diagrams
   - Component tree
   - Permission enforcement flow
   - State management patterns
   - **Great for visual learners**

## What You'll Learn

This documentation covers all 10 key areas requested:

1. ✅ **Project Structure & Organization**
   - Directory tree and file organization
   - Logical grouping of components
   - Scalable structure for growth

2. ✅ **Technology Stack**
   - Vanilla JavaScript (no framework)
   - Bootstrap 5.3.0 for UI
   - Axios for HTTP requests
   - Chart.js for visualization
   - CDN-based (no build process)

3. ✅ **Reports Module Status**
   - Location: `/views/reportes/index.html`
   - Complete implementation with features
   - Dashboard statistics, charts, tables
   - Invoice detail viewing and reprinting
   - All API endpoints documented

4. ✅ **Module Structure Patterns**
   - MVC-like 3-tier architecture
   - View-Controller-Service separation
   - Consistent naming conventions
   - Reusable component patterns

5. ✅ **API Integration Patterns**
   - Axios configuration and interceptors
   - Bearer token authentication
   - Error handling and 401 redirects
   - Service layer organization

6. ✅ **Routing Setup**
   - Direct HTML file navigation
   - Permission-based access control
   - URL structure: `/views/{module}/{page}.html`
   - No SPA router framework

7. ✅ **Component Architecture**
   - Shared components (navbar, sidebar, footer)
   - Modal-based dialogs
   - Dynamic table rendering
   - Chart.js integration

8. ✅ **State Management Approach**
   - Object-based state in controllers
   - LocalStorage for persistence
   - No Redux/Vuex/Pinia needed
   - Simple and effective

9. ✅ **UI Library/Framework**
   - Bootstrap 5.3.0 classes and components
   - Bootstrap Icons 1.11.0
   - Custom CSS styling
   - Responsive mobile-first design

10. ✅ **File Naming Conventions**
    - {module}.controller.js
    - {module}.service.js
    - /views/{module}/{page}.html
    - modal-{name}.html
    - Consistent patterns throughout

## Project Statistics

- **Total Controllers**: 19 files
- **Total Services**: 19 files
- **Total Views**: 18+ HTML pages
- **Utilities**: 6 helper files
- **Reusable Components**: 13+ (navbar, sidebar, footer, modals)
- **CSS Files**: 4 (style, public, dashboard, custom)
- **Lines of Code**: 1,500+ lines analyzed and documented

## Key Features Implemented

### Modules
- Dashboard (main hub)
- Authentication (login/logout)
- Products (catalog & management)
- Inventory (stock management)
- Sales/POS (point of sale)
- Purchases (order management)
- Clients (customer management)
- Providers (supplier management)
- Users (employee management)
- Configuration (system settings)
- **Reports (statistics & analytics)** ✅ FULLY IMPLEMENTED

### Security
- Role-based access control (5 roles)
- Permission-based UI hiding
- Bearer token authentication
- Automatic 401 handling
- Session management via localStorage

### UX/UI
- Responsive Bootstrap grid
- Loading spinners
- Toast notifications
- Modal dialogs
- Data tables with sorting
- Interactive charts
- Form validation

## Getting Started

### 1. Understand the Architecture
Read files in this order:
1. `config/api.js` - API setup
2. `utils/permissions.js` - Permission system
3. `assets/js/app.js` - Global app logic
4. `services/reportes.service.js` - Service pattern
5. `controllers/reportes.controller.js` - Controller pattern
6. `views/reportes/index.html` - View structure

### 2. Create a New Module
Follow the template in `QUICK_REFERENCE.md` under "Creating a New Module (4 files needed)"

Required files:
- View: `/views/{module}/index.html`
- Service: `/services/{module}.service.js`
- Controller: `/controllers/{module}.controller.js`
- Sidebar item: Add to `/components/sidebar.html`

### 3. Extend Existing Features
Find the module, then:
1. Add method to service (API call)
2. Call service in controller
3. Update state
4. Render new data to view

## Common Tasks

### Show Loading Spinner
```javascript
Loader.show('Loading...');
// ... do work
Loader.hide();
```

### Show Alert
```javascript
Alerts.success('Operation successful');
Alerts.error('Something went wrong');
Alerts.warning('Are you sure?');
Alerts.info('For your information');
```

### Format Money
```javascript
Formatter.formatMoney(1234.56);  // Output: Q1,234.56
```

### Check Permissions
```javascript
if (Permissions.canViewAllReports()) {
    // User can view reports
}
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

## Project Structure

```
frontend/
├── config/                 # Configuration
│   └── api.js             # API setup & interceptors
├── services/              # API communication
│   ├── reportes.service.js
│   ├── ventas.service.js
│   └── ... (16 more)
├── controllers/           # Business logic
│   ├── reportes.controller.js
│   ├── ventas.controller.js
│   └── ... (16 more)
├── views/                 # Page templates
│   ├── reportes/
│   ├── ventas/
│   ├── compras/
│   └── ... (15+ more modules)
├── components/            # Shared components
│   ├── navbar.html
│   ├── sidebar.html
│   ├── footer.html
│   └── modals/           # Modal dialogs
├── utils/                 # Utility functions
│   ├── storage.js
│   ├── permissions.js
│   ├── alerts.js
│   ├── loader.js
│   ├── formatter.js
│   └── validator.js
├── assets/
│   ├── css/              # Styling
│   │   ├── style.css
│   │   ├── public.css
│   │   └── dashboard.css
│   └── js/
│       └── app.js        # Global app logic
└── public/               # Static files
```

## API Base URL

**Local Development**: `http://localhost:5000/api`

All API calls use Axios with automatic Bearer token injection.

## Roles & Permissions

Five roles are defined in the system:

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| Administrador | Full Access | All system functions |
| Gerente | Most Access | Everything except user management |
| Bodeguero | Limited | Inventory and purchases |
| Cajero | Limited | Sales operations only |
| Vendedor | Most Limited | Sales operations (reduced features) |

## Technology Stack

### Frontend
- **Language**: JavaScript ES6+
- **UI Framework**: Bootstrap 5.3.0
- **HTTP Client**: Axios 1.12.2
- **Charting**: Chart.js 4.4.0
- **Icons**: Bootstrap Icons 1.11.0

### Delivery
- **No Build Process**: Files served as-is
- **CDN-Based**: All libraries from CDN
- **Responsive**: Mobile-first design
- **No Framework**: Pure vanilla JavaScript

## Key Statistics

- **API Base URL**: localhost:5000/api
- **Authentication**: Bearer Token (JWT)
- **Session Storage**: LocalStorage
- **Page Structure**: HTML5 with Bootstrap
- **Styling**: CSS3 with Bootstrap classes
- **State Management**: Object-based (no Redux)

## Support & Next Steps

### For New Developers
1. Read `FRONTEND_ARCHITECTURE.md`
2. Study one complete module (e.g., Reports)
3. Create a simple new feature following the pattern
4. Extend an existing module

### For Bug Fixes
1. Find the broken feature in the appropriate module
2. Check the Service (API call), Controller (logic), or View (rendering)
3. Fix the issue following existing patterns
4. Test in browser console

### For New Features
1. Create new module following template in `QUICK_REFERENCE.md`
2. Add sidebar menu item with permission check
3. Implement service methods for API calls
4. Implement controller logic and state
5. Create view with HTML and event handlers

## Files to Read First

**Priority 1 (Must Read)**
- `config/api.js` - How API works
- `utils/permissions.js` - Permission system
- `components/sidebar.html` - Navigation structure

**Priority 2 (Should Read)**
- `assets/js/app.js` - App initialization
- `services/reportes.service.js` - Service pattern
- `controllers/reportes.controller.js` - Controller pattern

**Priority 3 (Nice to Know)**
- `views/reportes/index.html` - View structure
- `utils/storage.js` - Session management
- `utils/alerts.js` - Notification system

## Quick Links

- **Reports Module**: `/views/reportes/index.html`
- **API Configuration**: `/config/api.js`
- **Permission System**: `/utils/permissions.js`
- **Global Functions**: `/assets/js/app.js`
- **Navigation**: `/components/sidebar.html`

---

**Created**: November 19, 2025  
**Frontend Project**: Sistema de Pinturas  
**Status**: Production Ready  
**Branch**: master  

For detailed information, please refer to the comprehensive documentation files listed at the top of this README.
