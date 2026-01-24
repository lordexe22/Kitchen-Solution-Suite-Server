# Servicio: getAllCompanies

Obtiene todas las compañías de un usuario con paginación y filtrado por estado.

## 📖 Descripción

Este servicio recupera la lista de compañías asociadas a un usuario específico, con soporte para paginación, filtrado por estado, y metadatos útiles para interfaces de usuario.

## 🎯 Propósito

- Listar compañías de un usuario
- Paginación eficiente para grandes volúmenes
- Filtrado por estado (active/archived)
- Metadatos para controles de navegación

## 📝 Firma

```typescript
async function getAllCompaniesService(
  userId: number,
  options?: GetAllCompaniesOptions
): Promise<PaginatedCompaniesResult>
```

### Parámetros
- `userId` (number): ID del usuario propietario
- `options` (opcional): Configuración de paginación y filtros
  - `state` (CompanyState | null): Filtrar por estado
  - `page` (number): Número de página (default: 1)
  - `limit` (number): Registros por página (default: 10, max: 100)

### Retorno
```typescript
{
  companies: Company[],      // Lista de compañías
  total: number,             // Total de registros
  page: number,              // Página actual
  limit: number,             // Registros por página
  totalPages: number         // Total de páginas
}
```

## 🔍 Comportamiento

### Paginación
- **Página por defecto**: 1
- **Límite por defecto**: 10 registros
- **Límite máximo**: 100 registros
- **Offset calculado**: `(page - 1) * limit`

### Ordenamiento
- Ordenado por `createdAt` ascendente
- Las compañías más antiguas aparecen primero

### Filtrado
- Sin filtro: Retorna todas (active + archived)
- `state: 'active'`: Solo activas
- `state: 'archived'`: Solo archivadas

## ✅ Casos de Uso

```typescript
// Obtener primera página con configuración por defecto
const result = await getAllCompaniesService(userId);
// { companies: [...], total: 25, page: 1, limit: 10, totalPages: 3 }

// Obtener solo compañías activas
const active = await getAllCompaniesService(userId, { 
  state: 'active' 
});

// Paginación personalizada
const page2 = await getAllCompaniesService(userId, {
  page: 2,
  limit: 20
});

// Obtener todas sin límite
const all = await getAllCompaniesService(userId, {
  limit: 100
});
```

## ⚠️ Validaciones

### User ID
- ✅ Debe ser número finito
- ✅ Debe ser mayor que 0

### Page
- ✅ Debe ser número positivo
- ✅ Mínimo: 1

### Limit
- ✅ Debe ser número positivo
- ✅ Mínimo: 1
- ✅ Máximo: 100 (forzado automáticamente)

### State
- ✅ Solo valores válidos: 'active' | 'archived' | null

## 🧪 Testing

El servicio incluye tests para:
- ✅ Obtener todas las compañías con paginación
- ✅ Lista vacía si usuario no tiene compañías
- ✅ Filtrado por estado active
- ✅ Filtrado por estado archived
- ✅ Aplicación correcta de page y limit
- ✅ Límite máximo de 100 forzado
- ✅ Valores por defecto (page: 1, limit: 10)
- ✅ Validación de user ID inválido
- ✅ Validación de page inválido
- ✅ Validación de limit inválido
- ✅ Validación de state inválido

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq`, `and` (Drizzle operators)

## 💡 Ejemplo de Integración

```typescript
import { getAllCompaniesService } from '@/services/company';

// Endpoint REST con paginación
app.get('/api/companies', authenticateUser, async (req, res) => {
  const { page, limit, state } = req.query;
  
  const result = await getAllCompaniesService(req.user.id, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    state: state as CompanyState
  });
  
  res.json({
    success: true,
    data: result.companies,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

// Uso en frontend
const { companies, totalPages } = await getAllCompaniesService(userId, {
  page: currentPage,
  limit: 20,
  state: showArchived ? 'archived' : 'active'
});
```

## 📊 Rendimiento

- **Operaciones de BD**: 2 (count + select)
- **Optimizaciones posibles**:
  - Índice en `ownerId` (recomendado)
  - Índice compuesto `(ownerId, state)`
  - Caché de conteo total
  - Cursor-based pagination para volúmenes muy grandes

## 🎨 UI Considerations

### Controles de Paginación
```typescript
const { page, totalPages } = result;

const hasNextPage = page < totalPages;
const hasPrevPage = page > 1;
const showingFrom = (page - 1) * limit + 1;
const showingTo = Math.min(page * limit, total);
```

### Filtros
- Toggle para mostrar/ocultar archivadas
- Dropdown para selección de estado
- Badges con conteos por estado

## 🚧 Mejoras Futuras

- [ ] Búsqueda por nombre (fuzzy search)
- [ ] Ordenamiento personalizable (name, createdAt, etc.)
- [ ] Filtro por rango de fechas
- [ ] Caché de resultados
- [ ] Cursor-based pagination
- [ ] Exportación a CSV/Excel
