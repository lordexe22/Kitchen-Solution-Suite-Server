# Fase 2: Routes y Endpoints REST

## 📋 Plan de Implementación

### Objetivo
Exponer los servicios CRUD a través de una API REST con validación, manejo de errores y tipos TypeScript.

## 🗺️ Estructura de Rutas

```
GET    /api/devtools/tables              - Listar tablas disponibles
POST   /api/devtools/:table              - CREATE record
GET    /api/devtools/:table              - READ records (con filtros)
GET    /api/devtools/:table/:id          - READ record por ID
PUT    /api/devtools/:table/:id          - UPDATE record
DELETE /api/devtools/:table/:id          - DELETE record
```

## 📦 Archivos a Crear

### 1. Router Principal
**Archivo**: `src/routes/devTools.routes.ts`

```typescript
import express from 'express';
import {
  listTables,
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord
} from '../controllers/devTools.controller';
import { validateTableExists, validateRecordData } from '../middlewares/devTools.validation';

const router = express.Router();

// Listar tablas
router.get('/tables', listTables);

// CRUD por tabla
router.post('/:table', validateTableExists, validateRecordData, createRecord);
router.get('/:table', validateTableExists, getRecords);
router.get('/:table/:id', validateTableExists, getRecordById);
router.put('/:table/:id', validateTableExists, validateRecordData, updateRecord);
router.delete('/:table/:id', validateTableExists, deleteRecord);

export default router;
```

### 2. Controllers
**Archivo**: `src/controllers/devTools.controller.ts`

```typescript
import { Request, Response } from 'express';
import * as crudServices from '../services/devTools/databaseCrud';

export async function createRecord(req: Request, res: Response) {
  try {
    const { table } = req.params;
    const data = req.body;
    
    const result = await crudServices.createRecord(table, data);
    
    if (result.success) {
      return res.status(201).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}

export async function getRecords(req: Request, res: Response) {
  try {
    const { table } = req.params;
    const filters = req.query;
    
    const result = await crudServices.readRecords(
      table,
      Object.keys(filters).length > 0 ? filters as any : undefined
    );
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}

// ... más controllers
```

### 3. Validación Middleware
**Archivo**: `src/middlewares/devTools.validation.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { tableExists } from '../services/devTools/databaseCrud/schema-discovery.service';

export function validateTableExists(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { table } = req.params;
  
  if (!tableExists(table)) {
    return res.status(404).json({
      success: false,
      error: `Tabla no encontrada: ${table}`
    });
  }
  
  next();
}

export function validateRecordData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'El body debe contener datos'
    });
  }
  
  next();
}
```

### 4. Tipos Compartidos
**Archivo**: `src/types/devTools.types.ts`

```typescript
/**
 * Respuesta estándar de API DevTools
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    recordsAffected?: number;
    timestamp?: Date;
  };
}

/**
 * Esquema de tabla
 */
export interface TableSchema {
  name: string;
  columns: Record<string, ColumnSchema>;
}

/**
 * Definición de columna
 */
export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
}
```

### 5. Integración en server.ts

```typescript
import devToolsRoutes from './routes/devTools.routes';

// ...
app.use('/api/devtools', devToolsRoutes);
```

## 🧪 Tests para Endpoints

**Archivo**: `src/routes/__tests__/devTools.routes.test.ts`

```typescript
describe('DevTools Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/devtools/:table', () => {
    it('debería crear un registro correctamente', async () => {
      const response = await request(app)
        .post('/api/devtools/users')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          passwordHash: 'hash',
          type: 'client'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ... más tests
});
```

## ✅ Checklist de Implementación

### Endpoint Creation
- [ ] GET /api/devtools/tables
  - [ ] Listar todas las tablas
  - [ ] Retornar schemas
  - [ ] Tests

- [ ] POST /api/devtools/:table
  - [ ] Crear registro
  - [ ] Validar datos
  - [ ] Manejar errores
  - [ ] Tests

- [ ] GET /api/devtools/:table
  - [ ] Listar registros
  - [ ] Aplicar filtros
  - [ ] Paginación (opcional)
  - [ ] Tests

- [ ] GET /api/devtools/:table/:id
  - [ ] Obtener por ID
  - [ ] Manejar no encontrado
  - [ ] Tests

- [ ] PUT /api/devtools/:table/:id
  - [ ] Actualizar registro
  - [ ] Validar cambios
  - [ ] Manejar errores
  - [ ] Tests

- [ ] DELETE /api/devtools/:table/:id
  - [ ] Eliminar registro
  - [ ] Confirmación
  - [ ] Tests

### Middleware y Validación
- [ ] validateTableExists
- [ ] validateRecordData
- [ ] validateRecordId
- [ ] Manejo global de errores
- [ ] CORS headers

### Documentación
- [ ] JSDoc comments
- [ ] API documentation
- [ ] Swagger/OpenAPI (opcional)
- [ ] Ejemplos de uso

### Testing
- [ ] Tests unitarios (controllers)
- [ ] Tests de integración (endpoints)
- [ ] Tests de validación
- [ ] Tests de error handling

## 📊 HTTP Status Codes

```
201 Created      - POST exitoso
200 OK           - GET, PUT exitoso
204 No Content   - DELETE exitoso
400 Bad Request  - Datos inválidos
404 Not Found    - Recurso no existe
500 Server Error - Error interno
```

## 🔒 Consideraciones de Seguridad

1. **Validación de entrada**: Todos los datos del body
2. **Validación de tabla**: Solo tablas permitidas
3. **SQL Injection**: Protegido por Drizzle ORM
4. **CORS**: Configurar headers apropiados
5. **Autenticación**: Preparar para middleware de auth

## 📝 Ejemplo de Request/Response

### CREATE
```http
POST /api/devtools/users
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "passwordHash": "hash...",
  "type": "admin"
}

HTTP/1.1 201 Created
{
  "success": true,
  "data": {
    "id": 4,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "passwordHash": "hash...",
    "type": "admin",
    "isActive": true,
    "state": "pending",
    "createdAt": "2024-01-13T...",
    "updatedAt": "2024-01-13T..."
  },
  "metadata": {
    "recordsAffected": 1,
    "timestamp": "2024-01-13T..."
  }
}
```

### READ (listado)
```http
GET /api/devtools/users?type=admin&isActive=true
Accept: application/json

HTTP/1.1 200 OK
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "metadata": {
    "recordsAffected": 2,
    "timestamp": "2024-01-13T..."
  }
}
```

### Error
```http
POST /api/devtools/invalid_table
Content-Type: application/json

{ "test": "data" }

HTTP/1.1 404 Not Found
{
  "success": false,
  "error": "Tabla no encontrada: invalid_table"
}
```

## 🎯 Estimación de Tiempo

- Router y Controllers: 2-3 horas
- Middleware y Validación: 1-2 horas
- Tests de endpoints: 2-3 horas
- Documentación: 1 hora

**Total**: ~6-8 horas

## 🚀 Próximos Pasos Después de Fase 2

1. Crear cliente HTTP en React
2. Establecer tipos TypeScript compartidos
3. Implementar manejo de estados (loading, error, data)
4. Crear interfaz DevTools en el cliente
