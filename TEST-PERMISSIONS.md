# Guía de Pruebas - Sistema de Permisos de Empleados

## 📋 Requisitos previos

1. Servidor corriendo: `npm run dev` (puerto 3000)
2. Base de datos PostgreSQL activa
3. Migraciones aplicadas: `npx drizzle-kit push`
4. Datos de prueba insertados: ejecutar `test-permissions-data.sql`
5. Cliente HTTP: Postman, Thunder Client o similar

---

## 🔐 Credenciales de prueba

### Admin (todos los permisos)
- **Email**: `admin@test-permissions.com`
- **Password**: `admin123`
- **Tipo**: `admin`
- **Comportamiento**: Bypass automático en todos los permisos

### Employee Full (permisos completos)
- **Email**: `employee-full@test-permissions.com`
- **Password**: `employee123`
- **Tipo**: `employee`
- **Permisos**: 
  - ✅ Productos: ver, crear, editar, eliminar
  - ✅ Categorías: ver, crear, editar (NO eliminar)
  - ✅ Horarios: ver, editar
  - ✅ Redes sociales: ver, editar

### Employee Read-Only (solo lectura)
- **Email**: `employee-readonly@test-permissions.com`
- **Password**: `employee123`
- **Tipo**: `employee`
- **Permisos**: 
  - ✅ Productos: solo ver
  - ✅ Categorías: solo ver
  - ❌ Todo lo demás: sin acceso

### Guest (sin permisos)
- **Email**: `guest@test-permissions.com`
- **Password**: `guest123`
- **Tipo**: `guest`
- **Permisos**: Ninguno (bloqueado en endpoints protegidos)

---

## 🧪 Casos de prueba

### Prueba 1: Login y verificación de JWT

**Objetivo**: Verificar que el JWT contiene los campos nuevos (`type`, `branchId`, `permissions`)

**Pasos**:
1. Hacer login con cada usuario
2. Copiar el token JWT de la cookie `auth_token`
3. Decodificar en https://jwt.io
4. Verificar que el payload contiene los campos

**Request**:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "platformName": "local",
  "email": "admin@test-permissions.com",
  "password": "admin123"
}
```

**Respuesta esperada**:
```json
{
  "success": true,
  "data": {
    "user": {
      "firstName": "Admin",
      "lastName": "Test",
      "email": "admin@test-permissions.com",
      "type": "admin",
      "branchId": null,
      "permissions": null,
      "state": "active",
      "imageUrl": null
    }
  }
}
```

**Verificar JWT** (copiar de cookie y decodificar):
```json
{
  "userId": 1,
  "email": "admin@test-permissions.com",
  "type": "admin",
  "branchId": null,
  "permissions": null,
  "state": "active",
  "iat": 1733826000,
  "exp": 1736418000
}
```

---

### Prueba 2: Middleware requireRole (filtro por tipo)

**Objetivo**: Verificar que solo admin y employee pueden acceder

**Request** (con token de admin o employee):
```http
GET http://localhost:3000/api/auth/test-permissions
Cookie: auth_token=<JWT_TOKEN>
```

**Respuesta esperada (admin)**:
```json
{
  "success": true,
  "message": "✅ Sistema de permisos funcionando correctamente",
  "user": {
    "userId": 1,
    "email": "admin@test-permissions.com",
    "type": "admin",
    "branchId": null,
    "permissions": null,
    "state": "active"
  }
}
```

**Respuesta esperada (employee-full)**:
```json
{
  "success": true,
  "message": "✅ Sistema de permisos funcionando correctamente",
  "user": {
    "userId": 2,
    "email": "employee-full@test-permissions.com",
    "type": "employee",
    "branchId": 1,
    "permissions": {
      "products": { "canView": true, "canCreate": true, "canEdit": true, "canDelete": true },
      "categories": { "canView": true, "canCreate": true, "canEdit": true, "canDelete": false }
      // ... resto de permisos
    },
    "state": "active"
  }
}
```

**Request con guest** (debe fallar):
```http
GET http://localhost:3000/api/auth/test-permissions
Cookie: auth_token=<JWT_GUEST_TOKEN>
```

**Respuesta esperada (error 403)**:
```json
{
  "success": false,
  "error": "No tienes permisos para realizar esta acción"
}
```

---

### Prueba 3: requirePermission - Admin bypass

**Objetivo**: Verificar que admin puede editar productos sin permisos explícitos

**Request** (con token de admin):
```http
GET http://localhost:3000/api/auth/test-permissions/products-edit
Cookie: auth_token=<JWT_ADMIN_TOKEN>
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "✅ Tienes permiso para editar productos",
  "user": {
    "userId": 1,
    "type": "admin",
    "branchId": null
  }
}
```

---

### Prueba 4: requirePermission - Employee con permiso

**Objetivo**: Verificar que employee-full puede editar productos

**Request** (con token de employee-full):
```http
GET http://localhost:3000/api/auth/test-permissions/products-edit
Cookie: auth_token=<JWT_EMPLOYEE_FULL_TOKEN>
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "✅ Tienes permiso para editar productos",
  "user": {
    "userId": 2,
    "type": "employee",
    "branchId": 1
  }
}
```

---

### Prueba 5: requirePermission - Employee SIN permiso

**Objetivo**: Verificar que employee-readonly NO puede editar productos

**Request** (con token de employee-readonly):
```http
GET http://localhost:3000/api/auth/test-permissions/products-edit
Cookie: auth_token=<JWT_EMPLOYEE_READONLY_TOKEN>
```

**Respuesta esperada (error 403)**:
```json
{
  "success": false,
  "error": "No tienes permiso para canEdit en products"
}
```

---

### Prueba 6: requirePermission - Permiso específico negado

**Objetivo**: Verificar que employee-full NO puede eliminar categorías

**Request** (con token de employee-full):
```http
GET http://localhost:3000/api/auth/test-permissions/categories-delete
Cookie: auth_token=<JWT_EMPLOYEE_FULL_TOKEN>
```

**Respuesta esperada (error 403)**:
```json
{
  "success": false,
  "error": "No tienes permiso para canDelete en categories"
}
```

**Request con admin** (debe pasar):
```http
GET http://localhost:3000/api/auth/test-permissions/categories-delete
Cookie: auth_token=<JWT_ADMIN_TOKEN>
```

**Respuesta esperada**:
```json
{
  "success": true,
  "message": "✅ Tienes permiso para eliminar categorías",
  "user": {
    "userId": 1,
    "type": "admin"
  }
}
```

---

## 📊 Matriz de pruebas esperadas

| Usuario | Ruta | Resultado Esperado |
|---------|------|-------------------|
| Admin | `/test-permissions` | ✅ Pasa |
| Employee Full | `/test-permissions` | ✅ Pasa |
| Employee ReadOnly | `/test-permissions` | ✅ Pasa |
| Guest | `/test-permissions` | ❌ 403 Forbidden |
| Admin | `/test-permissions/products-edit` | ✅ Pasa (bypass) |
| Employee Full | `/test-permissions/products-edit` | ✅ Pasa (tiene permiso) |
| Employee ReadOnly | `/test-permissions/products-edit` | ❌ 403 (sin permiso) |
| Admin | `/test-permissions/categories-delete` | ✅ Pasa (bypass) |
| Employee Full | `/test-permissions/categories-delete` | ❌ 403 (sin permiso) |
| Employee ReadOnly | `/test-permissions/categories-delete` | ❌ 403 (sin permiso) |

---

## 🔍 Verificación en base de datos

```sql
-- Verificar usuarios creados
SELECT 
  id,
  first_name,
  email,
  type,
  branch_id,
  state,
  is_active,
  LEFT(permissions::text, 100) as permissions_preview
FROM users
WHERE email LIKE '%@test-permissions.com'
ORDER BY type;

-- Verificar sucursal asignada
SELECT 
  b.id as branch_id,
  b.name as branch_name,
  c.name as company_name,
  u.email as employee_email
FROM branches b
JOIN companies c ON b.company_id = c.id
LEFT JOIN users u ON u.branch_id = b.id AND u.type = 'employee'
WHERE b.name = 'Sucursal Central - Test';
```

---

## ✅ Checklist de validación

- [ ] Admin puede hacer login y JWT contiene `type: 'admin'`
- [ ] Employee Full puede hacer login y JWT contiene `type: 'employee'`, `branchId`, `permissions`
- [ ] Employee ReadOnly puede hacer login con permisos limitados
- [ ] Guest puede hacer login con `type: 'guest'`
- [ ] Admin pasa todas las rutas protegidas (bypass)
- [ ] Employee Full pasa `/test-permissions` y `/products-edit`
- [ ] Employee Full falla en `/categories-delete` (sin permiso)
- [ ] Employee ReadOnly pasa `/test-permissions` pero falla en `/products-edit`
- [ ] Guest falla en todas las rutas protegidas (403)
- [ ] JWT decodificado en jwt.io muestra todos los campos correctamente

---

## 🚀 Próximos pasos después de validar

1. Eliminar rutas de prueba `/test-permissions` de `auth.routes.ts`
2. Aplicar middlewares a rutas productivas:
   - `products.routes.ts` → agregar `requireRole` + `requirePermission`
   - `categories.routes.ts` → agregar `requireRole` + `requirePermission`
   - `branches.routes.ts` → agregar `requireBranchAccess`
3. Crear endpoints de gestión de empleados (Fase 3)
4. Actualizar frontend para mostrar permisos y restricciones UI

---

## ⚠️ Notas importantes

- Las rutas de prueba son **temporales** y deben eliminarse antes de producción
- El script SQL crea usuarios con contraseñas **hardcodeadas** (solo para testing)
- Los permisos están en formato JSON y pueden parsearse con `JSON.parse()`
- El middleware `requirePermission` hace bypass automático para admins
- La cookie `auth_token` es `httpOnly` y `secure` (HTTPS en producción)
