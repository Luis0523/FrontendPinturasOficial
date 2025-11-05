# Sistema de Gestión de Pinturas - Estado del Proyecto

**Fecha de última actualización:** 04 de Noviembre, 2025
**Versión:** 1.0.0
**Estado:** En Desarrollo Activo

---

## Resumen Ejecutivo

Sistema ERP frontend para gestión integral de tienda de pinturas, desarrollado con arquitectura MVC usando JavaScript vanilla, Bootstrap 5 y Axios. Conecta a API REST backend en Node.js.

**Métricas del Proyecto:**
- **~11,700 líneas** de código funcional
- **8 controladores** (~6,135 líneas)
- **13 servicios API** (~1,852 líneas)
- **7 módulos** principales implementados
- **5 roles** de usuario con permisos granulares

---

## 1. Arquitectura del Sistema

### 1.1 Estructura de Carpetas

```
frontend/
├── assets/
│   ├── css/                → Estilos (style.css, dashboard.css)
│   ├── js/                 → app.js (configuración global)
│   └── img/                → Recursos gráficos
├── components/
│   ├── navbar.html         → Barra superior
│   ├── sidebar.html        → Menú lateral
│   ├── footer.html         → Pie de página
│   └── modals/             → 13 modales reutilizables
├── config/
│   └── api.js              → Configuración Axios + endpoints
├── controllers/            → 8 controladores (~6,135 líneas)
├── services/               → 13 servicios API (~1,852 líneas)
├── utils/                  → 6 utilidades (permisos, alerts, storage, etc.)
├── views/                  → 7 módulos de vistas
├── pages/                  → Login, Dashboard
└── package.json            → Dependencias
```

### 1.2 Stack Tecnológico

**Frontend:**
- HTML5 / CSS3 / JavaScript (Vanilla ES6+)
- Bootstrap 5.3.2
- Bootstrap Icons 1.11.1
- Chart.js 4.4.0 (gráficos)
- Axios 1.12.2 (cliente HTTP)

**Backend Integration:**
- API REST: `http://localhost:5000/api`
- Autenticación: JWT Bearer Token
- Interceptores Axios para manejo automático de tokens

---

## 2. Módulos Implementados

### 2.1 Estado de Módulos

| Módulo | Completitud | Estado | Archivos Clave |
|--------|-------------|--------|----------------|
| **Autenticación** | 100% | ✅ COMPLETO | auth.controller.js, auth.service.js |
| **Dashboard** | 100% | ✅ COMPLETO | dashboard.controller.js, dashboard.service.js |
| **Productos** | 100% | ✅ COMPLETO | productos.controller.js (925 líneas) |
| **Inventario** | 95% | ✅ COMPLETO | inventario.service.js (325 líneas) |
| **POS/Ventas** | 95% | ✅ COMPLETO | ventas.controller.js (863 líneas) |
| **Compras** | 90% | ✅ COMPLETO | compras.controller.js (806 líneas) |
| **Clientes** | 100% | ✅ COMPLETO | clientes.controller.js (541 líneas) |
| **Proveedores** | 100% | ✅ COMPLETO | proveedores.controller.js (537 líneas) |
| **Reportes** | 40% | ⏳ PARCIAL | Solo dashboard básico |
| **Usuarios** | 0% | ❌ PENDIENTE | Rutas en sidebar, sin implementar |
| **Configuración** | 30% | ⏳ PARCIAL | Rutas listas, sin CRUD |

### 2.2 Detalle de Funcionalidades por Módulo

#### 🔐 Autenticación (100%)
- [x] Login con email/password
- [x] JWT Token management con localStorage
- [x] Recordar usuario (Remember Me)
- [x] Validación de token expirado
- [x] Logout funcional
- [x] Redirección automática si no autenticado
- [x] Verificación de sesión existente

**Archivos:** `auth.controller.js` (144 líneas), `auth.service.js` (100 líneas)

---

#### 📊 Dashboard (100%)
- [x] Métricas en tiempo real:
  - Ventas del día
  - Stock bajo
  - Órdenes pendientes
- [x] Gráfico de ventas (últimos 7 días) con Chart.js
- [x] Top 5 productos más vendidos
- [x] Actividad reciente (ventas, stock, compras, clientes)
- [x] Alertas de stock crítico
- [x] Botón de actualización manual

**Archivos:** `dashboard.controller.js` (368 líneas), `dashboard.service.js` (90 líneas)
**Ruta:** `/views/dashboard/index.html`

---

#### 📦 Productos (100%)
- [x] Listado con paginación (10 por página)
- [x] Búsqueda por nombre/SKU
- [x] Filtros múltiples:
  - Por categoría
  - Por marca
  - Por estado (activo/inactivo)
  - Por sucursal
- [x] CRUD completo:
  - Crear producto
  - Editar producto
  - Eliminar producto (con confirmación)
- [x] Gestión de presentaciones múltiples
- [x] Modal de detalles completo
- [x] Activar/desactivar presentaciones
- [x] Catálogo vendible separado

**Archivos:**
- `productos.controller.js` (925 líneas)
- `catalogo.controller.js` (1,466 líneas - MÁS GRANDE DEL PROYECTO)
- `productos.service.js` (152 líneas)

**Modales:**
- `modal-producto.html` (337 líneas)
- `modal-detalle-producto.html` (190 líneas)

---

#### 📍 Inventario (95%)
- [x] Vista de stock por producto y sucursal
- [x] Alertas de stock bajo/crítico
- [x] Ajustes de inventario
- [x] Transferencias entre sucursales
- [x] Historial de movimientos
- [x] Visualización de productos críticos
- [ ] Auditoría de inventario (pendiente)

**Archivos:** `inventario.service.js` (325 líneas)

---

#### 💳 Punto de Venta - POS (95%)
- [x] Selección de sucursal
- [x] Búsqueda de productos por nombre
- [x] Carrito de compras:
  - Agregar productos
  - Modificar cantidad
  - Eliminar items
  - Actualización automática de totales
- [x] Búsqueda y selección de clientes
- [x] Modal de cliente rápido
- [x] Cliente Consumidor Final por defecto
- [x] Métodos de pago:
  - Efectivo (con cálculo de cambio)
  - Tarjeta
  - Cheque
- [x] Generación de factura
- [x] Impresión de factura
- [x] Modal de factura exitosa
- [ ] Múltiples métodos de pago en una venta (pendiente)

**Archivos:**
- `ventas.controller.js` (863 líneas)
- `ventas.service.js` (341 líneas - MÁS COMPLETO)

**Modales:**
- `modal-cliente-rapido.html` (172 líneas)
- `modal-factura-exitosa.html` (240 líneas)

**Ruta:** `/views/ventas/pos.html`

---

#### 🛒 Compras y Órdenes (90%)
- [x] Listado de órdenes con paginación
- [x] Filtros:
  - Por proveedor
  - Por sucursal
  - Por estado (pendiente, recibida, cancelada)
  - Por rango de fechas
- [x] Crear orden de compra
- [x] Seleccionar productos del catálogo
- [x] Especificar cantidades y precios
- [x] Recepción de órdenes
- [x] Actualizar estado de orden
- [x] Cancelar orden
- [x] Ver detalles de orden
- [x] Historial de recepciones
- [ ] Órdenes parciales (pendiente)
- [ ] Devoluciones a proveedor (pendiente)

**Archivos:**
- `compras.controller.js` (806 líneas)
- `compras.service.js` (106 líneas)

**Modales:**
- `modal-orden-compra.html` (270 líneas)
- `modal-recepcion.html` (87 líneas)
- `modal-detalle-orden.html` (180 líneas)

**Ruta:** `/views/compras/index.html`

---

#### 👥 Clientes (100%)
- [x] Listado con paginación (20 por página)
- [x] Búsqueda en tiempo real (debounce)
- [x] Filtro por estado (Activos/Inactivos)
- [x] CRUD completo:
  - Crear cliente
  - Editar cliente
  - Eliminar cliente
- [x] Ver detalle completo
- [x] Cliente Consumidor Final (CF) especial
- [x] Validación de formularios
- [x] Gestión de direcciones
- [x] Información de contacto
- [x] Historial de compras (vista)

**Archivos:**
- `clientes.controller.js` (541 líneas)
- `clientes.service.js` (338 líneas - MUY COMPLETO)

**Modal:** `modal-cliente.html` (355 líneas)

**Ruta:** `/views/clientes/index.html`

---

#### 🏢 Proveedores (100%)
- [x] Listado completo
- [x] Búsqueda por nombre
- [x] CRUD completo:
  - Crear proveedor
  - Editar proveedor
  - Eliminar proveedor
- [x] Ver detalles
- [x] Información de contacto
- [x] Validación de datos
- [x] Estado activo/inactivo

**Archivos:**
- `proveedores.controller.js` (537 líneas)
- `proveedores.service.js` (168 líneas)

**Modal:** `modal-proveedor.html` (355 líneas)

**Ruta:** `/views/proveedores/index.html`

---

## 3. Sistema de Permisos y Roles

### 3.1 Roles Implementados

Sistema completo de 5 roles con permisos granulares:

| Rol | Nivel | Descripción |
|-----|-------|-------------|
| **Administrador** | 1 | Acceso completo al sistema |
| **Gerente** | 2 | Gestión general, reportes, usuarios |
| **Bodeguero** | 3 | Inventario, compras, recepción |
| **Cajero** | 4 | Ventas, punto de venta, clientes |
| **Vendedor** | 5 | Catálogo, ventas, clientes (solo lectura) |

### 3.2 Matriz de Permisos

**Archivo:** `utils/permissions.js` (265 líneas)

#### Productos
```javascript
canViewProducts()       // Todos excepto Cajero
canEditProducts()       // Admin, Gerente, Bodeguero
canDeleteProducts()     // Admin, Gerente
canManageCategories()   // Admin, Gerente, Bodeguero
```

#### Inventario
```javascript
canViewInventory()      // Todos
canAdjustInventory()    // Admin, Gerente, Bodeguero
canTransferStock()      // Admin, Gerente, Bodeguero
canViewStockReports()   // Admin, Gerente, Bodeguero
```

#### Ventas
```javascript
canAccessPOS()          // Admin, Gerente, Cajero, Vendedor
canViewSales()          // Todos excepto Bodeguero
canCancelInvoices()     // Admin, Gerente
canApplyDiscounts()     // Admin, Gerente, Cajero
```

#### Compras
```javascript
canViewPurchases()      // Admin, Gerente, Bodeguero
canCreatePurchaseOrders() // Admin, Gerente, Bodeguero
canReceivePurchases()   // Admin, Gerente, Bodeguero
canCancelPurchases()    // Admin, Gerente
```

#### Clientes
```javascript
canViewClients()        // Todos
canManageClients()      // Admin, Gerente, Cajero, Vendedor
```

#### Proveedores
```javascript
canViewProviders()      // Todos
canManageProviders()    // Admin, Gerente, Bodeguero
```

#### Usuarios
```javascript
canViewUsers()          // Admin, Gerente
canManageUsers()        // Admin
canManageRoles()        // Admin
```

#### Configuración
```javascript
canAccessSettings()     // Admin, Gerente
canManageSettings()     // Admin
canManageBranches()     // Admin
```

#### Reportes
```javascript
canViewSalesReports()   // Admin, Gerente
canViewInventoryReports() // Admin, Gerente, Bodeguero
canViewFinancialReports() // Admin, Gerente
canExportReports()      // Admin, Gerente
```

### 3.3 Aplicación de Permisos

- **Sidebar:** Oculta opciones de menú según rol
- **Controllers:** Valida permisos antes de ejecutar acciones
- **Vistas:** Oculta botones y acciones no permitidas
- **API:** Validación adicional en backend

---

## 4. Servicios API

### 4.1 Configuración Base

**Archivo:** `config/api.js`

```javascript
API_BASE_URL = 'http://localhost:5000/api'

// Interceptores Axios
- Request: Agrega token Bearer automáticamente
- Response: Maneja errores 401 (token expirado) → redirect a login
```

### 4.2 Servicios Implementados (13 archivos)

| Servicio | Líneas | Endpoints | Estado |
|----------|--------|-----------|--------|
| auth.service.js | 100 | 2 | ✅ Completo |
| productos.service.js | 152 | 8 | ✅ Completo |
| ventas.service.js | 341 | 6 | ✅ Completo |
| clientes.service.js | 338 | 6 | ✅ Completo |
| inventario.service.js | 325 | 7 | ✅ Completo |
| proveedores.service.js | 168 | 5 | ✅ Completo |
| compras.service.js | 106 | 6 | ✅ Completo |
| precios.service.js | 110 | 2 | ✅ Completo |
| dashboard.service.js | 90 | 3 | ✅ Completo |
| presentaciones.service.js | 50 | 2 | ✅ Completo |
| categorias.service.js | 23 | 1 | ✅ Completo |
| marcas.service.js | 23 | 1 | ✅ Completo |
| sucursales.service.js | 26 | 1 | ✅ Completo |

**Total: ~1,852 líneas** de servicios API

---

## 5. Utilidades del Sistema

### 5.1 Archivos de Utilidades

**Total: ~700 líneas**

#### utils/permissions.js (265 líneas)
- Sistema completo de roles
- Funciones de verificación de permisos
- Redirección si no autorizado
- Aplicación de permisos en UI

#### utils/alerts.js (~100 líneas)
```javascript
success(message)      // Alerta de éxito
error(message)        // Alerta de error
warning(message)      // Alerta de advertencia
info(message)         // Alerta informativa
showToast(message)    // Notificación flotante
confirm(message)      // Diálogo de confirmación
showInline(element)   // Alerta en línea en formulario
```

#### utils/storage.js (72 líneas)
```javascript
setToken(token)       // Guardar token JWT
getToken()            // Obtener token
setUser(user)         // Guardar datos de usuario
getUser()             // Obtener datos de usuario
isAuthenticated()     // Verificar si está autenticado
clear()               // Limpiar todo (logout)
setSession(token, user) // Guardar sesión completa (login)
```

#### utils/loader.js
```javascript
show(mensaje)         // Mostrar loader pantalla completa
hide()                // Ocultar loader
showInButton(btn)     // Spinner en botón
hideInButton(btn)     // Quitar spinner de botón
```

#### utils/formatter.js
```javascript
currency(monto)       // Formato Q ###,###.00
date(fecha)           // Formato dd/mm/yyyy
datetime(fecha)       // Formato dd/mm/yyyy hh:mm
number(num)           // Números con separadores
```

#### utils/validator.js
```javascript
required(valor, nombreCampo)  // Validar campo requerido
email(email)                   // Validar formato email
minLength(valor, min)          // Longitud mínima
maxLength(valor, max)          // Longitud máxima
numeric(valor)                 // Solo números
showError(input, mensaje)      // Mostrar error en input
clearError(input)              // Limpiar error de input
```

---

## 6. Componentes UI

### 6.1 Componentes Base (3 archivos)

- **navbar.html** - Barra superior con:
  - Logo
  - Nombre de usuario
  - Notificaciones
  - Botón de logout

- **sidebar.html** - Menú lateral con:
  - Navegación por módulos
  - Control por permisos
  - Indicadores de módulo activo

- **footer.html** - Pie de página con:
  - Copyright
  - Versión del sistema

### 6.2 Modales (13 componentes)

| Modal | Líneas | Propósito |
|-------|--------|-----------|
| modal-producto.html | 337 | Crear/editar productos |
| modal-cliente.html | 355 | Crear/editar clientes |
| modal-proveedor.html | 355 | Crear/editar proveedores |
| modal-orden-compra.html | 270 | Crear órdenes de compra |
| modal-recepcion.html | 87 | Recibir órdenes |
| modal-detalle-producto.html | 190 | Ver detalles de producto |
| modal-detalle-orden.html | 180 | Ver detalles de orden |
| modal-precio.html | 105 | Gestión de precios |
| modal-factura-exitosa.html | 240 | Confirmación de factura |
| modal-cliente-rapido.html | 172 | Crear cliente en POS |

**Total: ~3,000 líneas** de componentes HTML

---

## 7. Historial de Commits Recientes

```bash
b681048 - Ya se hacen compras e imprime factura
334034a - Arreglo y separacion de modulo de invnetario en categoria
42be928 - Ya se hacen compras y se reciben y actualiza inventario
2457219 - Tabla de productos creado, pendiente permisos
f2a38a7 - Login creado, sin Logout, ingresa auto
b84e079 - Add components, styles, utils and login view
```

### 7.1 Cambios Pendientes de Commit

**Modificados:**
- `components/sidebar.html` - Actualización de menú
- `services/proveedores.service.js` - Mejoras en servicio
- `views/dashboard/index.html` - Ajustes visuales

**Nuevos sin agregar:**
- `components/modals/modal-cliente.html`
- `components/modals/modal-proveedor.html`
- `controllers/clientes.controller.js`
- `controllers/proveedores.controller.js`
- `views/clientes/index.html`
- `views/proveedores/index.html`

---

## 8. Métricas del Proyecto

### 8.1 Líneas de Código

```
Controladores:           ~6,135 líneas
Servicios API:           ~1,852 líneas
Utilidades:              ~700 líneas
Modales HTML:            ~3,000 líneas
Vistas principales:      ~2,000 líneas (estimado)
─────────────────────────────────────
TOTAL:                  ~13,700 líneas
```

### 8.2 Archivos por Categoría

```
Controllers:   8 archivos
Services:      13 archivos
Utilidades:    6 archivos
Modales:       13 componentes
Vistas:        7 módulos principales
```

### 8.3 Completitud del Sistema

| Categoría | Completitud | Observaciones |
|-----------|-------------|---------------|
| **Core Funcional** | 90% | Login, Dashboard, POS operativos |
| **CRUD Módulos** | 85% | Productos, Clientes, Proveedores completos |
| **Inventario** | 90% | Stock, ajustes, transferencias OK |
| **Ventas** | 95% | POS funcional, impresión, facturación |
| **Compras** | 85% | Órdenes y recepción funcionando |
| **Permisos** | 100% | Sistema completo de 5 roles |
| **UI/UX** | 90% | Responsive, modales, alertas |
| **Reportes** | 40% | Solo dashboard básico |
| **Configuración** | 30% | Rutas listas, sin implementar |
| **Usuarios** | 0% | No implementado |

**Promedio General: 76.5%**

---

## 9. Características Destacadas

### 9.1 Seguridad
- ✅ JWT Token con expiración automática
- ✅ Interceptores Axios para manejo de tokens
- ✅ Sistema de permisos granular por rol
- ✅ Validación de sesión en cada página
- ✅ Redirección automática si no autenticado
- ✅ Logout seguro con limpieza de localStorage

### 9.2 Experiencia de Usuario
- ✅ Diseño responsive Bootstrap 5
- ✅ Loader/Spinner durante operaciones
- ✅ Sistema de alertas variado (success, error, warning, info)
- ✅ Toasts flotantes para notificaciones
- ✅ Validación en tiempo real de formularios
- ✅ Búsqueda con debounce (optimizada)
- ✅ Paginación en todos los listados
- ✅ Modales para confirmaciones
- ✅ Breadcrumbs de navegación
- ✅ Dark sidebar + Light content

### 9.3 Rendimiento
- ✅ Debounce en búsquedas (300ms)
- ✅ Paginación server-side
- ✅ Carga asíncrona de componentes
- ✅ Caché de datos de usuario
- ✅ Lazy loading de modales
- ⏳ Code splitting (pendiente)
- ⏳ Service Workers (pendiente)

### 9.4 Mantenibilidad
- ✅ Arquitectura MVC clara
- ✅ Separación de concerns (controllers, services, utils)
- ✅ Código documentado con comentarios
- ✅ Nombres descriptivos de funciones
- ✅ Reutilización de componentes
- ✅ Configuración centralizada (api.js)

---

## 10. Próximos Pasos y Roadmap

### 10.1 Alta Prioridad (Próximas 2 semanas)

1. **Módulo de Usuarios** ⭐
   - [ ] Crear `usuarios.controller.js`
   - [ ] Crear `usuarios.service.js`
   - [ ] Vista `views/usuarios/index.html`
   - [ ] Modal de gestión de usuarios
   - [ ] CRUD completo
   - [ ] Gestión de roles

2. **Módulo de Reportes** ⭐
   - [ ] Reporte de ventas (diario, mensual, anual)
   - [ ] Reporte de inventario
   - [ ] Reporte de compras
   - [ ] Exportación a PDF
   - [ ] Exportación a Excel
   - [ ] Gráficos adicionales

3. **Configuración del Sistema**
   - [ ] CRUD de Categorías
   - [ ] CRUD de Marcas
   - [ ] CRUD de Sucursales
   - [ ] CRUD de Presentaciones
   - [ ] Configuración general

### 10.2 Media Prioridad (1 mes)

4. **Mejoras en POS**
   - [ ] Múltiples métodos de pago en una venta
   - [ ] Descuentos por producto
   - [ ] Descuentos globales
   - [ ] Historial de ventas del día
   - [ ] Reimpresión de facturas

5. **Mejoras en Compras**
   - [ ] Órdenes parciales
   - [ ] Devoluciones a proveedores
   - [ ] Historial de precios de compra
   - [ ] Sugerencias de reorden

6. **Mejoras en Inventario**
   - [ ] Auditoría de inventario
   - [ ] Toma física de inventario
   - [ ] Reportes de rotación
   - [ ] Alertas automáticas

### 10.3 Baja Prioridad (2-3 meses)

7. **Optimizaciones de Rendimiento**
   - [ ] Code splitting
   - [ ] Bundle optimization
   - [ ] Service Workers
   - [ ] PWA features
   - [ ] Caché estratégico

8. **Mejoras de Seguridad**
   - [ ] XSS prevention adicional
   - [ ] CSRF tokens
   - [ ] Rate limiting en frontend
   - [ ] Sanitización de inputs

9. **Funcionalidades Avanzadas**
   - [ ] Notificaciones en tiempo real (WebSockets)
   - [ ] Chat interno
   - [ ] Historial de cambios (audit log)
   - [ ] Backup/Restore de datos

10. **Testing**
    - [ ] Unit tests (Jest)
    - [ ] Integration tests
    - [ ] E2E tests (Cypress)
    - [ ] Coverage > 80%

---

## 11. Problemas Conocidos y Limitaciones

### 11.1 Bugs Menores
- ⚠️ Paginación no se resetea al cambiar filtros en algunos módulos
- ⚠️ Modal de producto no limpia presentaciones al cerrar sin guardar
- ⚠️ Búsqueda de productos en POS puede ser más rápida

### 11.2 Limitaciones Actuales
- ❌ Sin módulo de usuarios (gestión manual desde backend)
- ❌ Reportes muy básicos (solo dashboard)
- ❌ Sin exportación de datos
- ❌ Sin notificaciones en tiempo real
- ❌ Sin modo offline
- ❌ Sin tests automatizados

### 11.3 Deuda Técnica
- 🔧 Algunos controladores muy grandes (catalogo.controller.js - 1,466 líneas)
- 🔧 Código repetido en validaciones de formularios
- 🔧 Algunos servicios podrían usar más caché
- 🔧 Falta manejo de errores más robusto en algunos lugares

---

## 12. Dependencias y Requisitos

### 12.1 Dependencias Frontend

```json
{
  "dependencies": {
    "axios": "^1.12.2"
  }
}
```

### 12.2 CDN Utilizados

```html
<!-- Bootstrap 5.3.2 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<!-- Bootstrap Icons 1.11.1 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

<!-- Chart.js 4.4.0 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### 12.3 Requisitos del Sistema

**Navegadores soportados:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Backend requerido:**
- API REST en `http://localhost:5000/api`
- Endpoints documentados en cada servicio
- CORS habilitado
- JWT para autenticación

---

## 13. Convenciones de Código

### 13.1 Naming Conventions

```javascript
// Controllers
function loadProductos() {}      // camelCase
function createProducto() {}
function updateProducto() {}

// Services
async function getProductos() {} // camelCase
async function getProductoById(id) {}

// Variables
const apiBaseURL = '...'         // camelCase
let currentPage = 1

// Constantes
const API_BASE_URL = '...'       // UPPER_SNAKE_CASE
const MAX_ITEMS_PER_PAGE = 10
```

### 13.2 Estructura de Controladores

```javascript
// 1. Variables globales del módulo
let currentPage = 1;
let filters = {};

// 2. Función de inicialización
function init() {
    loadData();
    attachEventListeners();
    applyPermissions();
}

// 3. Funciones de carga de datos
async function loadData() {}

// 4. Funciones de eventos
function attachEventListeners() {}

// 5. Funciones CRUD
function create() {}
function update() {}
function delete() {}

// 6. Funciones auxiliares
function validate() {}
function formatData() {}

// 7. Inicialización al cargar DOM
document.addEventListener('DOMContentLoaded', init);
```

### 13.3 Manejo de Errores

```javascript
try {
    const response = await servicioAPI.metodo();
    if (response.success) {
        showAlert('success', response.message);
    }
} catch (error) {
    console.error('Error:', error);
    showAlert('error', error.message || 'Error al procesar la solicitud');
}
```

---

## 14. Guía de Contribución

### 14.1 Antes de Crear un Nuevo Módulo

1. Crear servicio en `services/nombre.service.js`
2. Crear controlador en `controllers/nombre.controller.js`
3. Crear vista en `views/nombre/index.html`
4. Crear modales si son necesarios en `components/modals/`
5. Agregar permisos en `utils/permissions.js`
6. Agregar rutas en `components/sidebar.html`

### 14.2 Checklist para Nuevas Funcionalidades

- [ ] Servicio API creado/actualizado
- [ ] Controlador implementado
- [ ] Vista HTML creada
- [ ] Validaciones de formulario
- [ ] Permisos verificados
- [ ] Alertas de éxito/error
- [ ] Loader durante operaciones asíncronas
- [ ] Responsive design verificado
- [ ] Manejo de errores
- [ ] Comentarios en código complejo
- [ ] Tested en múltiples navegadores

### 14.3 Git Workflow

```bash
# 1. Antes de empezar
git status
git pull origin master

# 2. Hacer cambios
git add .
git commit -m "Descripción clara del cambio"

# 3. Push
git push origin master
```

---

## 15. Contacto y Recursos

### 15.1 Documentación Relacionada

- `Planificacion.md` - Plan inicial del proyecto
- `EstructuraPropuesta.md` - Estructura propuesta
- Este archivo (`Claude.md`) - Estado actual

### 15.2 URLs Importantes

- **Frontend Local:** `http://localhost:8000` (o según servidor)
- **Backend API:** `http://localhost:5000/api`
- **Documentación API:** (Agregar URL cuando esté disponible)

---

## 16. Changelog

### Versión 1.0.0 (Actual)
**Fecha:** 04 de Noviembre, 2025

**Módulos Completados:**
- ✅ Autenticación con JWT
- ✅ Dashboard con métricas
- ✅ Productos (CRUD completo)
- ✅ Inventario (gestión de stock)
- ✅ POS/Ventas (facturación)
- ✅ Compras (órdenes y recepción)
- ✅ Clientes (CRUD completo)
- ✅ Proveedores (CRUD completo)

**Sistemas Implementados:**
- ✅ Control de permisos (5 roles)
- ✅ Sistema de alertas
- ✅ Validación de formularios
- ✅ Paginación y búsqueda
- ✅ Modales reutilizables

**Pendiente:**
- ⏳ Módulo de Usuarios
- ⏳ Reportes completos
- ⏳ Configuración del sistema

---

**Última actualización:** 04 de Noviembre, 2025
**Mantenido por:** Claude AI Assistant
**Proyecto:** Sistema de Gestión de Pinturas