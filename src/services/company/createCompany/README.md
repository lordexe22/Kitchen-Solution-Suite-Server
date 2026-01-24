# Servicio: createCompany

Crea una nueva compañía en el sistema y asigna al usuario como propietario.

## 📖 Descripción

Este servicio maneja la creación completa de una nueva compañía, incluyendo validaciones de nombre, normalización de datos, y asignación de permisos.

## 🎯 Propósito

- Crear nuevas compañías con validaciones robustas
- Asignar automáticamente el propietario
- Garantizar unicidad de nombres
- Establecer estado inicial consistente

## 📝 Firma

```typescript
async function createCompanyService(
  input: CreateCompanyInput, 
  userId: number
): Promise<Company>
```

### Parámetros
- `input` (CreateCompanyInput): Datos de la nueva compañía
  - `name` (string, requerido): Nombre de la compañía
  - `description` (string, opcional): Descripción
  - `logoUrl` (string, opcional): URL del logo
- `userId` (number): ID del usuario propietario

### Retorno
- `Company`: La compañía creada con todos sus campos

## 🔍 Comportamiento

### Flujo de Creación
1. Valida el input (formato, longitudes, tipos)
2. Verifica disponibilidad del nombre
3. Normaliza el nombre (lowercase, trim, espacios)
4. Inserta en la base de datos
5. Retorna la compañía creada

### Valores por Defecto
- `state`: 'active'
- `archivedAt`: null
- `description`: null si no se proporciona
- `logoUrl`: null si no se proporciona

## ✅ Validaciones

### Nombre
- ✅ Requerido (no puede estar vacío)
- ✅ Debe ser string
- ✅ Máximo 255 caracteres
- ✅ No puede ser solo espacios
- ✅ Debe estar disponible (no duplicado)

### Descripción (opcional)
- ✅ Debe ser string si se proporciona
- ✅ Máximo 1000 caracteres

### LogoUrl (opcional)
- ✅ Debe ser string si se proporciona

## 🧪 Casos de Uso

```typescript
// Crear con todos los campos
const company = await createCompanyService({
  name: 'Tech Solutions Inc',
  description: 'A leading tech company',
  logoUrl: 'https://example.com/logo.png'
}, userId);

// Crear con campos mínimos
const company = await createCompanyService({
  name: 'Simple Company'
}, userId);

// Resultado
{
  id: 1,
  name: 'tech solutions inc', // normalizado
  description: 'A leading tech company',
  ownerId: 1,
  logoUrl: 'https://example.com/logo.png',
  state: 'active',
  archivedAt: null,
  createdAt: '2024-01-23T10:30:00Z',
  updatedAt: '2024-01-23T10:30:00Z'
}
```

## ⚠️ Errores Posibles

```typescript
// Nombre duplicado
'Company name "Tech Solutions" is already taken'

// Nombre vacío
'Company name cannot be empty'

// Nombre demasiado largo
'Company name must be 255 characters or less'

// Descripción demasiado larga
'Company description must be 1000 characters or less'

// Input inválido
'Invalid request body'
'Company name is required and must be a string'

// Error de BD
'Failed to create company'
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Creación exitosa con todos los campos
- ✅ Creación con campos mínimos
- ✅ Validación de nombre requerido
- ✅ Validación de nombre vacío
- ✅ Validación de longitud máxima (nombre y descripción)
- ✅ Validación de nombre duplicado
- ✅ Normalización de nombres
- ✅ Manejo de errores de BD

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `checkNameAvailability` (Servicio de validación)
- `normalizeCompanyName` (Utilidad)
- `COMPANY_STATES` (Constantes)

## 💡 Ejemplo de Integración

```typescript
import { createCompanyService } from '@/services/company';

// En un endpoint REST
app.post('/api/companies', authenticateUser, async (req, res) => {
  try {
    const company = await createCompanyService(
      req.body, 
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

## 📊 Rendimiento

- **Operaciones de BD**: 2 (check availability + insert)
- **Transacciones**: Considerar para atomicidad
- **Índices necesarios**: `name` (unique)

## 🔐 Seguridad

- Usuario automáticamente asignado como propietario
- No se permite crear compañías para otros usuarios
- Validación estricta de todos los inputs

## 🚧 Mejoras Futuras

- [ ] Validación de formato de URL para logoUrl
- [ ] Subida de imágenes para logos
- [ ] Templates de compañía
- [ ] Validación de nombres ofensivos
- [ ] Limitar número de compañías por usuario
