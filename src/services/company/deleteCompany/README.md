# Servicio: deleteCompany

Elimina permanentemente una compañía de la base de datos (hard delete).

## 📖 Descripción

Este servicio realiza una eliminación física de la compañía, removiéndola completamente de la base de datos. **Esta operación es irreversible**.

## ⚠️ ADVERTENCIA

**Esta es una operación destructiva y permanente. Una vez eliminada, la compañía NO puede ser recuperada.**

Considera usar `archiveCompanyService` en su lugar para:
- Mantener historial
- Permitir recuperación futura
- Preservar relaciones e integridad referencial

## 🎯 Propósito

- Eliminación definitiva de compañías
- Liberar nombres para reutilizar
- Cumplir con GDPR / derecho al olvido
- Eliminar datos de prueba/test

## 📝 Firma

```typescript
async function deleteCompanyService(
  companyId: number,
  userId: number
): Promise<void>
```

### Parámetros
- `companyId` (number): ID de la compañía a eliminar
- `userId` (number): ID del usuario (debe ser propietario)

### Retorno
- `void`: No retorna nada, lanza error si falla

## 🔍 Comportamiento

### Flujo de Eliminación
1. Valida parámetros de entrada
2. Obtiene compañía existente
3. Verifica que existe
4. Valida permisos del usuario
5. **Elimina permanentemente de la BD**

### Validaciones Previas
- Compañía debe existir
- Usuario debe ser propietario
- IDs deben ser válidos

### Datos Afectados
- ❌ Registro de compañía
- ⚠️ Potencialmente relaciones (branches, employees, etc.)

## ⚠️ Precauciones

### ANTES de Eliminar
1. **Verificar dependencias**: Branches, empleados, etc.
2. **Backup**: Guardar copia si es necesario
3. **Confirmación explícita**: Requiere confirmación del usuario
4. **Considerar archivo**: ¿Realmente necesitas eliminar?

### Restricciones Recomendadas
- No permitir si tiene branches activas
- No permitir si tiene empleados asociados
- Requerir contraseña adicional
- Período de gracia (soft delete primero)

## ✅ Casos de Uso VÁLIDOS

```typescript
// Eliminar compañía de prueba/test
await deleteCompanyService(testCompanyId, userId);

// Eliminar tras cumplir con solicitud GDPR
await deleteCompanyService(companyId, userId);

// Eliminar creación errónea
await deleteCompanyService(wrongCompanyId, userId);
```

## ❌ Casos de Uso NO RECOMENDADOS

```typescript
// ❌ NO USAR para desactivar temporalmente
// → Usar archiveCompanyService en su lugar

// ❌ NO USAR si puede reactivarse en el futuro
// → Usar archiveCompanyService

// ❌ NO USAR sin verificar dependencias
// → Verificar branches, employees, etc. primero
```

## ⚠️ Errores Posibles

```typescript
// Compañía no existe
'Company not found'

// Usuario no es propietario
'Access denied'

// IDs inválidos
'Invalid company ID'
'Invalid user ID'

// Error de BD
'Failed to delete company'
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Eliminar compañía exitosamente
- ✅ Error si usuario no es propietario
- ✅ Error si compañía no existe
- ✅ Validación de user ID inválido
- ✅ Validación de company ID inválido

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { deleteCompanyService } from '@/services/company';

// Endpoint con DOBLE confirmación
app.delete('/api/companies/:id', authenticateUser, async (req, res) => {
  // Validar confirmación en body
  const { confirmation } = req.body;
  if (confirmation !== 'DELETE') {
    return res.status(400).json({
      error: 'Confirmation required'
    });
  }
  
  try {
    await deleteCompanyService(
      Number(req.params.id),
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Company permanently deleted'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Frontend con confirmación DOBLE
const handleDelete = async (company: Company) => {
  // Primera confirmación
  const confirmed1 = await showConfirmDialog({
    title: 'Delete Company?',
    message: `This will permanently delete "${company.name}". This action CANNOT be undone.`,
    type: 'danger',
    confirmText: 'Delete'
  });
  
  if (!confirmed1) return;
  
  // Segunda confirmación con input
  const confirmed2 = await showInputDialog({
    title: 'Confirm Deletion',
    message: 'Type "DELETE" to confirm:',
    placeholder: 'DELETE',
    confirmText: 'Delete Forever',
    type: 'danger'
  });
  
  if (confirmed2 === 'DELETE') {
    await api.deleteCompany(company.id, { confirmation: 'DELETE' });
    showSuccess('Company deleted');
    navigate('/companies');
  }
};
```

## 📊 Impacto

### Base de Datos
- **Operaciones**: 2 (select + delete)
- **Datos eliminados**: Registro completo
- **Nombre liberado**: Disponible para reutilizar

### Cascadas Potenciales
⚠️ Dependiendo del schema:
- Branches asociadas
- Empleados asociados
- Configuraciones
- Historial de cambios

## 🔄 Comparación: Delete vs Archive

| Aspecto | Delete | Archive |
|---------|--------|---------|
| **Reversible** | ❌ No | ✅ Sí (reactivate) |
| **Datos** | Eliminados | Preservados |
| **Nombre** | Liberado | Ocupado |
| **Relaciones** | Rotas/Eliminadas | Intactas |
| **Historial** | Perdido | Mantenido |
| **Uso recomendado** | Test/GDPR | Desactivación temporal |

## 🔐 Seguridad

### Implementación Actual
- Solo propietario puede eliminar
- Validación de permisos
- Sin periodo de gracia

### Recomendaciones Adicionales
- [ ] Soft delete primero (periodo de gracia)
- [ ] Requerir autenticación adicional (password)
- [ ] Validar dependencias (branches, employees)
- [ ] Logs de auditoría detallados
- [ ] Notificación email post-eliminación
- [ ] Backup automático antes de eliminar

## 🚧 Mejoras Futuras

- [ ] **Soft delete**: Periodo de gracia de 30 días
- [ ] **Cascade checks**: Validar dependencias
- [ ] **Backup automático**: Antes de eliminar
- [ ] **Audit log**: Registro detallado
- [ ] **Restricciones**: No permitir con branches/employees activos
- [ ] **Recuperación**: Papelera de reciclaje (60 días)
- [ ] **Confirmación 2FA**: Para operaciones críticas

## 💡 Mejores Prácticas

### ✅ Recomendado
1. Implementar soft delete con periodo de gracia
2. Archivar primero, eliminar después
3. Verificar dependencias antes de eliminar
4. Requerir confirmación explícita
5. Logs de auditoría detallados

### ❌ Evitar
1. Eliminar sin confirmación
2. Eliminar sin verificar dependencias
3. No tener backup
4. Permitir eliminación masiva sin restricciones
