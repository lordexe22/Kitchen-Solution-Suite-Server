# Servicio: updateCompany

Actualiza los datos de una compañía existente.

## 📖 Descripción

Este servicio permite modificar los campos editables de una compañía (nombre, descripción, logo), validando permisos y disponibilidad de nombres.

## 🎯 Propósito

- Actualizar información de compañías
- Validar cambios de nombre (unicidad)
- Mantener integridad de datos
- Actualizar timestamps automáticamente

## 📝 Firma

```typescript
async function updateCompanyService(
  companyId: number,
  userId: number,
  input: UpdateCompanyInput
): Promise<Company>
```

### Parámetros
- `companyId` (number): ID de la compañía a actualizar
- `userId` (number): ID del usuario (debe ser propietario)
- `input` (UpdateCompanyInput): Campos a actualizar
  - `name` (string, opcional): Nuevo nombre
  - `description` (string | null, opcional): Nueva descripción
  - `logoUrl` (string | null, opcional): Nueva URL del logo

### Retorno
- `Company`: La compañía actualizada con todos sus campos

## 🔍 Comportamiento

### Flujo de Actualización
1. Valida parámetros de entrada
2. Obtiene compañía existente
3. Verifica permisos del usuario
4. Si el nombre cambia, verifica disponibilidad
5. Actualiza solo campos proporcionados
6. Actualiza timestamp `updatedAt`
7. Retorna compañía actualizada

### Actualización Inteligente
- Solo actualiza campos que se proporcionan
- Si no hay cambios, retorna compañía sin actualizar BD
- Normaliza nombre si se proporciona nuevo
- No actualiza `updatedAt` si no hay cambios reales

### Validación de Nombre
- Si el nuevo nombre es igual al actual (normalizado), no hace validación
- Si cambia, verifica que esté disponible

## ✅ Casos de Uso

```typescript
// Actualizar solo descripción
const updated = await updateCompanyService(1, userId, {
  description: 'Updated description'
});

// Actualizar solo logo
const updated = await updateCompanyService(1, userId, {
  logoUrl: 'https://example.com/new-logo.png'
});

// Actualizar nombre (valida disponibilidad)
const updated = await updateCompanyService(1, userId, {
  name: 'New Company Name'
});

// Actualizar múltiples campos
const updated = await updateCompanyService(1, userId, {
  name: 'New Name',
  description: 'New description',
  logoUrl: 'https://example.com/logo.png'
});

// Sin cambios (retorna sin actualizar)
const same = await updateCompanyService(1, userId, {});
// No se ejecuta UPDATE en BD
```

## ⚠️ Validaciones

### Company ID & User ID
- ✅ Deben ser números finitos
- ✅ Deben ser mayores que 0

### Nombre (si se proporciona)
- ✅ Debe ser string
- ✅ No puede estar vacío (solo espacios)
- ✅ Máximo 255 caracteres
- ✅ Debe estar disponible si cambia

### Descripción (si se proporciona)
- ✅ Debe ser string o null
- ✅ Máximo 1000 caracteres si no es null

### LogoUrl (si se proporciona)
- ✅ Debe ser string o null

## ⚠️ Errores Posibles

```typescript
// Compañía no existe
'Company not found'

// Usuario no es propietario
'Access denied'

// Nombre duplicado
'Company name "X" is already taken'

// Validaciones
'Invalid company ID'
'Invalid user ID'
'Company name cannot be empty'
'Company name must be 255 characters or less'
'Company description must be 1000 characters or less'

// BD
'Failed to update company'
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Actualizar solo descripción
- ✅ Actualizar solo logoUrl
- ✅ Actualizar nombre si está disponible
- ✅ No actualizar si mismo nombre normalizado
- ✅ Retornar sin cambios si input vacío
- ✅ Validación de company ID inválido
- ✅ Validación de user ID inválido
- ✅ Validación de nombre vacío
- ✅ Validación de longitudes máximas
- ✅ Error si usuario no es propietario
- ✅ Error si nombre duplicado
- ✅ Error si compañía no encontrada
- ✅ Error si update falla en BD

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `checkNameAvailability` (Servicio)
- `normalizeCompanyName` (Utilidad)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { updateCompanyService } from '@/services/company';

// Endpoint REST
app.patch('/api/companies/:id', authenticateUser, async (req, res) => {
  try {
    const company = await updateCompanyService(
      Number(req.params.id),
      req.user.id,
      req.body
    );
    
    res.json({
      success: true,
      data: company,
      message: 'Company updated successfully'
    });
  } catch (error) {
    const status = error.message === 'Access denied' ? 403 : 400;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

// Uso en frontend
const handleUpdate = async (updates: UpdateCompanyInput) => {
  try {
    const updated = await api.updateCompany(companyId, updates);
    showSuccess('Company updated');
    setCompany(updated);
  } catch (error) {
    showError(error.message);
  }
};
```

## 📊 Rendimiento

- **Operaciones de BD**: 2-3 (select + opcional checkName + update)
- **Optimización**: Skip update si no hay cambios
- **Índices necesarios**: `id` (primary), `name` (unique)

## 🔐 Seguridad

- Solo el propietario puede actualizar
- Validación de todos los inputs
- Previene race conditions en nombre duplicado

## 🚧 Mejoras Futuras

- [ ] Historial de cambios (audit log)
- [ ] Validación de URLs (logoUrl)
- [ ] Limits de actualizaciones por tiempo
- [ ] Notificaciones de cambios importantes
- [ ] Validación de contenido de descripción
