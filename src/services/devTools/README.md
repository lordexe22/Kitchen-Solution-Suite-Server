# DevTools Services

> Categoría de servicios diseñados para facilitar el desarrollo y manipulación de datos durante el proceso de desarrollo.

---

## Servicios Disponibles

### 📦 [Database CRUD Service](./databaseCrud/)

Servicio agnóstico para operaciones CRUD sobre cualquier tabla de la base de datos.

**Características:**
- CRUD completo (CREATE, READ, UPDATE, DELETE)
- Batch operations
- Descubrimiento automático de schema
- Generación de datos aleatorios para testing
- Type-safe con TypeScript

**Quick Start:**
```typescript
import { 
  createRecord, 
  readRecords, 
  updateRecord, 
  deleteRecord 
} from '@/services/devTools/databaseCrud';

// Crear usuario
await createRecord('users', { firstName: 'Juan', ... });

// Buscar usuarios
const admins = await readRecords('users', { type: 'admin' });

// Actualizar
await updateRecord('users', 5, { isActive: true });

// Eliminar
await deleteRecord('users', 5);
```

**[Ver documentación completa →](./databaseCrud/README.md)**

---

## Estructura

```
devTools/
├── README.md (este archivo)
│
└── databaseCrud/          ← Servicio individual
    ├── README.md          ← Documentación del servicio
    ├── index.ts           ← Exports del servicio
    ├── *.types.ts         ← Tipos
    └── *.service.ts       ← Lógica del servicio
```

---

## Agregar Nuevo Servicio

Cuando necesites crear un nuevo servicio DevTools:

1. **Crear carpeta** dentro de `devTools/`:
   ```
   devTools/
   └── nuevoServicio/
   ```

2. **Estructura mínima**:
   ```
   nuevoServicio/
   ├── README.md          (documentación completa)
   ├── index.ts           (exports públicos)
   ├── types.ts           (interfaces y tipos)
   └── servicio.ts        (implementación)
   ```

3. **Documentar** en este README:
   - Agregar sección en "Servicios Disponibles"
   - Características principales
   - Quick start example
   - Link a README completo

---

## Filosofía

Los servicios DevTools:
- ✅ Son para **desarrollo**, no producción (sin auth/validation)
- ✅ Son **agnósticos** (no conocen lógica de negocio)
- ✅ Son **modulares** (cada servicio es independiente)
- ✅ Son **type-safe** (TypeScript completo)
- ✅ Están **bien documentados** (README completo por servicio)

---

## Uso en Producción

⚠️ **Advertencia:** Estos servicios están diseñados como herramientas de desarrollo. Para usar en producción:

- Implementar autenticación/autorización
- Agregar validación de tipos
- Implementar rate limiting
- Agregar auditoría de cambios
- Separar por dominios de negocio

---

## Próximos Servicios (Ideas)

- **API Testing Service**: Helper para testear endpoints
- **Data Seeding Service**: Seed completo de base de datos
- **Schema Migration Helper**: Facilitar migraciones
- **Performance Profiler**: Analizar queries lentas
- **Mock Data Generator**: Generar datos realistas masivos

---

**Mantenedor:** [Tu nombre/equipo]  
**Última actualización:** Enero 2026
