# Company API - Ejemplos de Uso con cURL

Este archivo contiene ejemplos prácticos de cómo usar la API de Company con cURL.

## Variables de Entorno
```bash
export API_URL="http://localhost:3000"
export USER_ID=1  # Temporal hasta implementar JWT
```

---

## 1. Verificar Disponibilidad de Nombre

```bash
# Verificar si un nombre está disponible
curl -X GET "${API_URL}/api/company/check-name?name=My%20Company" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "available": true
}
```

---

## 2. Crear Compañía

```bash
# Crear compañía con todos los campos
curl -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "My Tech Company",
    "description": "A technology company focused on innovation",
    "logoUrl": "https://example.com/logo.png"
  }'

# Crear compañía con campos mínimos
curl -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Simple Company"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my tech company",
    "description": "A technology company focused on innovation",
    "ownerId": 1,
    "logoUrl": "https://example.com/logo.png",
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

---

## 3. Obtener Todas las Compañías

```bash
# Obtener todas las compañías (default: página 1, límite 10)
curl -X GET "${API_URL}/api/company?userId=${USER_ID}" \
  -H "Content-Type: application/json"

# Obtener solo compañías activas
curl -X GET "${API_URL}/api/company?userId=${USER_ID}&state=active" \
  -H "Content-Type: application/json"

# Obtener compañías archivadas con paginación
curl -X GET "${API_URL}/api/company?userId=${USER_ID}&state=archived&page=1&limit=5" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "companies": [
    {
      "id": 1,
      "name": "my tech company",
      "description": "A technology company",
      "ownerId": 1,
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

## 4. Obtener Compañía Específica

```bash
# Obtener compañía por ID
curl -X GET "${API_URL}/api/company/1?userId=${USER_ID}" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my tech company",
    "description": "A technology company",
    "ownerId": 1,
    "logoUrl": null,
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T10:00:00.000Z"
  }
}
```

---

## 5. Actualizar Compañía

```bash
# Actualizar nombre y descripción
curl -X PATCH "${API_URL}/api/company/1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Updated Company Name",
    "description": "Updated description"
  }'

# Actualizar solo el logo
curl -X PATCH "${API_URL}/api/company/1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "logoUrl": "https://example.com/new-logo.png"
  }'

# Actualizar sin cambios (no-op)
curl -X PATCH "${API_URL}/api/company/1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Updated Company Name"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "updated company name",
    "description": "Updated description",
    "ownerId": 1,
    "logoUrl": "https://example.com/new-logo.png",
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T11:00:00.000Z"
  }
}
```

---

## 6. Archivar Compañía

```bash
# Archivar compañía (soft delete)
curl -X POST "${API_URL}/api/company/1/archive" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my tech company",
    "description": "A technology company",
    "ownerId": 1,
    "logoUrl": null,
    "state": "archived",
    "archivedAt": "2026-01-24T12:00:00.000Z",
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T12:00:00.000Z"
  },
  "message": "Company archived successfully"
}
```

---

## 7. Reactivar Compañía

```bash
# Reactivar compañía archivada
curl -X POST "${API_URL}/api/company/1/reactivate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "company": {
    "id": 1,
    "name": "my tech company",
    "description": "A technology company",
    "ownerId": 1,
    "logoUrl": null,
    "state": "active",
    "archivedAt": null,
    "createdAt": "2026-01-24T10:00:00.000Z",
    "updatedAt": "2026-01-24T13:00:00.000Z"
  },
  "message": "Company reactivated successfully"
}
```

---

## 8. Eliminar Compañía

```bash
# Eliminar compañía permanentemente
curl -X DELETE "${API_URL}/api/company/1?userId=${USER_ID}" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

---

## 9. Verificar Permisos

```bash
# Verificar si el usuario tiene permisos
curl -X GET "${API_URL}/api/company/1/permission?userId=${USER_ID}" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (con permiso):**
```json
{
  "success": true,
  "hasPermission": true
}
```

**Respuesta esperada (sin permiso):**
```json
{
  "success": true,
  "hasPermission": false,
  "reason": "User is not the owner"
}
```

---

## Flujo Completo de Ejemplo

```bash
# 1. Verificar disponibilidad del nombre
curl -X GET "${API_URL}/api/company/check-name?name=TechCorp" \
  -H "Content-Type: application/json"

# 2. Crear la compañía
curl -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "TechCorp",
    "description": "Innovation company"
  }'

# 3. Obtener todas mis compañías
curl -X GET "${API_URL}/api/company?userId=1" \
  -H "Content-Type: application/json"

# 4. Actualizar la compañía
curl -X PATCH "${API_URL}/api/company/1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "description": "Leading innovation company"
  }'

# 5. Archivar la compañía
curl -X POST "${API_URL}/api/company/1/archive" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'

# 6. Ver compañías archivadas
curl -X GET "${API_URL}/api/company?userId=1&state=archived" \
  -H "Content-Type: application/json"

# 7. Reactivar la compañía
curl -X POST "${API_URL}/api/company/1/reactivate" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

---

## Manejo de Errores

### Error 400 - Datos inválidos
```bash
curl -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": ""
  }'
```

**Respuesta:**
```json
{
  "success": false,
  "error": "Company name cannot be empty"
}
```

### Error 403 - Sin permisos
```bash
# Intentar actualizar compañía de otro usuario
curl -X PATCH "${API_URL}/api/company/1" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 999,
    "name": "Hacked"
  }'
```

**Respuesta:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

### Error 404 - No encontrado
```bash
curl -X GET "${API_URL}/api/company/9999?userId=1" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "success": false,
  "error": "Company not found"
}
```

### Error 409 - Conflicto (nombre duplicado)
```bash
curl -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "TechCorp"
  }'
# (intentar crear dos veces el mismo nombre)
```

**Respuesta:**
```json
{
  "success": false,
  "error": "Company name is already taken"
}
```

---

## Testing Automatizado

Puedes crear un script bash para testing:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
USER_ID=1

echo "=== Testing Company API ==="

echo "\n1. Creating company..."
COMPANY_ID=$(curl -s -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}, \"name\": \"Test Company\"}" \
  | jq -r '.company.id')

echo "Created company with ID: ${COMPANY_ID}"

echo "\n2. Getting all companies..."
curl -s -X GET "${API_URL}/api/company?userId=${USER_ID}" | jq

echo "\n3. Updating company..."
curl -s -X PATCH "${API_URL}/api/company/${COMPANY_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}, \"description\": \"Updated\"}" | jq

echo "\n4. Archiving company..."
curl -s -X POST "${API_URL}/api/company/${COMPANY_ID}/archive" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}}" | jq

echo "\n=== Test completed ==="
```

---

## Notas

1. **Autenticación**: Los ejemplos usan `userId` en body/query por simplicidad. En producción se debe usar JWT.
2. **CORS**: Asegúrate de que el servidor tenga CORS configurado si llamas desde un navegador.
3. **Puerto**: Los ejemplos asumen que el servidor corre en el puerto 3000.
4. **jq**: Los ejemplos usan `jq` para formatear JSON. Instálalo con: `brew install jq` (Mac) o `apt install jq` (Linux).
