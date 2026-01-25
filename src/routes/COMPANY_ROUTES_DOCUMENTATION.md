# Company API Routes Documentation

## Base URL
`/api/company`

---

## Endpoints

### 1. Verificar Disponibilidad de Nombre
**Endpoint:** `GET /api/company/check-name`  
**Descripción:** Verifica si un nombre de compañía está disponible (no duplicado).  
**Autenticación:** No requerida (público para mejorar UX)

**Query Parameters:**
- `name` (string, required): Nombre de compañía a verificar

**Response 200 OK:**
```json
{
  "success": true,
  "available": true
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": "Company name is required"
}
```

---

### 2. Crear Compañía
**Endpoint:** `POST /api/company`  
**Descripción:** Crea una nueva compañía para el usuario autenticado.  
**Autenticación:** Requerida (JWT)

**Request Body:**
```json
{
  "name": "My Company",
  "description": "Company description (optional)",
  "logoUrl": "https://example.com/logo.png (optional)"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my company",
    "description": "Company description",
    "ownerId": 123,
    "logoUrl": "https://example.com/logo.png",
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": "Company name is required"
}
```

**Response 409 Conflict:**
```json
{
  "success": false,
  "error": "Company name is already taken"
}
```

---

### 3. Obtener Todas las Compañías
**Endpoint:** `GET /api/company`  
**Descripción:** Obtiene todas las compañías del usuario autenticado con paginación.  
**Autenticación:** Requerida (JWT)

**Query Parameters:**
- `state` (string, optional): Filtrar por estado ('active' | 'archived')
- `page` (number, optional): Número de página (default: 1)
- `limit` (number, optional): Registros por página (default: 10, max: 100)

**Response 200 OK:**
```json
{
  "success": true,
  "companies": [
    {
      "id": 1,
      "name": "my company",
      "description": "Company description",
      "ownerId": 123,
      "logoUrl": null,
      "state": "active",
      "archivedAt": null,
      "createdAt": "2026-01-24T10:00:00.000Z",
      "updatedAt": "2026-01-24T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 4. Obtener Compañía Específica
**Endpoint:** `GET /api/company/:id`  
**Descripción:** Obtiene los detalles de una compañía específica.  
**Autenticación:** Requerida (JWT)

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Response 200 OK:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my company",
    "description": "Company description",
    "ownerId": 123,
    "logoUrl": null,
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

**Response 403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "error": "Company not found"
}
```

---

### 5. Actualizar Compañía
**Endpoint:** `PATCH /api/company/:id`  
**Descripción:** Actualiza los datos de una compañía existente.  
**Autenticación:** Requerida (JWT)

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Request Body:**
```json
{
  "name": "Updated Company Name (optional)",
  "description": "Updated description (optional)",
  "logoUrl": "https://example.com/new-logo.png (optional)"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "updated company name",
    "description": "Updated description",
    "ownerId": 123,
    "logoUrl": "https://example.com/new-logo.png",
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T11:00:00.000Z"
  }
}
```

**Response 409 Conflict:**
```json
{
  "success": false,
  "error": "Company name is already taken"
}
```

---

### 6. Eliminar Compañía
**Endpoint:** `DELETE /api/company/:id`  
**Descripción:** Elimina físicamente una compañía de la base de datos.  
**Autenticación:** Requerida (JWT)  
**Nota:** Esta es una eliminación permanente. Considera usar archive en su lugar.

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

**Response 403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

---

### 7. Archivar Compañía
**Endpoint:** `POST /api/company/:id/archive`  
**Descripción:** Marca una compañía como archivada (soft delete).  
**Autenticación:** Requerida (JWT)

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Response 200 OK:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my company",
    "description": "Company description",
    "ownerId": 123,
    "logoUrl": null,
    "state": "archived",
    "archivedAt": "2026-01-24T12:00:00.000Z",
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T12:00:00.000Z"
  },
  "message": "Company archived successfully"
}
```

**Response 409 Conflict:**
```json
{
  "success": false,
  "error": "Company is already archived"
}
```

---

### 8. Reactivar Compañía
**Endpoint:** `POST /api/company/:id/reactivate`  
**Descripción:** Reactiva una compañía previamente archivada.  
**Autenticación:** Requerida (JWT)

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Response 200 OK:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my company",
    "description": "Company description",
    "ownerId": 123,
    "logoUrl": null,
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T13:00:00.000Z"
  },
  "message": "Company reactivated successfully"
}
```

**Response 409 Conflict:**
```json
{
  "success": false,
  "error": "Company is not archived"
}
```

---

### 9. Verificar Permisos
**Endpoint:** `GET /api/company/:id/permission`  
**Descripción:** Verifica si el usuario tiene permisos sobre una compañía.  
**Autenticación:** Requerida (JWT)

**Path Parameters:**
- `id` (number, required): ID de la compañía

**Response 200 OK (con permiso):**
```json
{
  "success": true,
  "hasPermission": true
}
```

**Response 200 OK (sin permiso):**
```json
{
  "success": true,
  "hasPermission": false,
  "reason": "User is not the owner"
}
```

---

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: Autenticación requerida o inválida
- **403 Forbidden**: Usuario no tiene permisos
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: nombre duplicado, estado inválido)

---

## Notas Importantes

### Autenticación
La mayoría de los endpoints requieren autenticación mediante JWT. El token se debe enviar en:
- **Cookie**: `auth-token` (recomendado)
- **Header**: `Authorization: Bearer <token>` (alternativo)

Actualmente los middlewares tienen un TODO para extraer el userId del JWT. Por ahora aceptan:
- `req.user.id` (cuando se implemente el middleware de autenticación)
- `req.body.userId` o `req.query.userId` (temporal para testing)

### Normalización de Nombres
Los nombres de compañías se normalizan automáticamente:
- Se convierten a minúsculas
- Se eliminan espacios extras
- Se aplica trim

### Rate Limiting
- Cada usuario puede crear un máximo de 10 compañías
- Esta validación se realiza en el servicio `createCompany`

### Paginación
- Página mínima: 1
- Límite por defecto: 10
- Límite máximo: 100

### Estados de Compañía
- `active`: Compañía activa (default al crear)
- `archived`: Compañía archivada (soft delete)

### Transacciones
Todos los servicios usan transacciones de base de datos para garantizar:
- Consistencia de datos
- Prevención de race conditions
- Locks optimistas con `SELECT FOR UPDATE`

### Unique Constraints
La base de datos garantiza la unicidad de nombres mediante constraint único.
El servicio `checkNameAvailability` es solo para UX (hint) y no debe usarse
como validación de seguridad.
