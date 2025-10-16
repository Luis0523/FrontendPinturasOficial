# 🎨 ARQUITECTURA COMPLETA DEL FRONTEND - ADMIN

## 📁 ESTRUCTURA DE CARPETAS

```
frontend/
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   ├── style.css              # Estilos personalizados
│   │   └── dashboard.css          # Estilos específicos del dashboard
│   ├── js/
│   │   ├── bootstrap.bundle.min.js
│   │   ├── jquery.min.js
│   │   └── app.js                 # Configuración global
│   └── img/
│       ├── logo.png
│       └── icons/
│
├── config/
│   └── api.js                     # Configuración de endpoints API
│
├── services/                      # Servicios para comunicarse con el backend
│   ├── auth.service.js            # Login, logout, refresh token
│   ├── productos.service.js       # CRUD productos
│   ├── inventario.service.js      # Stock, movimientos, ajustes
│   ├── facturas.service.js        # Crear, listar, anular facturas
│   ├── clientes.service.js        # CRUD clientes
│   ├── usuarios.service.js        # CRUD usuarios
│   ├── proveedores.service.js     # CRUD proveedores
│   ├── compras.service.js         # Órdenes de compra
│   ├── categorias.service.js      # CRUD categorías
│   ├── marcas.service.js          # CRUD marcas
│   ├── presentaciones.service.js  # CRUD presentaciones
│   ├── sucursales.service.js      # CRUD sucursales
│   └── reportes.service.js        # Reportes y estadísticas
│
├── controllers/                   # Lógica de negocio del frontend
│   ├── auth.controller.js
│   ├── productos.controller.js
│   ├── inventario.controller.js
│   ├── facturas.controller.js
│   ├── clientes.controller.js
│   ├── usuarios.controller.js
│   ├── proveedores.controller.js
│   ├── compras.controller.js
│   ├── categorias.controller.js
│   ├── marcas.controller.js
│   ├── presentaciones.controller.js
│   └── dashboard.controller.js
│
├── utils/                         # Funciones auxiliares
│   ├── formatter.js               # Formatear moneda, fechas, números
│   ├── validator.js               # Validaciones de formularios
│   ├── storage.js                 # LocalStorage (token, usuario)
│   ├── alerts.js                  # SweetAlert o notificaciones
│   └── loader.js                  # Spinner de carga
│
├── components/                    # Componentes reutilizables (HTML parciales)
│   ├── navbar.html
│   ├── sidebar.html
│   ├── footer.html
│   ├── modals/
│   │   ├── modal-producto.html
│   │   ├── modal-cliente.html
│   │   ├── modal-usuario.html
│   │   ├── modal-proveedor.html
│   │   └── modal-ajuste-inventario.html
│   └── tables/
│       ├── table-productos.html
│       ├── table-facturas.html
│       └── table-inventario.html
│
└── views/                         # Páginas principales
    ├── auth/
    │   ├── login.html
    │   └── recuperar-password.html
    │
    ├── dashboard/
    │   └── index.html             # Dashboard principal
    │
    ├── productos/
    │   ├── lista.html             # Listado de productos
    │   ├── crear.html             # Crear producto
    │   ├── editar.html            # Editar producto
    │   └── detalle.html           # Ver detalle de producto
    │
    ├── inventario/
    │   ├── stock.html             # Ver stock por sucursal
    │   ├── movimientos.html       # Historial de movimientos
    │   ├── ajustes.html           # Hacer ajustes de inventario
    │   └── alertas.html           # Productos con stock bajo
    │
    ├── ventas/
    │   ├── pos.html               # Punto de Venta (POS)
    │   ├── facturas.html          # Listado de facturas
    │   └── detalle-factura.html   # Ver detalle de factura
    │
    ├── compras/
    │   ├── ordenes.html           # Listado de órdenes de compra
    │   ├── crear-orden.html       # Crear orden de compra
    │   ├── detalle-orden.html     # Ver detalle de orden
    │   └── recepciones.html       # Recepcionar productos
    │
    ├── clientes/
    │   ├── lista.html             # Listado de clientes
    │   ├── crear.html             # Crear cliente
    │   └── detalle.html           # Ver detalle y facturas del cliente
    │
    ├── proveedores/
    │   ├── lista.html             # Listado de proveedores
    │   ├── crear.html             # Crear proveedor
    │   └── detalle.html           # Ver detalle y compras
    │
    ├── usuarios/
    │   ├── lista.html             # Listado de usuarios
    │   ├── crear.html             # Crear usuario
    │   └── perfil.html            # Ver/editar perfil propio
    │
    ├── configuracion/
    │   ├── categorias.html        # Gestión de categorías
    │   ├── marcas.html            # Gestión de marcas
    │   ├── presentaciones.html    # Gestión de presentaciones
    │   ├── sucursales.html        # Gestión de sucursales
    │   └── roles.html             # Gestión de roles
    │
    └── reportes/
        ├── ventas.html            # Reporte de ventas
        ├── inventario.html        # Reporte de inventario
        ├── clientes.html          # Reporte de clientes
        └── productos-mas-vendidos.html
```

---

## 🗺️ MAPA DE NAVEGACIÓN (SITEMAP)

```
LOGIN (/)
  │
  ├─→ DASHBOARD (/dashboard)
  │     │
  │     ├─→ PRODUCTOS (/productos)
  │     │     ├─→ Lista productos
  │     │     ├─→ Crear producto
  │     │     ├─→ Editar producto
  │     │     └─→ Detalle producto
  │     │
  │     ├─→ INVENTARIO (/inventario)
  │     │     ├─→ Ver stock
  │     │     ├─→ Movimientos
  │     │     ├─→ Ajustes
  │     │     └─→ Alertas stock bajo
  │     │
  │     ├─→ VENTAS (/ventas)
  │     │     ├─→ POS (Punto de Venta)
  │     │     ├─→ Lista de facturas
  │     │     └─→ Detalle factura
  │     │
  │     ├─→ COMPRAS (/compras)
  │     │     ├─→ Órdenes de compra
  │     │     ├─→ Crear orden
  │     │     ├─→ Detalle orden
  │     │     └─→ Recepciones
  │     │
  │     ├─→ CLIENTES (/clientes)
  │     │     ├─→ Lista clientes
  │     │     ├─→ Crear cliente
  │     │     └─→ Detalle cliente
  │     │
  │     ├─→ PROVEEDORES (/proveedores)
  │     │     ├─→ Lista proveedores
  │     │     ├─→ Crear proveedor
  │     │     └─→ Detalle proveedor
  │     │
  │     ├─→ USUARIOS (/usuarios)
  │     │     ├─→ Lista usuarios
  │     │     ├─→ Crear usuario
  │     │     └─→ Mi perfil
  │     │
  │     ├─→ CONFIGURACIÓN (/configuracion)
  │     │     ├─→ Categorías
  │     │     ├─→ Marcas
  │     │     ├─→ Presentaciones
  │     │     ├─→ Sucursales
  │     │     └─→ Roles
  │     │
  │     └─→ REPORTES (/reportes)
  │           ├─→ Ventas
  │           ├─→ Inventario
  │           ├─→ Clientes
  │           └─→ Productos más vendidos
  │
  └─→ LOGOUT
```

---

## 📄 DETALLE DE CADA VISTA

### 🔐 **1. LOGIN (views/auth/login.html)**

**Propósito:** Autenticación de usuarios

**Elementos:**
- Logo del sistema
- Input: Email/Usuario
- Input: Password
- Checkbox: Recordarme
- Botón: Iniciar Sesión
- Link: ¿Olvidaste tu contraseña?

**Funcionalidad:**
- Validar credenciales contra `/api/usuarios/login`
- Guardar token JWT en localStorage
- Guardar datos del usuario en localStorage
- Redireccionar a Dashboard

---

### 🏠 **2. DASHBOARD (views/dashboard/index.html)**

**Propósito:** Vista general del sistema con métricas clave

**Layout:**
- Navbar superior (componente reutilizable)
- Sidebar izquierdo (componente reutilizable)
- Contenido principal

**Widgets/Cards:**
1. **Ventas del día**
   - Monto total vendido hoy
   - Número de facturas
   - Gráfico de barras (por hora)

2. **Inventario**
   - Productos con stock bajo (alertas)
   - Total de productos en stock
   - Valor total del inventario

3. **Productos más vendidos**
   - Top 5 productos del mes
   - Cantidad vendida
   - Ingresos generados

4. **Clientes recientes**
   - Últimos 5 clientes registrados
   - Link para ver más

5. **Facturas pendientes** (si aplica)
   - Facturas por cobrar
   - Monto pendiente

6. **Movimientos recientes**
   - Últimos 10 movimientos de inventario
   - Tipo, cantidad, referencia

**Gráficos:**
- Gráfico de líneas: Ventas últimos 30 días
- Gráfico de pastel: Ventas por categoría
- Gráfico de barras: Ventas por sucursal

**Datos desde:**
- `/api/reportes/dashboard` (endpoint especial que devuelva todo)

---

### 📦 **3. PRODUCTOS - LISTA (views/productos/lista.html)**

**Propósito:** Ver todos los productos del catálogo

**Elementos:**

**Toolbar superior:**
- Botón: Nuevo Producto
- Input: Búsqueda por nombre/código/SKU
- Select: Filtrar por Categoría
- Select: Filtrar por Marca
- Select: Filtrar por Estado (Activo/Inactivo)

**Tabla de productos:**
| SKU | Imagen | Nombre | Categoría | Marca | Precio | Stock | Estado | Acciones |
|-----|--------|--------|-----------|-------|--------|-------|--------|----------|
| SKU-001 | [img] | Pintura Látex | Interior | Sherwin | Q150 | 50 | Activo | [Ver] [Editar] [Eliminar] |

**Paginación:** Bootstrap pagination

**Modal:**
- Modal para crear/editar producto

**Datos desde:**
- GET `/api/productos`
- GET `/api/categorias`
- GET `/api/marcas`

---

### 📦 **4. PRODUCTOS - CREAR/EDITAR (Modal o página aparte)**

**Propósito:** Crear o editar un producto

**Formulario:**
- **Tab 1: Información General**
  - Código SKU (readonly si edita)
  - Descripción del producto
  - Categoría (select)
  - Marca (select)
  - Color
  - Tamaño/Volumen
  - Duración en años
  - Extensión m²
  - Estado (activo/inactivo)

- **Tab 2: Presentaciones y Precios**
  - Tabla dinámica:
    | Presentación | Precio Base | Precio Venta | Stock Mínimo | Acciones |
    |--------------|-------------|--------------|--------------|----------|
    | 1 Galón | Q100 | Q150 | 10 | [Eliminar] |
    | 1/4 Galón | Q30 | Q45 | 20 | [Eliminar] |
  - Botón: Agregar Presentación

- **Tab 3: Inventario por Sucursal**
  - Tabla:
    | Sucursal | Existencia | Stock Min | Stock Max | Acciones |
    |----------|------------|-----------|-----------|----------|
    | Centro | 50 | 10 | 100 | [Editar] |

**Botones:**
- Guardar
- Cancelar

**Datos desde:**
- POST/PUT `/api/productos`
- GET `/api/categorias`
- GET `/api/marcas`
- GET `/api/presentaciones`
- GET `/api/sucursales`

---

### 📊 **5. INVENTARIO - STOCK (views/inventario/stock.html)**

**Propósito:** Ver stock de todos los productos por sucursal

**Filtros:**
- Select: Sucursal
- Select: Categoría
- Input: Buscar producto
- Checkbox: Solo mostrar stock bajo

**Tabla:**
| SKU | Producto | Presentación | Sucursal | Existencia | Stock Min | Stock Max | Estado | Acciones |
|-----|----------|--------------|----------|------------|-----------|-----------|--------|----------|
| SKU-001 | Pintura Látex | 1 Galón | Centro | 5 | 10 | 100 | ⚠️ Bajo | [Ajustar] |
| SKU-002 | Pintura Esmalte | 1/4 Galón | Xela | 50 | 20 | 80 | ✅ OK | [Ajustar] |

**Indicadores de color:**
- 🔴 Rojo: Stock crítico (< 50% del mínimo)
- 🟡 Amarillo: Stock bajo (< mínimo)
- 🟢 Verde: Stock normal

**Datos desde:**
- GET `/api/inventario?sucursal_id=X`

---

### 📊 **6. INVENTARIO - MOVIMIENTOS (views/inventario/movimientos.html)**

**Propósito:** Ver historial de movimientos de inventario

**Filtros:**
- Date range: Desde - Hasta
- Select: Tipo de movimiento (VENTA, COMPRA, AJUSTE, TRANSFERENCIA)
- Select: Sucursal
- Input: Buscar por referencia

**Tabla:**
| Fecha | Tipo | Producto | Presentación | Sucursal | Cantidad | Referencia | Usuario |
|-------|------|----------|--------------|----------|----------|------------|---------|
| 16/10/2024 | VENTA | Pintura Látex | 1 Galón | Centro | -2 | Factura A-1 | Juan Pérez |
| 16/10/2024 | AJUSTE | Pintura Esmalte | 1/4 Galón | Xela | +10 | Compra OC-001 | María López |

**Datos desde:**
- GET `/api/inventario/movimientos?desde=X&hasta=Y`

---

### 📊 **7. INVENTARIO - AJUSTES (views/inventario/ajustes.html)**

**Propósito:** Hacer ajustes manuales de inventario

**Formulario:**
- Select: Sucursal
- Autocomplete: Buscar producto
- Select: Presentación (se carga según producto)
- Input: Cantidad actual (readonly, se muestra al seleccionar)
- Select: Tipo de ajuste
  - Entrada (+)
  - Salida (-)
- Input: Nueva cantidad o cantidad a ajustar
- Textarea: Motivo del ajuste
- Input: Referencia (opcional)

**Botón:**
- Realizar Ajuste

**Tabla de ajustes realizados hoy:**
- Muestra los últimos 10 ajustes

**Datos desde:**
- POST `/api/inventario/ajustes`
- GET `/api/inventario`

---

### 💰 **8. VENTAS - POS (Punto de Venta) (views/ventas/pos.html)**

**Propósito:** Interfaz para crear facturas rápidamente

**Layout dividido en 2 columnas:**

**Columna Izquierda (60%):**
- **Buscador de productos:**
  - Input de búsqueda (autocompletado)
  - Resultados en cards con imagen, nombre, precio, stock
  - Click para agregar al carrito

- **Productos frecuentes:**
  - Grid de productos más vendidos
  - Click rápido para agregar

**Columna Derecha (40%):**
- **Información del cliente:**
  - Select/Autocomplete: Cliente
  - Botón: Nuevo Cliente (modal rápido)
  - Muestra: Nombre, NIT

- **Carrito de venta:**
  - Tabla:
    | Producto | Cant | Precio | Desc% | Subtotal | [X] |
    |----------|------|--------|-------|----------|-----|
    | Pintura Látex 1G | 2 | Q150 | 0% | Q300 | [X] |
  
  - Botones: +/- para ajustar cantidad
  - Input para descuento

- **Resumen:**
  - Subtotal: Q300.00
  - Descuento: Q0.00
  - Total: Q300.00

- **Métodos de pago:**
  - Checkbox: Efectivo
  - Checkbox: Tarjeta Débito
  - Checkbox: Tarjeta Crédito
  - Inputs para monto de cada método
  - Total Recibido: Q300.00
  - Cambio: Q0.00

- **Botones:**
  - FACTURAR (grande, verde)
  - Limpiar carrito

**Datos desde:**
- GET `/api/productos`
- GET `/api/clientes`
- POST `/api/ventas/facturas`

---

### 💰 **9. VENTAS - FACTURAS (views/ventas/facturas.html)**

**Propósito:** Ver listado de todas las facturas

**Filtros:**
- Date range: Desde - Hasta
- Select: Estado (Emitida, Anulada)
- Select: Sucursal
- Select: Cliente
- Input: Buscar por número de factura

**Toolbar:**
- Botón: Nueva Venta (ir a POS)
- Botón: Exportar a Excel

**Tabla:**
| Fecha | Número | Cliente | NIT | Sucursal | Total | Estado | Acciones |
|-------|--------|---------|-----|----------|-------|--------|----------|
| 16/10/24 | A-1 | María López | CF | Centro | Q300 | ✅ Emitida | [Ver] [Imprimir] [Anular] |
| 16/10/24 | A-2 | Juan Pérez | 12345-6 | Xela | Q500 | ❌ Anulada | [Ver] |

**Datos desde:**
- GET `/api/ventas/facturas?desde=X&hasta=Y`

---

### 💰 **10. VENTAS - DETALLE FACTURA (views/ventas/detalle-factura.html)**

**Propósito:** Ver detalle completo de una factura

**Información:**
- **Encabezado:**
  - Logo empresa
  - Factura: A-1
  - Fecha: 16/10/2024 12:30 PM
  - Estado: EMITIDA / ANULADA
  - Vendedor: Juan Pérez
  - Sucursal: Centro Xela

- **Cliente:**
  - Nombre: María López
  - NIT: CF
  - Dirección: ---

- **Tabla de productos:**
  | # | Descripción | Cantidad | Precio Unit | Desc% | Subtotal |
  |---|-------------|----------|-------------|-------|----------|
  | 1 | Pintura Látex 1 Galón | 2 | Q150.00 | 0% | Q300.00 |

- **Totales:**
  - Subtotal: Q300.00
  - Descuento: Q0.00
  - Total: Q300.00

- **Pagos:**
  | Tipo | Monto | Referencia |
  |------|-------|------------|
  | Efectivo | Q300.00 | --- |

- **Si está anulada:**
  - Fecha anulación
  - Anulada por
  - Motivo

**Botones:**
- Imprimir
- Descargar PDF
- Anular (si está emitida)
- Volver

**Datos desde:**
- GET `/api/ventas/facturas/:id`

---

### 🛒 **11. COMPRAS - ÓRDENES (views/compras/ordenes.html)**

**Propósito:** Ver listado de órdenes de compra

**Filtros:**
- Date range: Desde - Hasta
- Select: Estado (Pendiente, Parcial, Recibida, Cancelada)
- Select: Proveedor
- Select: Sucursal

**Toolbar:**
- Botón: Nueva Orden de Compra

**Tabla:**
| Fecha | Número | Proveedor | Sucursal | Total | Estado | Acciones |
|-------|--------|-----------|----------|-------|--------|----------|
| 15/10/24 | OC-1 | Proveedor ABC | Centro | Q5,000 | ⏳ Pendiente | [Ver] [Recepcionar] [Cancelar] |
| 14/10/24 | OC-2 | Proveedor XYZ | Xela | Q3,500 | ✅ Recibida | [Ver] |

**Datos desde:**
- GET `/api/compras/ordenes`

---

### 🛒 **12. COMPRAS - CREAR ORDEN (views/compras/crear-orden.html)**

**Propósito:** Crear nueva orden de compra

**Formulario:**
- **Información general:**
  - Select: Proveedor (con botón para crear nuevo)
  - Select: Sucursal destino
  - Date: Fecha orden
  - Date: Fecha entrega estimada
  - Textarea: Observaciones

- **Productos:**
  - Autocomplete: Buscar producto
  - Tabla dinámica:
    | Producto | Presentación | Cantidad | Precio Unit | Desc% | Subtotal | [X] |
    |----------|--------------|----------|-------------|-------|----------|-----|
    | Pintura Látex | 1 Galón | 10 | Q100 | 5% | Q950 | [X] |
  - Botón: Agregar Producto

- **Totales:**
  - Subtotal: Q950.00
  - Descuento: Q50.00
  - Total: Q900.00

**Botones:**
- Crear Orden
- Cancelar

**Datos desde:**
- POST `/api/compras/ordenes`
- GET `/api/proveedores`
- GET `/api/productos`

---

### 🛒 **13. COMPRAS - RECEPCIONAR (views/compras/recepciones.html)**

**Propósito:** Marcar productos como recibidos y actualizar inventario

**Formulario:**
- Select: Orden de Compra (solo pendientes)
- Muestra: Proveedor, Fecha, Total

**Tabla de productos de la orden:**
| Producto | Presentación | Ordenado | Recibido | Por Recibir | Recibir Ahora |
|----------|--------------|----------|----------|-------------|---------------|
| Pintura Látex | 1 Galón | 10 | 0 | 10 | [input: 10] |
| Pintura Esmalte | 1/4 Galón | 20 | 10 | 10 | [input: 10] |

- Textarea: Observaciones de la recepción

**Botones:**
- Confirmar Recepción
- Cancelar

**Proceso:**
1. Usuario ingresa cantidades recibidas
2. Sistema valida que no exceda lo ordenado
3. Al confirmar:
   - Actualiza inventario
   - Crea movimientos de tipo COMPRA
   - Actualiza estado de la orden

**Datos desde:**
- POST `/api/compras/recepciones`
- GET `/api/compras/ordenes/:id`

---

### 👥 **14. CLIENTES - LISTA (views/clientes/lista.html)**

**Propósito:** Ver todos los clientes

**Toolbar:**
- Botón: Nuevo Cliente
- Input: Buscar por nombre/NIT

**Tabla:**
| Nombre | NIT | Email | Teléfono | Total Compras | Última Compra | Acciones |
|--------|-----|-------|----------|---------------|---------------|----------|
| María López | CF | maria@email.com | 1234-5678 | Q15,000 | 16/10/24 | [Ver] [Editar] [Eliminar] |

**Datos desde:**
- GET `/api/clientes`

---

### 👥 **15. CLIENTES - DETALLE (views/clientes/detalle.html)**

**Propósito:** Ver información completa y facturas del cliente

**Secciones:**
- **Información del cliente:**
  - Nombre, NIT, Email, Teléfono, Dirección
  - Botón: Editar

- **Estadísticas:**
  - Total compras
  - Última compra
  - Producto más comprado

- **Historial de facturas:**
  - Tabla con todas las facturas del cliente
  - Filtros por fecha

**Datos desde:**
- GET `/api/clientes/:id`
- GET `/api/ventas/facturas?cliente_id=X`

---

### 🏭 **16. PROVEEDORES - LISTA (views/proveedores/lista.html)**

**Propósito:** Ver todos los proveedores

**Similar a clientes:**
- Tabla con proveedores
- Filtros y búsqueda
- Botón para nuevo proveedor

**Tabla:**
| Nombre | Razón Social | NIT | Contacto | Email | Teléfono | Total Compras | Acciones |
|--------|--------------|-----|----------|-------|----------|---------------|----------|
| Proveedor ABC | ABC S.A. | 12345-6 | Juan | abc@email.com | 1234 | Q50,000 | [Ver] [Editar] |

**Datos desde:**
- GET `/api/proveedores`

---

### 👨‍💼 **17. USUARIOS - LISTA (views/usuarios/lista.html)**

**Propósito:** Gestionar usuarios del sistema

**Tabla:**
| Nombre | Email | Rol | Sucursal | Estado | Último Acceso | Acciones |
|--------|-------|-----|----------|--------|---------------|----------|
| Juan Pérez | juan@pinturas.com | Admin | Centro | Activo | Hoy 10:30 | [Ver] [Editar] [Desactivar] |

**Datos desde:**
- GET `/api/usuarios`

---

### ⚙️ **18. CONFIGURACIÓN - CATEGORÍAS (views/configuracion/categorias.html)**

**Propósito:** Gestionar categorías de productos

**Layout simple:**
- Botón: Nueva Categoría
- Tabla:
  | Nombre | Descripción | # Productos | Estado | Acciones |
  |--------|-------------|-------------|--------|----------|
  | Pinturas Interior | Pinturas para interiores | 25 | Activo | [Editar] [Eliminar] |

**Modal para crear/editar:**
- Nombre
- Descripción
- Estado

**Similar para:**
- Marcas
- Presentaciones
- Sucursales
- Roles

**Datos desde:**
- GET/POST/PUT/DELETE `/api/categorias`

---

### 📊 **19. REPORTES - VENTAS (views/reportes/ventas.html)**

**Propósito:** Reporte detallado de ventas

**Filtros:**
- Date range
- Sucursal
- Usuario/Vendedor
- Cliente

**Visualización:**
- **Gráfico de líneas:** Ventas diarias en el período
- **Gráfico de barras:** Ventas por sucursal
- **Gráfico de pastel:** Ventas por categoría

**Tabla detallada:**
| Fecha | Factura | Cliente | Sucursal | Vendedor | Total | Estado |
|-------|---------|---------|----------|----------|-------|--------|
| ... | ... | ... | ... | ... | ... | ... |

**Totales:**
- Total facturado
- Total en efectivo
- Total en tarjeta
- Promedio por factura

**Botón:** Exportar a Excel

**Datos desde:**
- GET `/api/reportes/ventas?desde=X&hasta=Y`

---

## 🔗 FLUJOS DE NAVEGACIÓN PRINCIPALES

### **FLUJO 1: Crear una Factura**
```
Login → Dashboard → POS → [Seleccionar cliente] → [Agregar productos] 
→ [Ingresar pagos] → [Facturar] → Ver Factura → Imprimir
```

### **FLUJO 2: Hacer una Compra**
```
Login → Dashboard → Compras → Nueva Orden → [Seleccionar proveedor] 
→ [Agregar productos] → Crear Orden → Recepcionar → Inventario actualizado
```

### **FLUJO 3: Ver Inventario**
```
Login → Dashboard → Inventario → Ver Stock → [Filtrar por sucursal] 
→ Ver productos con stock bajo → Hacer ajuste
```

### **FLUJO 4: Crear Producto**
```
Login → Dashboard → Productos → Nuevo Producto → [Llenar formulario] 
→ [Agregar presentaciones] → [Configurar inventario] → Guardar
```

---
## 📱 COMPONENTES REUTILIZABLES (Continuación)

### **Navbar (components/navbar.html)**
- Logo
- Menú hamburguesa (responsive)
- Búsqueda global de productos
- Notificaciones (campana)
  - Stock bajo
  - Órdenes pendientes
  - Alertas del sistema
- Dropdown de usuario
  - Mi perfil
  - Configuración
  - Cerrar sesión

---

### **Sidebar (components/sidebar.html)**

**Menú lateral con navegación principal:**

```
🏠 Dashboard
   └─ /dashboard

📦 Productos
   ├─ Lista de productos
   ├─ Categorías
   ├─ Marcas
   └─ Presentaciones

📊 Inventario
   ├─ Ver Stock
   ├─ Movimientos
   ├─ Ajustes
   └─ Alertas

💰 Ventas
   ├─ Punto de Venta (POS)
   ├─ Facturas
   └─ Clientes

🛒 Compras
   ├─ Órdenes de Compra
   ├─ Recepciones
   └─ Proveedores

👥 Usuarios
   ├─ Lista de usuarios
   ├─ Roles
   └─ Mi perfil

⚙️ Configuración
   ├─ Sucursales
   ├─ Categorías
   ├─ Marcas
   └─ Presentaciones

📊 Reportes
   ├─ Ventas
   ├─ Inventario
   ├─ Clientes
   └─ Productos más vendidos
```

**Características:**
- Colapsable (icono/texto)
- Íconos de Bootstrap Icons
- Active state según página actual
- Submenu expandible

---

### **Footer (components/footer.html)**
- Copyright
- Versión del sistema
- Links: Soporte, Documentación

---

### **Modals Reutilizables**

#### **Modal Cliente Rápido (components/modals/modal-cliente.html)**
**Para crear cliente desde el POS sin salir**
- Nombre completo
- NIT
- Email (opcional)
- Teléfono (opcional)
- Dirección (opcional)
- Botones: Guardar / Cancelar

---

#### **Modal Producto (components/modals/modal-producto.html)**
**Para crear/editar productos**
- Formulario completo con tabs
- Validaciones en tiempo real
- Preview de imagen

---

#### **Modal Ajuste Inventario (components/modals/modal-ajuste-inventario.html)**
**Para ajustes rápidos desde vista de stock**
- Producto (readonly)
- Cantidad actual (readonly)
- Tipo de ajuste: Entrada/Salida
- Nueva cantidad
- Motivo
- Referencia
- Botones: Confirmar / Cancelar

---

#### **Modal Anular Factura (components/modals/modal-anular-factura.html)**
**Para anular facturas con motivo**
- Número de factura (readonly)
- Cliente (readonly)
- Total (readonly)
- Textarea: Motivo de anulación (obligatorio)
- Botones: Confirmar Anulación / Cancelar

---

#### **Modal Confirmar Eliminación (components/modals/modal-confirmar.html)**
**Componente genérico para confirmaciones**
- Título dinámico
- Mensaje dinámico
- Botones: Sí, eliminar / Cancelar
- Variantes: danger, warning, info

---

### **Tablas Reutilizables (components/tables/)**

#### **Table-Productos (components/tables/table-productos.html)**
**Tabla estándar para mostrar productos**
- Headers: SKU, Imagen, Nombre, Categoría, Marca, Precio, Stock, Estado, Acciones
- Filas dinámicas con datos desde JS
- Acciones: Ver, Editar, Eliminar
- Responsive (colapsa en móvil)
- Paginación incluida

---

#### **Table-Facturas (components/tables/table-facturas.html)**
**Tabla estándar para mostrar facturas**
- Headers: Fecha, Número, Cliente, NIT, Total, Estado, Acciones
- Badge de estado (Emitida=verde, Anulada=rojo)
- Acciones: Ver, Imprimir, Anular
- Filtros integrados

---

#### **Table-Inventario (components/tables/table-inventario.html)**
**Tabla para mostrar stock**
- Headers: Producto, Presentación, Sucursal, Existencia, Mín, Máx, Estado, Acciones
- Indicadores de color según stock
- Acción: Ajustar
- Ordenamiento por columnas

---

### **Cards Reutilizables**

#### **Card-Estadística (components/cards/card-stat.html)**
**Para dashboard - métricas clave**
- Ícono grande
- Título
- Valor numérico grande
- Subtítulo/descripción
- Badge de cambio (↑ +15% vs mes anterior)
- Variantes de color

---

#### **Card-Producto (components/cards/card-producto.html)**
**Para POS - mostrar productos**
- Imagen del producto
- Nombre
- Precio
- Stock disponible
- Badge de categoría
- Click para agregar al carrito

---

#### **Card-Alerta (components/cards/card-alerta.html)**
**Para mostrar alertas/notificaciones**
- Ícono de alerta
- Título
- Mensaje
- Fecha
- Botón de acción
- Tipos: warning, danger, info

---

## 🎨 DISEÑO Y UX

### **Paleta de Colores**
```css
/* Colores principales */
--primary: #0d6efd      /* Azul Bootstrap */
--secondary: #6c757d    /* Gris */
--success: #198754      /* Verde */
--danger: #dc3545       /* Rojo */
--warning: #ffc107      /* Amarillo */
--info: #0dcaf0         /* Cyan */

/* Colores del sistema */
--sidebar-bg: #212529
--sidebar-text: #ffffff
--navbar-bg: #ffffff
--content-bg: #f8f9fa
```

### **Iconografía**
**Usar Bootstrap Icons:**
- Dashboard: `bi-speedometer2`
- Productos: `bi-box-seam`
- Inventario: `bi-clipboard-data`
- Ventas: `bi-cart-check`
- Compras: `bi-bag-plus`
- Clientes: `bi-people`
- Proveedores: `bi-building`
- Usuarios: `bi-person-badge`
- Configuración: `bi-gear`
- Reportes: `bi-graph-up`

### **Estados Visuales**
```
Stock:
- 🟢 Verde: Stock normal (> mínimo)
- 🟡 Amarillo: Stock bajo (< mínimo pero > 50% mínimo)
- 🔴 Rojo: Stock crítico (< 50% del mínimo)

Facturas:
- ✅ Badge Verde: EMITIDA
- ❌ Badge Rojo: ANULADA

Órdenes de Compra:
- ⏳ Badge Amarillo: PENDIENTE
- 📦 Badge Azul: PARCIAL
- ✅ Badge Verde: RECIBIDA
- ❌ Badge Rojo: CANCELADA

Usuarios:
- 🟢 Badge Verde: ACTIVO
- 🔴 Badge Rojo: INACTIVO
```

---

## 📊 DATOS Y APIS POR VISTA

### **Dashboard**
```javascript
// Endpoint único que devuelve todo el dashboard
GET /api/reportes/dashboard

Response:
{
  ventas_hoy: {
    total: 5000.00,
    cantidad_facturas: 12,
    por_hora: [...]
  },
  inventario: {
    productos_stock_bajo: 5,
    total_productos: 150,
    valor_total: 250000.00
  },
  productos_mas_vendidos: [...],
  clientes_recientes: [...],
  movimientos_recientes: [...]
}
```

---

### **Productos - Lista**
```javascript
GET /api/productos?page=1&limit=20&buscar=pintura&categoria_id=1&marca_id=2

Response:
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    total_pages: 8
  }
}
```

---

### **Inventario - Stock**
```javascript
GET /api/inventario?sucursal_id=1&stock_bajo=true

Response:
{
  success: true,
  data: [
    {
      id: 1,
      producto: {...},
      presentacion: {...},
      sucursal: {...},
      existencia: 5,
      stock_minimo: 10,
      stock_maximo: 100,
      estado: "bajo" // bajo, critico, normal
    }
  ]
}
```

---

### **POS - Crear Factura**
```javascript
POST /api/ventas/facturas

Request:
{
  cliente_id: 1,
  usuario_id: 1,
  sucursal_id: 1,
  serie: "A",
  items: [
    {
      producto_presentacion_id: 1,
      cantidad: 2,
      precio_unitario: 150.00,
      descuento_pct: 0
    }
  ],
  pagos: [
    {
      tipo: "EFECTIVO",
      monto: 300.00
    }
  ]
}

Response:
{
  success: true,
  message: "Factura A-1 creada exitosamente",
  data: {...}
}
```

---

### **Compras - Crear Orden**
```javascript
POST /api/compras/ordenes

Request:
{
  proveedor_id: 1,
  sucursal_id: 1,
  usuario_id: 1,
  fecha_orden: "2024-10-16",
  fecha_entrega_estimada: "2024-10-20",
  items: [
    {
      producto_presentacion_id: 1,
      cantidad: 10,
      precio_unitario: 100.00,
      descuento_pct: 5
    }
  ],
  observaciones: "Entrega urgente"
}

Response:
{
  success: true,
  message: "Orden OC-1 creada exitosamente",
  data: {...}
}
```

---

### **Compras - Recepcionar**
```javascript
POST /api/compras/recepciones

Request:
{
  orden_compra_id: 1,
  usuario_id: 1,
  items: [
    {
      detalle_orden_id: 1,
      cantidad_recibida: 10
    },
    {
      detalle_orden_id: 2,
      cantidad_recibida: 5
    }
  ],
  observaciones: "Todo en buen estado"
}

Response:
{
  success: true,
  message: "Recepción registrada exitosamente",
  data: {...}
}
```

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### **Flujo de Autenticación**

```
1. Usuario ingresa credenciales en login.html
   ↓
2. POST /api/usuarios/login
   ↓
3. Backend valida y devuelve:
   {
     success: true,
     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     user: {
       id: 1,
       nombre: "Juan Pérez",
       email: "juan@pinturas.com",
       rol: "Admin",
       sucursal_id: 1
     }
   }
   ↓
4. Frontend guarda en localStorage:
   - token
   - user
   ↓
5. Todas las peticiones posteriores incluyen:
   Headers: {
     'Authorization': 'Bearer ' + token
   }
   ↓
6. Middleware en backend valida token
   ↓
7. Si token inválido/expirado → Redirect a login
```

---

### **Protección de Rutas (Frontend)**

```javascript
// utils/auth-guard.js
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token || !user) {
    window.location.href = '/login.html';
    return false;
  }
  
  // Verificar si token no está expirado
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return false;
  }
  
  return true;
}

// Llamar en cada página protegida
checkAuth();
```

---

### **Interceptor de Axios**

```javascript
// config/api.js
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
    return Promise.reject(error);
  }
);
```

---

## 🎯 VALIDACIONES EN FORMULARIOS

### **Validaciones del lado del Cliente (Frontend)**

#### **Formulario de Producto:**
```javascript
Validaciones:
- Código SKU: Requerido, único, sin espacios
- Descripción: Requerida, mínimo 5 caracteres
- Categoría: Requerida (select)
- Marca: Requerida (select)
- Precio: Requerido, mayor a 0, máximo 2 decimales
- Stock mínimo: Requerido, entero positivo
```

#### **Formulario de Factura (POS):**
```javascript
Validaciones:
- Cliente: Requerido
- Al menos 1 producto en el carrito
- Cantidades > 0
- Stock suficiente para cada producto
- Al menos 1 método de pago
- Suma de pagos = Total de la factura (con tolerancia de Q0.01)
```

#### **Formulario de Orden de Compra:**
```javascript
Validaciones:
- Proveedor: Requerido
- Sucursal: Requerida
- Fecha orden: Requerida, no puede ser futura
- Fecha entrega: Debe ser >= fecha orden
- Al menos 1 producto
- Cantidades > 0
- Precios >= 0
```

---

### **Mensajes de Error Consistentes**

```javascript
// utils/validator.js
const mensajesError = {
  required: 'Este campo es obligatorio',
  email: 'Email inválido',
  minLength: (min) => `Mínimo ${min} caracteres`,
  maxLength: (max) => `Máximo ${max} caracteres`,
  min: (min) => `El valor mínimo es ${min}`,
  max: (max) => `El valor máximo es ${max}`,
  numeric: 'Solo números',
  decimal: 'Formato: 0.00',
  unique: 'Este valor ya existe',
  password: 'Mínimo 8 caracteres, 1 mayúscula, 1 número'
};
```

---

## 📱 RESPONSIVIDAD

### **Breakpoints Bootstrap**
```css
xs: < 576px   (móviles)
sm: >= 576px  (móviles grandes)
md: >= 768px  (tablets)
lg: >= 992px  (laptops)
xl: >= 1200px (desktops)
xxl: >= 1400px (pantallas grandes)
```

### **Adaptaciones por Vista**

#### **Dashboard:**
- **Desktop (lg+):** 4 cards en fila
- **Tablet (md):** 2 cards en fila
- **Móvil (xs-sm):** 1 card por fila

#### **Tablas:**
- **Desktop:** Tabla completa
- **Tablet:** Ocultar columnas secundarias
- **Móvil:** Cards apilados en vez de tabla

#### **Sidebar:**
- **Desktop:** Siempre visible
- **Tablet/Móvil:** Colapsado, botón hamburguesa

#### **POS:**
- **Desktop:** 2 columnas (productos | carrito)
- **Tablet:** 2 columnas comprimidas
- **Móvil:** 1 columna, tabs (Productos | Carrito)

---

## 🚀 FUNCIONALIDADES ESPECIALES

### **Búsqueda Global (Navbar)**
**Permite buscar en todo el sistema:**
- Productos (por nombre, SKU, código)
- Clientes (por nombre, NIT)
- Facturas (por número)
- Proveedores (por nombre)

**Resultados agrupados:**
```
Productos (3)
  - Pintura Látex Blanco 1G
  - Pintura Esmalte Rojo 1/4G
  - Pintura Acrílica Azul 1G

Clientes (1)
  - María López (CF)

Facturas (2)
  - Factura A-1 (Q300.00)
  - Factura A-5 (Q1,200.00)
```

---

### **Autocompletado en POS**
**Búsqueda inteligente de productos:**
- Buscar por nombre
- Buscar por código
- Buscar por SKU
- Buscar por color
- Mostrar solo productos con stock

**Muestra:**
- Imagen miniatura
- Nombre completo
- Presentación
- Precio
- Stock disponible

---

### **Notificaciones en Tiempo Real**
**Campana de notificaciones (Navbar):**
- Badge con número de notificaciones no leídas
- Dropdown con últimas 5 notificaciones
- Tipos:
  - 🔴 Stock crítico (< 50% del mínimo)
  - 🟡 Stock bajo (< mínimo)
  - 📦 Orden de compra pendiente de recepción
  - ✅ Recepción completada
  - ⚠️ Factura anulada

**Click en notificación:**
- Marcar como leída
- Navegar a vista relacionada

---

### **Atajos de Teclado (POS)**
```
F2: Enfocar búsqueda de productos
F3: Enfocar búsqueda de clientes
F4: Nuevo cliente rápido
F5: Limpiar carrito
F9: Facturar (si formulario válido)
ESC: Cerrar modals
Enter: Agregar producto (si está enfocado)
+ / -: Aumentar/disminuir cantidad
```

---

### **Impresión de Facturas**
**Botón "Imprimir" en detalle de factura:**
- Abre vista de impresión (print.css)
- Formato A4 o Ticket (configurable)
- Logo de la empresa
- Información fiscal
- Código QR (opcional, para FEL)
- Compatible con impresoras térmicas

---

### **Exportación a Excel**
**Botón "Exportar" en listados:**
- Facturas
- Inventario
- Reportes de ventas
- Clientes
- Proveedores

**Usa librería:** SheetJS (xlsx.js)

---

## 🔄 ESTADOS DE CARGA Y ERRORES

### **Loading States**
```html
<!-- Spinner mientras carga -->
<div class="text-center my-5">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Cargando...</span>
  </div>
  <p class="mt-2">Cargando productos...</p>
</div>
```

### **Empty States**
```html
<!-- Cuando no hay datos -->
<div class="text-center my-5">
  <i class="bi bi-inbox display-1 text-muted"></i>
  <h4 class="mt-3">No hay productos</h4>
  <p class="text-muted">Comienza agregando tu primer producto</p>
  <button class="btn btn-primary">Agregar Producto</button>
</div>
```

### **Error States**
```html
<!-- Cuando hay un error -->
<div class="alert alert-danger" role="alert">
  <i class="bi bi-exclamation-triangle-fill"></i>
  <strong>Error:</strong> No se pudo cargar los productos.
  <button class="btn btn-sm btn-outline-danger" onclick="reintentar()">
    Reintentar
  </button>
</div>
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Fase 1: Setup Inicial (Día 1)**
- [ ] Crear estructura de carpetas
- [ ] Configurar Bootstrap + Bootstrap Icons
- [ ] Configurar Axios
- [ ] Crear config/api.js con URLs base
- [ ] Crear utils/storage.js
- [ ] Crear utils/formatter.js

### **Fase 2: Autenticación (Día 1-2)**
- [ ] Crear login.html
- [ ] Crear auth.service.js
- [ ] Crear auth.controller.js
- [ ] Implementar guardado de token
- [ ] Implementar protección de rutas
- [ ] Crear interceptor de Axios

### **Fase 3: Layout Base (Día 2)**
- [ ] Crear navbar.html
- [ ] Crear sidebar.html
- [ ] Crear footer.html
- [ ] Crear dashboard.html con estructura
- [ ] Integrar componentes en dashboard

### **Fase 4: Dashboard (Día 2-3)**
- [ ] Crear dashboard.controller.js
- [ ] Crear dashboard.service.js
- [ ] Implementar cards de estadísticas
- [ ] Implementar gráficos básicos (Chart.js)
- [ ] Conectar con API

### **Fase 5: Productos (Día 3-4)**
- [ ] Crear lista.html
- [ ] Crear modal-producto.html
- [ ] Crear productos.service.js
- [ ] Crear productos.controller.js
- [ ] Implementar CRUD completo
- [ ] Implementar búsqueda y filtros

### **Fase 6: Inventario (Día 4-5)**
- [ ] Crear stock.html
- [ ] Crear movimientos.html
- [ ] Crear ajustes.html
- [ ] Crear inventario.service.js
- [ ] Crear inventario.controller.js
- [ ] Implementar indicadores de stock

### **Fase 7: POS (Día 5-7)**
- [ ] Crear pos.html
- [ ] Crear card-producto.html
- [ ] Implementar búsqueda de productos
- [ ] Implementar carrito de compras
- [ ] Implementar cálculo de totales
- [ ] Implementar múltiples pagos
- [ ] Conectar con API de facturas
- [ ] Implementar validaciones

### **Fase 8: Facturas (Día 7-8)**
- [ ] Crear facturas.html (listado)
- [ ] Crear detalle-factura.html
- [ ] Implementar filtros
- [ ] Implementar anulación
- [ ] Implementar impresión

### **Fase 9: Compras (Día 8-10)**
- [ ] Crear ordenes.html
- [ ] Crear crear-orden.html
- [ ] Crear recepciones.html
- [ ] Crear compras.service.js
- [ ] Crear compras.controller.js
- [ ] Implementar flujo completo

### **Fase 10: Otros Módulos (Día 10-12)**
- [ ] Clientes (lista, crear, detalle)
- [ ] Proveedores (lista, crear, detalle)
- [ ] Usuarios (lista, crear, perfil)

### **Fase 11: Configuración (Día 12-13)**
- [ ] Categorías
- [ ] Marcas
- [ ] Presentaciones
- [ ] Sucursales

### **Fase 12: Reportes (Día 13-14)**
- [ ] Reporte de ventas
- [ ] Reporte de inventario
- [ ] Gráficos avanzados

### **Fase 13: Pulir y Optimizar (Día 14-15)**
- [ ] Revisar responsividad
- [ ] Optimizar carga de imágenes
- [ ] Implementar lazy loading
- [ ] Mejorar UX
- [ ] Testing manual completo

---

## 🎯 PRIORIDAD DE DESARROLLO

### **🔴 ALTA PRIORIDAD (Semana 1)**
1. Login y autenticación
2. Dashboard básico
3. Productos (CRUD)
4. Inventario (Ver stock, ajustes)
5. POS (Crear facturas)
6. Ver facturas

### **🟡 MEDIA PRIORIDAD (Semana 2)**
7. Compras (Órdenes, recepciones)
8. Clientes (CRUD)
9. Proveedores (CRUD)
10. Reportes básicos

### **🟢 BAJA PRIORIDAD (Semana 3+)**
11. Usuarios (CRUD completo)
12. Configuración avanzada
13. Reportes avanzados con gráficos
14. Notificaciones en tiempo real
15. Optimizaciones y mejoras UX

---

## ✅ RESUMEN FINAL

**Total de vistas:** ~35 páginas HTML
**Total de services:** ~12 archivos
**Total de controllers:** ~12 archivos
**Total de componentes:** ~15 archivos
**Total de modals:** ~6 archivos

**Tiempo estimado:** 2-3 semanas de desarrollo full-time

**Stack:**
- Bootstrap 5
- Bootstrap Icons
- Axios
- Chart.js (gráficos)
- SweetAlert2 (alertas bonitas)
- DataTables (opcional, para tablas avanzadas)

