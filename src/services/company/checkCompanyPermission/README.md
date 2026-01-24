# Servicio: checkCompanyPermission

Verifica si un usuario tiene permisos para acceder o modificar una compañía.

## 📖 Descripción

Este servicio valida los permisos de un usuario sobre una compañía específica, retornando un resultado estructurado con la razón si no tiene acceso.

## 🎯 Propósito

- Validación previa de permisos
- Mensajes de error descriptivos
- Lógica de autorización centralizada
- Base para sistema de permisos más complejo

## 📝 Firma

```typescript
async function checkCompanyPermissionService(
  companyId: number,
  userId: number
): Promise<PermissionCheckResult>
```

### Parámetros
- `companyId` (number): ID de la compañía a verificar
- `userId` (number): ID del usuario a validar

### Retorno
```typescript
interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;  // Solo presente si hasPermission es false
}
```

## 🔍 Comportamiento

### Validaciones
1. Verifica que la compañía existe
2. Valida que el usuario sea el propietario

### Casos
- **Tiene permiso**: `{ hasPermission: true }`
- **Compañía no existe**: `{ hasPermission: false, reason: 'Company not found' }`
- **No es propietario**: `{ hasPermission: false, reason: 'User is not the owner' }`

## ✅ Casos de Uso

```typescript
// Usuario es propietario
const result = await checkCompanyPermissionService(1, userId);
// { hasPermission: true }

// Usuario NO es propietario
const result = await checkCompanyPermissionService(1, otherUserId);
// { hasPermission: false, reason: 'User is not the owner' }

// Compañía no existe
const result = await checkCompanyPermissionService(999, userId);
// { hasPermission: false, reason: 'Company not found' }

// Uso en validación previa
const permission = await checkCompanyPermissionService(companyId, userId);
if (!permission.hasPermission) {
  throw new Error(permission.reason);
}
// Proceder con operación...
```

## 💡 Usos Prácticos

### 1. Middleware de Autorización
```typescript
const requireCompanyAccess = async (req, res, next) => {
  const { companyId } = req.params;
  const { id: userId } = req.user;
  
  const permission = await checkCompanyPermissionService(
    Number(companyId), 
    userId
  );
  
  if (!permission.hasPermission) {
    return res.status(403).json({
      error: permission.reason || 'Access denied'
    });
  }
  
  next();
};

app.get('/api/companies/:companyId/branches', 
  authenticateUser, 
  requireCompanyAccess, 
  getBranches
);
```

### 2. Validación en Frontend
```typescript
const canEditCompany = async (companyId: number) => {
  const permission = await api.checkCompanyPermission(companyId);
  
  if (permission.hasPermission) {
    showEditButton();
  } else {
    hideEditButton();
    showMessage(permission.reason);
  }
};
```

### 3. Autorización Programática
```typescript
// En servicios complejos
async function complexOperation(companyId: number, userId: number) {
  // Verificar permisos primero
  const permission = await checkCompanyPermissionService(companyId, userId);
  if (!permission.hasPermission) {
    logger.warn(`Unauthorized access attempt: ${permission.reason}`);
    throw new UnauthorizedError(permission.reason);
  }
  
  // Proceder con operación
  // ...
}
```

## ⚠️ Errores Posibles

```typescript
// IDs inválidos
'Invalid company ID'
'Invalid user ID'
```

**Nota**: A diferencia de otros servicios, este NO lanza error si no tiene permisos, sino que retorna `{ hasPermission: false, reason: '...' }`.

## 🧪 Testing

El servicio incluye tests para:
- ✅ Retornar true si usuario es propietario
- ✅ Retornar false con razón si no es propietario
- ✅ Retornar false con razón si compañía no existe
- ✅ Validación de user ID inválido
- ✅ Validación de company ID inválido

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { checkCompanyPermissionService } from '@/services/company';

// Endpoint de verificación
app.get('/api/companies/:id/permission', authenticateUser, async (req, res) => {
  const result = await checkCompanyPermissionService(
    Number(req.params.id),
    req.user.id
  );
  
  res.json(result);
});

// Uso en servicios internos
const canUserAccess = async (companyId: number, userId: number): Promise<boolean> => {
  const result = await checkCompanyPermissionService(companyId, userId);
  return result.hasPermission;
};

// Decorador de permisos
function requireCompanyPermission(companyIdKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.params[companyIdKey] || req.body[companyIdKey];
    const permission = await checkCompanyPermissionService(
      Number(companyId), 
      req.user.id
    );
    
    if (!permission.hasPermission) {
      return res.status(403).json({ error: permission.reason });
    }
    
    req.companyPermission = permission;
    next();
  };
}
```

## 📊 Rendimiento

- **Operaciones de BD**: 1 (select)
- **Complejidad**: O(1) con índice en ID
- **Caché**: Considerar para validaciones frecuentes

## 🔐 Modelo de Permisos Actual

### Implementación Actual: OWNERSHIP
- Solo el `ownerId` tiene permisos completos
- No hay roles intermedios (viewer, editor, etc.)
- Binario: tiene o no tiene acceso

### Expansión Futura: RBAC (Role-Based Access Control)

```typescript
interface PermissionCheckResult {
  hasPermission: boolean;
  role?: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions?: string[];  // ['read', 'write', 'delete', 'manage-users']
  reason?: string;
}

// Ejemplo de uso avanzado
const result = await checkCompanyPermissionService(companyId, userId);
if (result.permissions?.includes('write')) {
  // Permitir edición
}
```

## 🚧 Mejoras Futuras

### Sistema de Roles
- [ ] **Owner**: Todos los permisos
- [ ] **Admin**: Gestión de usuarios y configuración
- [ ] **Editor**: Modificar datos, no gestionar usuarios
- [ ] **Viewer**: Solo lectura

### Permisos Granulares
- [ ] Permisos por recurso (branches, employees, etc.)
- [ ] Permisos temporales (acceso limitado por tiempo)
- [ ] Delegación de permisos

### Funcionalidades Avanzadas
- [ ] Caché de permisos (Redis)
- [ ] Logs de acceso
- [ ] Notificaciones de accesos no autorizados
- [ ] API para gestión de permisos
- [ ] Jerarquía de compañías (parent-child permissions)

### Integración
- [ ] Middleware Express genérico
- [ ] Decoradores TypeScript
- [ ] Policy-based authorization
- [ ] Integración con OAuth/SAML

## 💡 Consideraciones de Diseño

### Por qué NO lanzar error
Este servicio retorna un objeto estructurado en lugar de lanzar errores para:
- Permitir manejo más flexible en el llamador
- Proporcionar razones descriptivas sin try-catch
- Facilitar uso en validaciones condicionales
- Mejor experiencia en frontend (sin necesidad de catch)

### Cuándo usar este servicio
- ✅ Validaciones previas
- ✅ Mostrar/ocultar UI elementos
- ✅ Middleware de autorización
- ✅ Decisiones programáticas

### Cuándo usar validación directa
- Cuando solo necesitas throw error si no tiene acceso
- En otros servicios internos (para simplicidad)
