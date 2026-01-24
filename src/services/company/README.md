# Servicios de Gestión de Compañías

Este módulo contiene todos los servicios relacionados con la gestión de compañías en el sistema. Implementa un patrón de arquitectura limpia con tipos centralizados y servicios especializados.

## 📋 Estructura del Módulo

```
company/
├── types.ts                      # Tipos e interfaces centralizadas
├── constants.ts                  # Constantes y funciones auxiliares
├── index.ts                      # Punto de entrada del módulo
├── checkNameAvailability/        # Verificar disponibilidad de nombre
├── createCompany/                # Crear nueva compañía
├── getAllCompanies/              # Obtener todas las compañías (paginado)
├── getCompany/                   # Obtener una compañía específica
├── updateCompany/                # Modificar compañía existente
├── archiveCompany/               # Archivar compañía
├── reactivateCompany/            # Reactivar compañía archivada
├── deleteCompany/                # Eliminar compañía (hard delete)
└── checkCompanyPermission/       # Verificar permisos de usuario
```

## 🎯 Características Principales

### Estados de Compañía
- **active**: Compañía operativa y accesible
- **archived**: Compañía archivada (no eliminada)

### Validaciones
- Nombres únicos (case-insensitive, space-tolerant)
- Longitudes máximas (nombre: 255, descripción: 1000)
- Permisos de propietario en todas las operaciones

### Paginación
- Límite máximo: 100 registros por página
- Límite por defecto: 10 registros
- Filtrado por estado (active/archived)

## 🔧 Tipos Principales

```typescript
interface Company {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  logoUrl: string | null;
  state: 'active' | 'archived';
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCompanyInput {
  name: string;
  description?: string;
  logoUrl?: string;
}

interface UpdateCompanyInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}
```

## 📦 Servicios Disponibles

### 1. checkNameAvailability
Verifica si un nombre de compañía está disponible.
- Normaliza el nombre (lowercase, trim, espacios múltiples)
- Considera compañías archivadas como ocupadas

### 2. createCompanyService
Crea una nueva compañía.
- Valida disponibilidad de nombre
- Asigna al usuario como propietario
- Estado inicial: 'active'

### 3. getAllCompaniesService
Obtiene todas las compañías de un usuario.
- Paginación configurable
- Filtrado por estado (active/archived)
- Ordenado por fecha de creación

### 4. getCompanyService
Obtiene una compañía específica.
- Verifica permisos de propietario
- Retorna todos los detalles

### 5. updateCompanyService
Modifica una compañía existente.
- Verifica permisos de propietario
- Valida disponibilidad de nombre si cambia
- Actualiza solo campos proporcionados

### 6. archiveCompanyService
Archiva una compañía activa.
- Cambia estado a 'archived'
- Establece timestamp archivedAt
- Mantiene datos intactos

### 7. reactivateCompanyService
Reactiva una compañía archivada.
- Cambia estado a 'active'
- Limpia timestamp archivedAt

### 8. deleteCompanyService
Elimina físicamente una compañía.
- Verificación de permisos
- Eliminación permanente de la BD
- **Precaución**: No hay recuperación

### 9. checkCompanyPermissionService
Verifica permisos de usuario sobre una compañía.
- Retorna si tiene permiso y razón si no
- Útil para validaciones previas

## 🚀 Uso

```typescript
import {
  createCompanyService,
  getAllCompaniesService,
  updateCompanyService,
  // ... otros servicios
} from '@/services/company';

// Crear compañía
const newCompany = await createCompanyService({
  name: 'Mi Empresa',
  description: 'Descripción de mi empresa',
  logoUrl: 'https://example.com/logo.png'
}, userId);

// Obtener todas las compañías con paginación
const result = await getAllCompaniesService(userId, {
  page: 1,
  limit: 20,
  state: 'active'
});

// Actualizar compañía
const updated = await updateCompanyService(companyId, userId, {
  description: 'Nueva descripción'
});
```

## 🧪 Testing

Cada servicio incluye un archivo `.test.ts` con cobertura completa:
- Happy path (casos exitosos)
- Validaciones de entrada
- Manejo de errores
- Edge cases (límites, valores nulos, etc.)
- Verificación de permisos

Para ejecutar los tests:
```bash
npm test -- company
```

## 📚 Convenciones

### Normalización de Nombres
Los nombres se normalizan automáticamente:
- Convertidos a minúsculas
- Espacios al inicio/final eliminados
- Espacios múltiples reducidos a uno

Ejemplo: `"  Mi  Empresa  "` → `"mi empresa"`

### Manejo de Errores
Todos los servicios lanzan errores descriptivos:
- `'Company not found'` - Compañía no existe
- `'Access denied'` - Usuario no tiene permisos
- `'Company name "X" is already taken'` - Nombre duplicado
- `'Invalid company ID'` - ID inválido
- Etc.

### Timestamps
- `createdAt`: Fecha de creación (automático)
- `updatedAt`: Fecha de última modificación (actualizado en cada cambio)
- `archivedAt`: Fecha de archivo (null si activa)

## 🔐 Seguridad

- Todas las operaciones validan que el usuario sea el propietario
- No se permite acceso a compañías de otros usuarios
- Validación de tipos en todos los inputs
- Sanitización de nombres para evitar duplicados

## 🎨 Patrones de Diseño

### Separación de Responsabilidades
- **types.ts**: Define contratos de datos
- **constants.ts**: Centraliza valores y funciones auxiliares
- **Servicios**: Lógica de negocio pura
- **Tests**: Validación aislada con mocks

### Single Responsibility
Cada servicio hace una sola cosa y la hace bien.

### Fail Fast
Validaciones al inicio de cada función para detectar errores temprano.

## 🔄 Próximos Pasos

1. **Endpoints REST**: Crear controladores y rutas
2. **Middlewares**: Autenticación y autorización
3. **Validación avanzada**: Schemas con Zod o Joi
4. **Relaciones**: Branches, employees, etc.
5. **Auditoría**: Log de cambios críticos
