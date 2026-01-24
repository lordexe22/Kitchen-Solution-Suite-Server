# Servicio: archiveCompany

Archiva una compañía activa sin eliminarla de la base de datos.

## 📖 Descripción

Este servicio cambia el estado de una compañía de 'active' a 'archived', preservando todos sus datos para posible recuperación futura.

## 🎯 Propósito

- Desactivar compañías sin pérdida de datos
- Mantener historial de compañías
- Permitir reactivación posterior
- Ocultar de listados activos

## 📝 Firma

```typescript
async function archiveCompanyService(
  companyId: number,
  userId: number
): Promise<Company>
```

### Parámetros
- `companyId` (number): ID de la compañía a archivar
- `userId` (number): ID del usuario (debe ser propietario)

### Retorno
- `Company`: La compañía archivada con estado actualizado

## 🔍 Comportamiento

### Cambios Realizados
1. `state`: 'active' → 'archived'
2. `archivedAt`: null → fecha actual
3. `updatedAt`: actualizado a fecha actual

### Validaciones Previas
- Compañía debe existir
- Usuario debe ser propietario
- Compañía NO debe estar ya archivada

### Datos Preservados
- ✅ Nombre y descripción
- ✅ Logo URL
- ✅ Relaciones (branches, employees, etc.)
- ✅ Fecha de creación
- ✅ Propietario

## ✅ Casos de Uso

```typescript
// Archivar compañía activa
const archived = await archiveCompanyService(companyId, userId);
// {
//   ...company,
//   state: 'archived',
//   archivedAt: Date,
//   updatedAt: Date
// }

// Uso en endpoint
app.post('/api/companies/:id/archive', authenticateUser, async (req, res) => {
  const company = await archiveCompanyService(
    Number(req.params.id),
    req.user.id
  );
  res.json({ success: true, data: company });
});
```

## ⚠️ Errores Posibles

```typescript
// Compañía no existe
'Company not found'

// Usuario no es propietario
'Access denied'

// Ya está archivada
'Company is already archived'

// IDs inválidos
'Invalid company ID'
'Invalid user ID'

// Error de BD
'Failed to archive company'
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Archivar compañía activa exitosamente
- ✅ Error si ya está archivada
- ✅ Error si usuario no es propietario
- ✅ Error si compañía no existe
- ✅ Validación de IDs inválidos
- ✅ Timestamps correctamente actualizados

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { archiveCompanyService } from '@/services/company';

// Endpoint con confirmación
app.post('/api/companies/:id/archive', authenticateUser, async (req, res) => {
  try {
    const company = await archiveCompanyService(
      Number(req.params.id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: company,
      message: 'Company archived successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Frontend con confirmación
const handleArchive = async (companyId: number) => {
  const confirmed = await showConfirmDialog({
    title: 'Archive Company?',
    message: 'You can reactivate it later.',
    confirmText: 'Archive'
  });
  
  if (confirmed) {
    await archiveCompanyService(companyId, userId);
    showSuccess('Company archived');
    refreshList();
  }
};
```

## 📊 Impacto

### Base de Datos
- **Operaciones**: 2 (select + update)
- **Datos modificados**: 3 campos
- **Datos preservados**: Todos los demás

### Aplicación
- Se oculta de listados activos por defecto
- Aún accesible con filtro `state: 'archived'`
- Puede ser reactivada con `reactivateCompanyService`

## 🔄 Diferencias con Delete

| Aspecto | Archive | Delete |
|---------|---------|--------|
| Datos | Preservados | Eliminados |
| Recuperación | Fácil (reactivate) | Imposible |
| Nombre | Sigue ocupado | Liberado |
| Relaciones | Intactas | Eliminadas |
| Historial | Mantenido | Perdido |

## 🔐 Seguridad

- Solo el propietario puede archivar
- No afecta integridad referencial
- Audit trail mediante `archivedAt`

## 💡 Consideraciones

### Cuándo Archivar
- ✅ Compañía temporalmente inactiva
- ✅ Mantener historial de datos
- ✅ Posible reactivación futura
- ✅ Reportes históricos

### Cuándo NO Archivar (usar Delete)
- ❌ Datos erróneos/test
- ❌ Compañía definitivamente cerrada
- ❌ Liberar nombre para reutilizar
- ❌ Compliance/GDPR (derecho al olvido)

## 🚧 Mejoras Futuras

- [ ] Razón de archivo (opcional)
- [ ] Notificación al propietario
- [ ] Auto-archivo tras inactividad
- [ ] Restricciones en compañías archivadas (no permitir operaciones)
- [ ] Cascade de estado a entidades relacionadas
