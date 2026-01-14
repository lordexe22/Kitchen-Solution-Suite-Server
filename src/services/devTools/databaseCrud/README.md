# Database CRUD Service - Documentación Completa

> Servicio agnóstico para operaciones CRUD sobre cualquier tabla de la base de datos. Diseñado como herramienta de desarrollo para facilitar la manipulación directa de datos.

---

## 📋 Tabla de Contenidos

1. [Inicio Rápido](#inicio-rápido)
2. [Arquitectura](#arquitectura)
3. [API Reference](#api-reference)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Agregar Nuevas Tablas](#agregar-nuevas-tablas)
6. [Extensión y Escalado](#extensión-y-escalado)
7. [Roadmap](#roadmap)

---

## Inicio Rápido

### Instalación

El servicio ya está instalado. Solo importa lo que necesitas:

```typescript
import {
  // Schema discovery
  getAvailableTables,
  getTableSchema,
  
  // CRUD Operations
  createRecord,
  readRecords,
  readRecordById,
  updateRecord,
  deleteRecord,
  
  // Batch operations
  createRecordBatch,
  updateRecordBatch,
  deleteRecordBatch,
  
  // Data generation
  generateRandomData
} from '@/services/devTools/databaseCrud';
```

### Operaciones Básicas

```typescript
// Crear un usuario
const response = await createRecord('users', {
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  passwordHash: 'hash...',
  type: 'admin'
});

// Obtener usuarios con filtros
const admins = await readRecords('users', { 
  type: 'admin',
  isActive: true 
});

// Actualizar
await updateRecord('users', 5, { isActive: true });

// Eliminar
await deleteRecord('users', 5);

// Generar datos de prueba
const testData = generateRandomData('users', 10);
await createRecordBatch('users', testData);
```

### Respuesta Estándar

Todas las operaciones retornan:

```typescript
interface DevToolsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    recordsAffected?: number;
    timestamp?: Date;
    executedQuery?: string;
  };
}
```

---

## Arquitectura

### Estructura de Archivos

```
databaseCrud/
├── README.md (este archivo)
├── index.ts (punto de entrada)
├── devTools.types.ts (interfaces y tipos)
│
├── Schema Discovery
│   └── schema-discovery.service.ts
│
└── CRUD Services
    ├── create.service.ts
    ├── read.service.ts
    ├── update.service.ts
    ├── delete.service.ts
    └── data-generator.service.ts
```

### Principios de Diseño

#### 1. Agnóstico
El servicio NO conoce la estructura de las tablas. Funciona igual para cualquier tabla definida en el schema de Drizzle.

```typescript
// Mismo código para diferentes tablas
await createRecord('users', userData);
await createRecord('companies', companyData);
await createRecord('products', productData);
```

#### 2. Modular
Cada servicio tiene una única responsabilidad:

- **create.service.ts**: Solo insertar
- **read.service.ts**: Solo obtener
- **update.service.ts**: Solo actualizar
- **delete.service.ts**: Solo eliminar
- **data-generator.service.ts**: Solo generar datos

No se importan entre sí (bajo acoplamiento).

#### 3. Descubrimiento Automático
El servicio inspecciona el schema de Drizzle en runtime:

```typescript
const tables = getAvailableTables();
// ['users', 'apiPlatforms']

const schema = getTableSchema('users');
// { tableName: 'users', fields: [...], primaryKeys: ['id'] }
```

#### 4. Type-Safe
TypeScript completo con tipos correctos:

```typescript
const response: DevToolsResponse<User> = await createRecord('users', data);
```

### Mapa de Dependencias

```
index.ts (centraliza exports)
    │
    ├─ devTools.types.ts (tipos compartidos)
    │
    ├─ schema-discovery.service.ts
    │   └─ TABLE_REGISTRY (mapeo de tablas)
    │
    └─ CRUD Services
        ├─ create.service.ts    ─┐
        ├─ read.service.ts      ─┤
        ├─ update.service.ts    ─├─ Solo importan: schema-discovery + types
        ├─ delete.service.ts    ─┤
        └─ data-generator.service.ts ─┘
```

**Nota:** Los servicios CRUD no se importan entre sí. Esto permite:
- Testing independiente
- Extensión sin breaking changes
- Reemplazo de servicios sin afectar otros

---

## API Reference

### Schema Discovery

#### `getAvailableTables(): string[]`
Retorna array con nombres de todas las tablas disponibles.

```typescript
const tables = getAvailableTables();
// ['users', 'apiPlatforms']
```

#### `tableExists(tableName: string): boolean`
Valida si una tabla existe en el schema.

```typescript
if (tableExists('users')) {
  // proceder
}
```

#### `getTableSchema(tableName: string): TableSchema`
Extrae la estructura completa de una tabla.

```typescript
const schema = getTableSchema('users');
// {
//   tableName: 'users',
//   fields: [
//     { name: 'id', type: 'number', isPrimaryKey: true, ... },
//     { name: 'email', type: 'string', isUnique: true, ... }
//   ],
//   primaryKeys: ['id']
// }
```

**Throws:** Error si la tabla no existe.

#### `getTableMetadata(tableName: string): object`
Metadatos rápidos de una tabla.

```typescript
const meta = getTableMetadata('users');
// {
//   tableName: 'users',
//   fieldCount: 11,
//   fieldNames: ['id', 'firstName', 'lastName', ...],
//   primaryKeys: ['id'],
//   requiredFields: ['firstName', 'lastName', 'email', ...],
//   uniqueFields: ['email']
// }
```

---

### Create Operations

#### `createRecord(tableName: string, data: Record<string, any>): Promise<DevToolsResponse>`
Inserta un registro en la tabla especificada.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `data`: Objeto con los datos a insertar

**Retorna:** `DevToolsResponse` con el registro creado en `data`.

**Ejemplo:**
```typescript
const response = await createRecord('users', {
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  passwordHash: 'bcrypt_hash',
  type: 'admin',
  state: 'active',
  isActive: true
});

if (response.success) {
  console.log('Usuario creado:', response.data);
  // response.metadata.recordsAffected === 1
}
```

#### `createRecordBatch(tableName: string, dataArray: Record<string, any>[]): Promise<DevToolsResponse>`
Inserta múltiples registros en una sola operación.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `dataArray`: Array de objetos con datos

**Retorna:** `DevToolsResponse` con array de registros creados.

**Ejemplo:**
```typescript
const response = await createRecordBatch('users', [
  { firstName: 'Juan', lastName: 'Pérez', email: 'juan@example.com', ... },
  { firstName: 'María', lastName: 'García', email: 'maria@example.com', ... },
  { firstName: 'Carlos', lastName: 'López', email: 'carlos@example.com', ... }
]);

// response.data = array con 3 usuarios
// response.metadata.recordsAffected === 3
```

---

### Read Operations

#### `readRecords(tableName: string, filters?: FilterConditions): Promise<DevToolsResponse>`
Obtiene registros con filtros opcionales.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `filters` (opcional): Objeto con condiciones de filtro

**Filtros soportados (Fase 1):**
- Igualdad simple: `{ field: value }`
- Múltiples condiciones (AND): `{ field1: value1, field2: value2 }`

**Retorna:** `DevToolsResponse` con array de registros.

**Ejemplos:**
```typescript
// Obtener todos
const all = await readRecords('users');

// Con filtros
const admins = await readRecords('users', { 
  type: 'admin',
  isActive: true 
});

// Filtro por estado
const pending = await readRecords('users', { 
  state: 'pending' 
});

// response.data = array de usuarios
```

#### `readRecordById(tableName: string, id: number | string): Promise<DevToolsResponse>`
Obtiene un registro específico por su ID.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `id`: Identificador del registro

**Retorna:** `DevToolsResponse` con el registro o `null` si no existe.

**Ejemplo:**
```typescript
const response = await readRecordById('users', 5);

if (response.success && response.data) {
  console.log('Usuario encontrado:', response.data);
} else {
  console.log('Usuario no existe');
}
```

---

### Update Operations

#### `updateRecord(tableName: string, id: number | string, data: Record<string, any>): Promise<DevToolsResponse>`
Actualiza un registro específico.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `id`: ID del registro a actualizar
- `data`: Objeto con campos a actualizar

**Notas:**
- Solo actualiza los campos especificados en `data`
- `updatedAt` se actualiza automáticamente si existe en el schema
- No es necesario pasar todos los campos

**Retorna:** `DevToolsResponse` con el registro actualizado.

**Ejemplo:**
```typescript
// Actualizar solo algunos campos
const response = await updateRecord('users', 5, {
  isActive: true,
  state: 'active'
});

// updatedAt se actualiza automáticamente
// firstName, lastName, email, etc. permanecen igual
```

#### `updateRecordBatch(tableName: string, updates: Array<{id, ...fields}>): Promise<DevToolsResponse>`
Actualiza múltiples registros.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `updates`: Array de objetos. Cada objeto debe tener `id` + campos a actualizar

**Retorna:** `DevToolsResponse` con array de registros actualizados.

**Ejemplo:**
```typescript
const response = await updateRecordBatch('users', [
  { id: 1, isActive: true },
  { id: 2, state: 'suspended' },
  { id: 3, isActive: false, state: 'pending' }
]);

// response.data = array con usuarios actualizados
// response.metadata.recordsAffected = cantidad actualizada
```

---

### Delete Operations

#### `deleteRecord(tableName: string, id: number | string): Promise<DevToolsResponse>`
Elimina un registro específico.

**⚠️ Advertencia:** Esta es una eliminación FÍSICA (hard delete). El registro se elimina permanentemente de la base de datos.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `id`: ID del registro a eliminar

**Retorna:** `DevToolsResponse` con confirmación y el registro eliminado.

**Ejemplo:**
```typescript
const response = await deleteRecord('users', 5);

if (response.success) {
  console.log(response.data.message);
  // "Registro 5 eliminado exitosamente"
  console.log('Registro eliminado:', response.data.deletedRecord);
}
```

#### `deleteRecordBatch(tableName: string, ids: (number | string)[]): Promise<DevToolsResponse>`
Elimina múltiples registros.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `ids`: Array de IDs a eliminar

**Retorna:** `DevToolsResponse` con array de registros eliminados.

**Ejemplo:**
```typescript
const response = await deleteRecordBatch('users', [1, 2, 3, 5, 7]);

// response.data.message = "5 registros eliminados exitosamente"
// response.data.deletedRecords = array con los registros eliminados
```

**Nota:** Si un ID falla, continúa con los demás (resiliente).

---

### Data Generation

#### `generateRandomData(tableName: string, count?: number, options?: DataGeneratorOptions): Record<string, any>[]`
Genera datos aleatorios plausibles para una tabla.

**Parámetros:**
- `tableName`: Nombre de la tabla
- `count` (opcional, default: 1): Cantidad de registros a generar
- `options` (opcional): Opciones de generación

**Options:**
```typescript
interface DataGeneratorOptions {
  customGenerator?: (index: number) => Record<string, any>;
  useRandomData?: boolean;
}
```

**Retorna:** Array de objetos con datos generados.

**Características:**
- No genera campos PK (auto-incrementales)
- No genera campos con `default` (excepto timestamps)
- Genera valores contextuales según nombre de campo:
  - `firstName` → Nombres reales
  - `email` → Emails válidos
  - `passwordHash` → Hashes simulados
  - `url`, `imageUrl` → URLs plausibles

**Ejemplos:**

**Básico:**
```typescript
const testUsers = generateRandomData('users', 5);
// Genera 5 usuarios con datos aleatorios plausibles
```

**Con custom generator:**
```typescript
const customUsers = generateRandomData('users', 3, {
  customGenerator: (index) => ({
    firstName: `TestUser${index}`,
    lastName: 'Test',
    email: `test${index}@example.com`,
    passwordHash: 'fixed_hash',
    type: index % 2 === 0 ? 'admin' : 'employee',
    isActive: true,
    state: 'active'
  })
});
```

**Uso completo:**
```typescript
// 1. Generar datos
const testData = generateRandomData('users', 10);

// 2. Insertarlos
const response = await createRecordBatch('users', testData);

// 10 usuarios de prueba creados
```

#### `validateGeneratedData(tableName: string, data: Record<string, any>): boolean`
Valida que datos generados cumplan requisitos básicos.

**Útil para testing del generador.**

```typescript
const data = generateRandomData('users', 1)[0];
const isValid = validateGeneratedData('users', data);
// true si cumple requisitos básicos
```

---

## Ejemplos de Uso

### Caso 1: Crear Usuario de Testing

```typescript
import { createRecord } from '@/services/devTools/databaseCrud';

async function crearUsuarioDePrueba() {
  const response = await createRecord('users', {
    firstName: 'Admin',
    lastName: 'Test',
    email: 'admin.test@example.com',
    passwordHash: await bcrypt.hash('test123', 10),
    type: 'admin',
    isActive: true,
    state: 'active'
  });

  if (response.success) {
    console.log('✅ Usuario creado:', response.data.id);
    return response.data;
  } else {
    console.error('❌ Error:', response.error);
    throw new Error(response.error);
  }
}
```

### Caso 2: Llenar BD con Datos de Prueba

```typescript
import { generateRandomData, createRecordBatch } from '@/services/devTools/databaseCrud';

async function llenarBaseDeDatos() {
  // 5 admins
  const admins = generateRandomData('users', 5, {
    customGenerator: (i) => ({
      ...generateRandomData('users', 1)[0],
      type: 'admin',
      isActive: true,
      state: 'active'
    })
  });

  // 10 employees
  const employees = generateRandomData('users', 10, {
    customGenerator: (i) => ({
      ...generateRandomData('users', 1)[0],
      type: 'employee',
      branchId: Math.floor(Math.random() * 5) + 1,
      isActive: true,
      state: 'active'
    })
  });

  // 3 guests
  const guests = generateRandomData('users', 3, {
    customGenerator: (i) => ({
      ...generateRandomData('users', 1)[0],
      type: 'guest',
      isActive: false,
      state: 'pending'
    })
  });

  // Insertar todos
  await createRecordBatch('users', [...admins, ...employees, ...guests]);

  console.log('✅ 18 usuarios de prueba creados');
}
```

### Caso 3: Buscar y Actualizar en Lote

```typescript
import { readRecords, updateRecordBatch } from '@/services/devTools/databaseCrud';

async function activarUsuariosPendientes() {
  // 1. Buscar usuarios pendientes
  const response = await readRecords('users', {
    state: 'pending',
    isActive: false
  });

  if (!response.success || !response.data.length) {
    console.log('No hay usuarios pendientes');
    return;
  }

  // 2. Preparar updates
  const updates = response.data.map(user => ({
    id: user.id,
    isActive: true,
    state: 'active'
  }));

  // 3. Actualizar en lote
  const updateResponse = await updateRecordBatch('users', updates);

  console.log(`✅ ${updateResponse.metadata?.recordsAffected} usuarios activados`);
}
```

### Caso 4: Cleanup de Datos de Testing

```typescript
import { readRecords, deleteRecordBatch } from '@/services/devTools/databaseCrud';

async function limpiarDatosDePrueba() {
  // Buscar usuarios de testing (emails con @example.com)
  const allUsers = await readRecords('users');
  
  const testUserIds = allUsers.data
    .filter(user => user.email.includes('@example.com'))
    .map(user => user.id);

  if (testUserIds.length === 0) {
    console.log('No hay datos de prueba para limpiar');
    return;
  }

  // Eliminar en lote
  const response = await deleteRecordBatch('users', testUserIds);

  console.log(`✅ ${response.data.deletedRecords.length} usuarios de prueba eliminados`);
}
```

### Caso 5: Migración de Datos Entre Tablas

```typescript
import { readRecords, createRecordBatch, updateRecord } from '@/services/devTools/databaseCrud';

async function migrarDatos() {
  // 1. Leer datos de tabla antigua
  const oldData = await readRecords('old_users');

  // 2. Transformar a formato nuevo
  const newData = oldData.data.map(old => ({
    firstName: old.name.split(' ')[0],
    lastName: old.name.split(' ')[1] || '',
    email: old.email_address,
    passwordHash: old.password,
    type: old.role === 'admin' ? 'admin' : 'guest',
    isActive: old.active === 1,
    state: old.status
  }));

  // 3. Insertar en tabla nueva
  const response = await createRecordBatch('users', newData);

  console.log(`✅ ${response.metadata?.recordsAffected} registros migrados`);
}
```

---

## Agregar Nuevas Tablas

Cuando crees una nueva tabla en el schema de Drizzle, solo necesitas registrarla para que funcione automáticamente con este servicio.

### Paso 1: Definir Tabla en Drizzle

```typescript
// src/db/schema.ts

export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  ownerId: integer('owner_id').notNull().references(() => usersTable.id),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});
```

### Paso 2: Registrar en DevTools

```typescript
// src/services/devTools/databaseCrud/schema-discovery.service.ts

const TABLE_REGISTRY: Record<string, any> = {
  users: schema.usersTable,
  apiPlatforms: schema.apiPlatformsTable,
  companies: schema.companiesTable,  // ← AGREGAR AQUÍ
};
```

### Paso 3: ¡Listo!

Todas las operaciones funcionan automáticamente:

```typescript
// Crear compañía
await createRecord('companies', {
  name: 'Mi Empresa',
  description: 'Descripción...',
  ownerId: 1,
  logoUrl: 'https://...'
});

// Buscar compañías
const companies = await readRecords('companies', { ownerId: 1 });

// Actualizar
await updateRecord('companies', 5, { isActive: false });

// Eliminar
await deleteRecord('companies', 5);

// Generar datos de prueba
const testCompanies = generateRandomData('companies', 5);
await createRecordBatch('companies', testCompanies);
```

**Convención de Nombres:**
- Tabla en Drizzle: `{tableName}Table` (ej: `companiesTable`)
- Nombre en registry: `{tableName}` (ej: `companies`)

---

## Extensión y Escalado

El servicio está diseñado para escalado gradual sin breaking changes.

### Agregar Nuevas Operaciones

**Ejemplo: Agregar operación de conteo**

```typescript
// src/services/devTools/databaseCrud/count.service.ts

import { db } from '../../../db/init';
import * as schema from '../../../db/schema';
import { sql } from 'drizzle-orm';
import { tableExists } from './schema-discovery.service';
import type { DevToolsResponse } from './devTools.types';

export async function countRecords(
  tableName: string
): Promise<DevToolsResponse<number>> {
  if (!tableExists(tableName)) {
    return { success: false, error: `Tabla no encontrada: ${tableName}` };
  }

  const tableObj = (schema as any)[`${tableName}Table`];
  const result = await db.select({ count: sql<number>`count(*)` }).from(tableObj);

  return {
    success: true,
    data: result[0].count
  };
}
```

**Exportar en index.ts:**

```typescript
export { countRecords } from './count.service';
```

### Extender Sin Quebrar Existente

**Opción 1: Envolvente**

```typescript
// soft-delete-wrapper.service.ts

import { updateRecord } from './update.service';

export async function softDeleteRecord(tableName: string, id: number) {
  return updateRecord(tableName, id, {
    isActive: false,
    deletedAt: new Date()
  });
}
```

**Opción 2: Parámetros Opcionales**

```typescript
// Agregar parámetro opcional sin romper API
export async function deleteRecord(
  tableName: string,
  id: number,
  options?: { soft?: boolean }  // ← Nuevo, opcional
): Promise<DevToolsResponse> {
  if (options?.soft) {
    return updateRecord(tableName, id, {
      isActive: false,
      deletedAt: new Date()
    });
  }
  
  // Lógica original (hard delete)
  // ...
}

// Código existente sigue funcionando
await deleteRecord('users', 5);

// Nuevo código puede usar soft delete
await deleteRecord('users', 5, { soft: true });
```

### Modularización Avanzada

Cuando el servicio crezca, se puede dividir en subcarpetas:

```
databaseCrud/
├── README.md
├── index.ts
├── types/
│   ├── devTools.types.ts
│   └── filters.types.ts
├── core/
│   ├── schema-discovery.service.ts
│   └── table-validator.service.ts
├── crud/
│   ├── create.service.ts
│   ├── read.service.ts
│   ├── update.service.ts
│   └── delete.service.ts
├── utilities/
│   └── data-generator.service.ts
└── extensions/
    ├── soft-delete.service.ts
    ├── audit-logger.service.ts
    └── relationship-loader.service.ts
```

**index.ts sigue siendo el punto de entrada:**

```typescript
// Los imports internos cambian...
export { createRecord } from './crud/create.service';
export { readRecords } from './crud/read.service';
// ...

// Pero la API pública no cambia
// Código cliente sigue igual
import { createRecord } from '@/services/devTools/databaseCrud';
```

---

## Roadmap

### ✅ Fase 1 - MVP (Completado)
- CRUD básico (CREATE, READ, UPDATE, DELETE)
- Batch operations
- Descubrimiento automático de schema
- Generación de datos aleatorios
- Filtros simples (igualdad)
- Respuestas consistentes

### ⏳ Fase 2 - Validación (Próximo)
- Schema validation con Zod
- Type validation estricta
- Validación de constraints (unique, required, FK)
- Mensajes de error detallados
- Validación de tipos de datos
- Custom validators por tabla

### ⏳ Fase 3 - Filtros Avanzados
- Operadores: `>`, `<`, `>=`, `<=`, `!=`, `LIKE`, `IN`, `BETWEEN`
- Rangos de fechas
- Búsqueda por texto (contains, startsWith, endsWith)
- Ordenamiento (ORDER BY)
- Paginación (LIMIT, OFFSET)
- Agregaciones (COUNT, SUM, AVG, MAX, MIN)

### ⏳ Fase 4 - Relaciones
- Eager loading de relaciones
- Joins (INNER, LEFT, RIGHT)
- Relaciones one-to-one, one-to-many, many-to-many
- Cascade operations
- Nested queries

### ⏳ Fase 5 - Características Avanzadas
- Soft-delete support
- Auditoría de cambios (quién/cuándo/qué)
- Transacciones ACID
- Export/Import (CSV, JSON, SQL)
- Bulk operations optimizadas
- Query caching

### ⏳ Fase 6 - DevEx & Security
- Rate limiting
- Autenticación/Autorización
- Logging detallado
- UI DevTools en frontend
- GraphQL interface (opcional)
- REST API auto-generada

---

## Preguntas Frecuentes

### ¿Puedo usar esto en producción?

Este servicio está diseñado como **herramienta de desarrollo**. Para producción:
- Agregar validación de tipos
- Implementar autorización
- Agregar rate limiting
- Implementar auditoría
- Considerar separar servicios por dominio de negocio

### ¿Cómo funcionan los filtros?

En Fase 1, solo soportamos filtros de igualdad:

```typescript
// ✅ Soportado
{ type: 'admin', isActive: true }

// ❌ No soportado aún (Fase 3)
{ createdAt: { gte: '2025-01-01' } }
{ email: { contains: '@example.com' } }
```

### ¿Puedo hacer soft-delete?

En Fase 1 solo hay hard delete. Para soft-delete:

```typescript
// Workaround temporal
await updateRecord('users', 5, {
  isActive: false,
  deletedAt: new Date()
});

// Fase 5 tendrá soft-delete nativo
```

### ¿Puedo hacer joins/relaciones?

No en Fase 1. Por ahora, hacer queries separadas:

```typescript
// Obtener usuario
const user = await readRecordById('users', 5);

// Obtener su sucursal si es employee
if (user.data.branchId) {
  const branch = await readRecordById('branches', user.data.branchId);
}

// Fase 4 soportará eager loading
```

### ¿Cómo valido los datos antes de insertar?

En Fase 1 no hay validación automática. Validar manualmente:

```typescript
// Validación manual
if (!data.email.includes('@')) {
  return { success: false, error: 'Email inválido' };
}

const response = await createRecord('users', data);

// Fase 2 tendrá validación automática
```

### ¿Qué pasa si la tabla no existe?

El servicio retorna error:

```typescript
const response = await createRecord('tabla_inexistente', data);
// {
//   success: false,
//   error: "Tabla no encontrada: tabla_inexistente"
// }
```

### ¿Puedo usar transacciones?

No en Fase 1. Por ahora, operaciones son independientes:

```typescript
// No hay rollback automático
await createRecord('users', userData);
await createRecord('permissions', permData); // Si falla, el user ya está creado

// Fase 5 soportará transacciones
```

---

## Mantenimiento

### Agregar Tabla Nueva
1. Definir en `src/db/schema.ts`
2. Registrar en `schema-discovery.service.ts` → `TABLE_REGISTRY`
3. Listo

### Testear Servicio
```typescript
// test/services/devTools/databaseCrud/create.service.test.ts

import { createRecord } from '@/services/devTools/databaseCrud';

describe('createRecord', () => {
  it('should create a record', async () => {
    const response = await createRecord('users', mockUserData);
    
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('id');
    expect(response.metadata?.recordsAffected).toBe(1);
  });
});
```

### Debugging
Todas las respuestas incluyen metadata:

```typescript
const response = await createRecord('users', data);

console.log(response.metadata);
// {
//   recordsAffected: 1,
//   timestamp: Date,
//   executedQuery: "INSERT INTO users ..." // Solo en dev
// }
```

---

## Contribuir

Al agregar nuevas operaciones:

1. **Crear archivo service**: `{operacion}.service.ts`
2. **Seguir patrón existente**: Importar schema-discovery, retornar `DevToolsResponse`
3. **Agregar a index.ts**: Exportar la función
4. **Documentar aquí**: Agregar sección en API Reference
5. **Testear**: Crear archivo de test correspondiente

**Ejemplo:**

```typescript
// nueva-operacion.service.ts
import { tableExists } from './schema-discovery.service';
import type { DevToolsResponse } from './devTools.types';

export async function nuevaOperacion(
  tableName: string
): Promise<DevToolsResponse> {
  if (!tableExists(tableName)) {
    return { success: false, error: `Tabla no encontrada: ${tableName}` };
  }
  
  // Lógica...
  
  return {
    success: true,
    data: resultado
  };
}
```

---

## Licencia y Créditos

**Proyecto:** Kitchen Solutions Suite - DevTools  
**Servicio:** Database CRUD Service  
**Versión:** 1.0.0 (Fase 1 MVP)  
**Fecha:** Enero 2026  

**Autor:** Equipo Kitchen Solutions Suite  
**Mantenedor:** [Tu nombre/equipo]

---

## Conclusión

Este servicio proporciona una base sólida para manipular datos de cualquier tabla de forma agnóstica y type-safe. Su diseño modular permite escalado gradual sin romper código existente.

**Next steps:**
1. Usar el servicio para crear datos de testing
2. Crear rutas HTTP para exponer como API
3. Implementar Fase 2 (validación)

Para más información sobre el proyecto completo, ver documentación del proyecto principal.
