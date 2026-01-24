# Servicio: getCompany

Obtiene los detalles completos de una compañía específica.

## 📖 Descripción

Este servicio recupera una compañía por su ID, validando que el usuario solicitante tenga permisos de acceso (sea el propietario).

## 🎯 Propósito

- Obtener detalles completos de una compañía
- Validar permisos de acceso
- Prevenir acceso no autorizado a datos

## 📝 Firma

```typescript
async function getCompanyService(
  companyId: number, 
  userId: number
): Promise<Company>
```

### Parámetros
- `companyId` (number): ID de la compañía a obtener
- `userId` (number): ID del usuario solicitante

### Retorno
- `Company`: Objeto completo con todos los datos de la compañía

## 🔍 Comportamiento

### Flujo de Obtención
1. Valida parámetros de entrada
2. Busca la compañía en la BD
3. Verifica que existe
4. Valida que el usuario sea el propietario
5. Retorna la compañía completa

### Validación de Permisos
Solo el propietario (`ownerId`) puede acceder a la compañía.

## ✅ Casos de Uso

```typescript
// Obtener compañía (usuario es propietario)
const company = await getCompanyService(1, userId);
// {
//   id: 1,
//   name: 'tech solutions',
//   description: 'A tech company',
//   ownerId: 1,
//   logoUrl: 'https://example.com/logo.png',
//   state: 'active',
//   archivedAt: null,
//   createdAt: Date,
//   updatedAt: Date
// }

// Uso en página de detalles
const companyDetails = await getCompanyService(
  params.companyId, 
  currentUser.id
);
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
```

## 🧪 Testing

El servicio incluye tests para:
- ✅ Retornar compañía si usuario es propietario
- ✅ Error si compañía no existe
- ✅ Error si usuario no es propietario
- ✅ Validación de company ID inválido
- ✅ Validación de user ID inválido

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `eq` (Drizzle operator)

## 💡 Ejemplo de Integración

```typescript
import { getCompanyService } from '@/services/company';

// Endpoint REST
app.get('/api/companies/:id', authenticateUser, async (req, res) => {
  try {
    const company = await getCompanyService(
      Number(req.params.id),
      req.user.id
    );
    
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    const status = error.message === 'Access denied' ? 403 : 404;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

// Uso en frontend
const loadCompany = async (id: number) => {
  try {
    const company = await api.getCompany(id);
    setCompanyData(company);
  } catch (error) {
    if (error.message === 'Access denied') {
      navigate('/companies');
    } else {
      showError('Company not found');
    }
  }
};
```

## 📊 Rendimiento

- **Operaciones de BD**: 1 (select)
- **Complejidad**: O(1) con índice en ID
- **Caché**: Considerar para compañías frecuentemente consultadas

## 🔐 Seguridad

- Validación estricta de permisos
- No expone compañías de otros usuarios
- Mensajes de error genéricos para prevenir information disclosure

## 🚧 Mejoras Futuras

- [ ] Incluir información relacionada (branches, employees)
- [ ] Caché de datos frecuentes
- [ ] Logs de acceso para auditoría
- [ ] Rate limiting por usuario
- [ ] Roles adicionales (admin, viewer)
