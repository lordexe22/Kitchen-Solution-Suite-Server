# Servicio: checkNameAvailability

Verifica si un nombre de compañía está disponible para su uso.

## 📖 Descripción

Este servicio comprueba si un nombre de compañía ya existe en la base de datos. Utiliza normalización de nombres para garantizar comparaciones precisas y case-insensitive.

## 🎯 Propósito

- Prevenir nombres duplicados de compañías
- Validación previa a la creación o actualización
- Garantizar unicidad de nombres (case-insensitive)

## 📝 Firma

```typescript
async function checkNameAvailability(name: string): Promise<boolean>
```

### Parámetros
- `name` (string): Nombre de la compañía a verificar

### Retorno
- `boolean`: `true` si el nombre está disponible, `false` si ya existe

## 🔍 Comportamiento

### Normalización
El servicio normaliza el nombre antes de verificar:
1. Convierte a minúsculas
2. Elimina espacios al inicio y final
3. Reduce espacios múltiples a uno solo

### Consideraciones
- Las compañías **archivadas** se consideran como nombres ocupados
- La verificación es case-insensitive
- Los espacios extras no afectan la comparación

## ✅ Casos de Uso

```typescript
// Nombre disponible
await checkNameAvailability('Nueva Empresa'); // true

// Nombre ya existe (exacto)
await checkNameAvailability('Tech Solutions'); // false

// Nombre existe con diferentes mayúsculas
await checkNameAvailability('TECH SOLUTIONS'); // false

// Nombre existe con espacios diferentes
await checkNameAvailability('Tech  Solutions'); // false
```

## ⚠️ Validaciones

- **Entrada vacía**: Lanza error si el nombre está vacío
- **Tipo inválido**: Lanza error si no es string
- **Espacios en blanco**: Lanza error si solo contiene espacios

## 🧪 Testing

El servicio incluye tests para:
- ✅ Nombre disponible
- ✅ Nombre ya existente
- ✅ Case-insensitive matching
- ✅ Comparación con espacios múltiples
- ✅ Validación de entrada vacía
- ✅ Validación de tipo
- ✅ Nombres archivados ocupan espacio
- ✅ Normalización correcta

## 🔗 Dependencias

- `db` (Drizzle ORM)
- `companiesTable` (Schema)
- `normalizeCompanyName` (Utilidad de constants.ts)

## 💡 Ejemplo de Integración

```typescript
import { checkNameAvailability } from '@/services/company';

// En un endpoint de validación
app.post('/api/companies/check-name', async (req, res) => {
  const { name } = req.body;
  
  const isAvailable = await checkNameAvailability(name);
  
  res.json({ 
    available: isAvailable,
    message: isAvailable 
      ? 'Name is available' 
      : 'Name is already taken'
  });
});

// En el servicio de creación
if (!await checkNameAvailability(inputName)) {
  throw new Error('Company name already exists');
}
```

## 📊 Rendimiento

- **Complejidad**: O(n) donde n es el número de compañías
- **Optimización**: Índice en campo `name` recomendado
- **Caché**: Considerar caché para nombres frecuentes

## 🚧 Mejoras Futuras

- [ ] Sugerencias de nombres similares disponibles
- [ ] Validación de palabras prohibidas
- [ ] Fuzzy matching para detectar nombres muy similares
- [ ] Rate limiting para prevenir spam
