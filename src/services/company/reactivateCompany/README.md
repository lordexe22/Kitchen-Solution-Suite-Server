# Servicio: reactivateCompany

Reactiva una compañía previamente archivada, restaurándola al estado 'active'.

## 📖 Descripción

Este servicio revierte el proceso de archivo, cambiando el estado de una compañía de 'archived' a 'active' y limpiando el timestamp de archivo.

## 🎯 Propósito

- Restaurar compañías archivadas
- Reactivar operaciones normales
- Limpiar marca de archivo
- Volver a incluir en listados activos

## 📝 Firma

```typescript
async function reactivateCompanyService(
  companyId: number,
  userId: number
): Promise<Company>
```

### Parámetros
- `companyId` (number): ID de la compañía a reactivar
- `userId` (number): ID del usuario (debe ser propietario)

### Retorno
- `Company`: La compañía reactivada con estado actualizado

## 🔍 Comportamiento

### Cambios Realizados
1. `state`: 'archived' → 'active'
2. `archivedAt`: fecha → null
3. `updatedAt`: actualizado a fecha actual

### Validaciones Previas
- Compañía debe existir
- Usuario debe ser propietario
- Compañía DEBE estar archivada

### Datos Preservados
Todo se mantiene intacto, solo cambia el estado.

## ✅ Casos de Uso

```typescript
// Reactivar compañía archivada
const active = await reactivateCompanyService(companyId, userId);
// {
//   ...company,
//   state: 'active',
//   archivedAt: null,
//   updatedAt: Date (nuevo)
// }

// Uso típico en interfaz
const handleReactivate = async () => {
  try {
    await reactivateCompanyService(companyId, userId);
    showSuccess('Company reactivated');
    navigate('/companies');
  } catch (error) {
    showError(error.message);
  }
};
```

## ⚠️ Errores Posibles

```typescript
// Compañía no existe
'Company not found'

// Usuario no es propietario
'Access denied'

// No está archivada
'Company is not archived'

// IDs inválidos
'Invalid company ID'
'Invalid user ID'

// Error de BD
'Failed to reactivate company'
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Reactivar compañía archivada exitosamente
- ✅ Error si no está archivada
- ✅ Error si usuario no es propietario
- ✅ Error si compañía no existe
- ✅ Validación de IDs inválidos
- ✅ archivedAt limpiado correctamente

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { reactivateCompanyService } from '@/services/company';

// Endpoint REST
app.post('/api/companies/:id/reactivate', authenticateUser, async (req, res) => {
  try {
    const company = await reactivateCompanyService(
      Number(req.params.id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: company,
      message: 'Company reactivated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Frontend con confirmación
const handleReactivate = async (companyId: number) => {
  const confirmed = await showConfirmDialog({
    title: 'Reactivate Company?',
    message: 'This will restore full functionality.',
    confirmText: 'Reactivate'
  });
  
  if (confirmed) {
    await reactivateCompanyService(companyId, userId);
    showSuccess('Company is now active');
    refreshList();
  }
};
```

## 📊 Impacto

### Base de Datos
- **Operaciones**: 2 (select + update)
- **Datos modificados**: 3 campos
- **Sin pérdida**: Nada se elimina

### Aplicación
- Aparece en listados activos
- Se excluye de listados archivados
- Todas las operaciones habilitadas

## 🔄 Ciclo Completo

```typescript
// Crear compañía
const company = await createCompanyService({ name: 'Test' }, userId);
// state: 'active', archivedAt: null

// Archivar
const archived = await archiveCompanyService(company.id, userId);
// state: 'archived', archivedAt: Date

// Reactivar
const reactivated = await reactivateCompanyService(company.id, userId);
// state: 'active', archivedAt: null (restaurado)

// Puede archivarse y reactivarse múltiples veces
```

## 🔐 Seguridad

- Solo el propietario puede reactivar
- No permite reactivar compañías ya activas (idempotencia)
- Mantiene integridad de datos

## 💡 Consideraciones

### Cuándo Reactivar
- ✅ Compañía temporalmente inactiva vuelve a operar
- ✅ Error en archivo (se archivó por error)
- ✅ Cambio de decisión empresarial

### Validaciones Previas Recomendadas
- Verificar que no haya conflictos de nombre
- Confirmar con el usuario
- Verificar dependencias (branches, employees activos)

## 🚧 Mejoras Futuras

- [ ] Notificación al propietario
- [ ] Validaciones de dependencias (branches, etc.)
- [ ] Razón de reactivación (opcional)
- [ ] Límites de reactivaciones
- [ ] Auto-notificar a empleados asociados
- [ ] Logs de auditoría
