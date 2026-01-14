# DevTools REST API - Guía de Uso

## 📋 Resumen

Los endpoints REST de DevTools permiten operaciones CRUD en cualquier tabla de la base de datos de forma agnóstica. Actualmente **sin validaciones de negocio** (se agregarán posteriormente mediante middlewares).

---

## 🔗 Endpoints Disponibles

### Base URL
```
http://localhost:3000/api/devtools
```

---

## 📚 Metadatos

### 1. Listar todas las tablas disponibles

```http
GET /api/devtools/tables
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    "users",
    "businesses",
    "kitchens",
    "kitchen_type",
    "permissions",
    "roles",
    "user_has_permissions",
    "users_has_roles"
  ],
  "metadata": {
    "count": 8,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Obtener schema de una tabla

```http
GET /api/devtools/tables/:table/schema
```

**Ejemplo:**
```http
GET /api/devtools/tables/users/schema
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "tableName": "users",
    "columns": {
      "id": { "type": "serial", "primaryKey": true, "notNull": true },
      "email": { "type": "text", "notNull": true },
      "name": { "type": "text" },
      "user_type": { "type": "text", "notNull": true },
      "created_at": { "type": "timestamp", "notNull": true }
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Tabla no encontrada: invalid_table"
}
```

---

## 📝 Operaciones CRUD

### 3. Crear un registro (CREATE)

```http
POST /api/devtools/:table
Content-Type: application/json

{
  "campo1": "valor1",
  "campo2": "valor2"
}
```

**Ejemplo - Crear usuario:**
```http
POST /api/devtools/users
Content-Type: application/json

{
  "email": "admin@example.com",
  "name": "Admin User",
  "user_type": "admin"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "user_type": "admin",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Respuesta error (400):**
```json
{
  "success": false,
  "error": "Data no puede estar vacía"
}
```

---

### 4. Leer registros con filtros (READ)

```http
GET /api/devtools/:table?campo1=valor1&campo2=valor2
```

**Ejemplo - Listar todos los usuarios:**
```http
GET /api/devtools/users
```

**Ejemplo - Filtrar usuarios por tipo:**
```http
GET /api/devtools/users?user_type=admin
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "user_type": "admin",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "email": "admin2@example.com",
      "name": "Admin 2",
      "user_type": "admin",
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  ],
  "metadata": {
    "count": 2,
    "filters": {
      "user_type": "admin"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Leer un registro por ID (READ BY ID)

```http
GET /api/devtools/:table/:id
```

**Ejemplo:**
```http
GET /api/devtools/users/1
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "user_type": "admin",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Registro no encontrado",
  "metadata": {
    "table": "users",
    "id": 999,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 6. Actualizar un registro (UPDATE)

```http
PUT /api/devtools/:table/:id
Content-Type: application/json

{
  "campo1": "nuevo_valor1"
}
```

**Ejemplo:**
```http
PUT /api/devtools/users/1
Content-Type: application/json

{
  "name": "Admin Updated"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin Updated",
    "user_type": "admin",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  },
  "metadata": {
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

**Respuesta error (400):**
```json
{
  "success": false,
  "error": "Data no puede estar vacía"
}
```

---

### 7. Eliminar un registro (DELETE)

```http
DELETE /api/devtools/:table/:id
```

**Ejemplo:**
```http
DELETE /api/devtools/users/1
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "user_type": "admin"
  },
  "metadata": {
    "timestamp": "2024-01-15T12:30:00.000Z"
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Registro no encontrado",
  "metadata": {
    "table": "users",
    "id": 999,
    "timestamp": "2024-01-15T12:30:00.000Z"
  }
}
```

---

## 🧪 Testing con cURL

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/devtools/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "user_type": "employee"
  }'
```

### Listar usuarios
```bash
curl http://localhost:3000/api/devtools/users
```

### Filtrar por tipo
```bash
curl "http://localhost:3000/api/devtools/users?user_type=admin"
```

### Obtener por ID
```bash
curl http://localhost:3000/api/devtools/users/1
```

### Actualizar usuario
```bash
curl -X PUT http://localhost:3000/api/devtools/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

### Eliminar usuario
```bash
curl -X DELETE http://localhost:3000/api/devtools/users/1
```

---

## 📦 Testing con Postman

### Collection importable

Crea una colección en Postman con estas variables:

**Variables de entorno:**
```
BASE_URL = http://localhost:3000
API_PATH = /api/devtools
```

**Requests:**

1. **List Tables**
   - GET `{{BASE_URL}}{{API_PATH}}/tables`

2. **Get Schema**
   - GET `{{BASE_URL}}{{API_PATH}}/tables/users/schema`

3. **Create Record**
   - POST `{{BASE_URL}}{{API_PATH}}/users`
   - Body: raw JSON

4. **Read Records**
   - GET `{{BASE_URL}}{{API_PATH}}/users`

5. **Read by ID**
   - GET `{{BASE_URL}}{{API_PATH}}/users/1`

6. **Update Record**
   - PUT `{{BASE_URL}}{{API_PATH}}/users/1`
   - Body: raw JSON

7. **Delete Record**
   - DELETE `{{BASE_URL}}{{API_PATH}}/users/1`

---

## ⚠️ Validaciones Actuales

**Solo validaciones técnicas:**
- ✅ Tabla existe en el schema
- ✅ Data no está vacía
- ✅ ID es válido (número o string)

**Validaciones de negocio pendientes:**
- ❌ Permisos por user_type (admin, ownership, employee, guest, diner)
- ❌ Validación de campos requeridos por tabla
- ❌ Validación de relaciones (foreign keys)
- ❌ Validación de formato de datos
- ❌ Validación de unicidad (email, etc.)

---

## 🔐 Seguridad

**IMPORTANTE:** Actualmente estos endpoints están **completamente abiertos**. 

Próximos pasos de seguridad:
1. Middleware de autenticación JWT
2. Middleware de autorización por user_type
3. Rate limiting
4. Input sanitization
5. CSRF protection

---

## 🏗️ Arquitectura

```
Request → Router → Controller → Service → Database
```

**Responsabilidades:**
- **Router** (`devTools.routes.ts`): Define rutas y métodos HTTP
- **Controller** (`devTools.controller.ts`): Maneja request/response HTTP
- **Service** (`databaseCrud/`): Lógica de negocio y acceso a DB
- **Database** (Drizzle ORM): Abstracción de PostgreSQL

---

## 📊 Códigos de Estado HTTP

| Código | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Lectura, actualización o eliminación exitosa |
| 201 | Created | Creación exitosa |
| 400 | Bad Request | Datos inválidos o faltantes |
| 404 | Not Found | Registro o tabla no encontrada |
| 500 | Internal Server Error | Error del servidor |

---

## 🚀 Próximos Pasos

1. **Agregar middlewares de validación**
   - Crear `middlewares/devTools.validation.ts`
   - Validar permisos por user_type
   - Validar campos requeridos por tabla

2. **Agregar autenticación**
   - Integrar JWT del sistema auth existente
   - Solo usuarios autenticados
   - Solo admin puede usar DevTools

3. **Agregar audit logging**
   - Registrar todas las operaciones
   - Quién hizo qué, cuándo y en qué tabla

4. **Mejorar manejo de errores**
   - Error handler middleware
   - Mensajes de error más específicos
   - Logging estructurado

---

## 📝 Notas de Implementación

- **Sin business rules**: Los servicios solo validan técnicamente (tabla existe, data no nula)
- **Sin autorización**: Cualquiera puede llamar estos endpoints por ahora
- **Sin sanitización**: Los datos se pasan directamente a Drizzle ORM
- **Hard delete**: DELETE elimina permanentemente (no soft delete)
- **Sin paginación**: READ devuelve todos los registros

Estas limitaciones son **intencionales** para empezar simple. Se agregarán features incrementalmente según las necesidades de cada caso de uso.
