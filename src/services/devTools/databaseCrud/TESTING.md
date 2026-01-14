# Testing System - DevTools CRUD Services

## 📋 Resumen

Sistema completo de testing para los servicios CRUD de DevTools, incluyendo mocks, tests unitarios y tests de integración.

## 🏗️ Estructura de Archivos

```
src/services/devTools/databaseCrud/
├── __mocks__/
│   ├── db.mock.ts              # Mock de la base de datos
│   └── schema.mock.ts          # Mock del schema
├── create.service.test.ts      # Tests unitarios de CREATE
├── read.service.test.ts        # Tests unitarios de READ
├── update.service.test.ts      # Tests unitarios de UPDATE
├── delete.service.test.ts      # Tests unitarios de DELETE
├── crud-integration.test.ts    # Tests de integración
└── TESTING.md                  # Este archivo
```

## 🎯 Cobertura de Tests

### Tests Unitarios por Servicio

#### CREATE Service (create.service.test.ts)
- ✅ Crear usuario correctamente
- ✅ Crear producto correctamente
- ✅ Error: tabla no existe
- ✅ Error: data vacío
- ✅ Error: data nulo
- ✅ Timestamps automáticos
- ✅ Valores por defecto del schema
- ✅ Manejo de campos opcionales
- ✅ Metadata en respuesta exitosa

#### READ Service (read.service.test.ts)
- ✅ Leer todos los registros sin filtros
- ✅ Filtrar por campo simple
- ✅ Filtrar por múltiples campos
- ✅ Array vacío sin coincidencias
- ✅ Error: tabla no existe
- ✅ Leer registro por ID
- ✅ Error: ID no existe
- ✅ ID como string
- ✅ Metadata en respuesta

#### UPDATE Service (update.service.test.ts)
- ✅ Actualizar un campo
- ✅ Actualizar múltiples campos
- ✅ UpdatedAt automático
- ✅ Error: tabla no existe
- ✅ Error: ID no existe
- ✅ Error: data vacío
- ✅ ID como string
- ✅ No modificar campos no especificados
- ✅ Actualizar campo a null (nullable)
- ✅ Metadata en respuesta

#### DELETE Service (delete.service.test.ts)
- ✅ Eliminar usuario correctamente
- ✅ Retornar datos del registro eliminado
- ✅ Error: tabla no existe
- ✅ Error: ID no existe
- ✅ ID como string
- ✅ Hard delete (eliminación física)
- ✅ Eliminar múltiples registros
- ✅ No afectar otras tablas
- ✅ Metadata en respuesta

#### Integration Tests (crud-integration.test.ts)
- ✅ Flujo CRUD completo
- ✅ Crear múltiples registros y listarlos
- ✅ Actualizar múltiples registros
- ✅ Operaciones en diferentes tablas
- ✅ Manejo de errores en cadena
- ✅ Consistencia de datos
- ✅ Filtros después de crear
- ✅ Timestamps en flujo completo
- ✅ Operaciones en BD vacía
- ✅ Recuperación de errores

## 🧪 Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Tests específicos
```bash
# Solo tests de create
npm test create.service.test.ts

# Solo tests de read
npm test read.service.test.ts

# Solo tests de update
npm test update.service.test.ts

# Solo tests de delete
npm test delete.service.test.ts

# Solo tests de integración
npm test crud-integration.test.ts
```

### Tests en modo watch
```bash
npm run test:watch
```

### Cobertura de código
```bash
npm run test:coverage
```

## 🎭 Sistema de Mocks

### db.mock.ts
Mock de la base de datos en memoria que simula:
- Inserción de registros
- Lectura con filtros
- Actualización de registros
- Eliminación de registros
- Query builder de Drizzle ORM

#### Datos Mock Disponibles
- **mockUsers**: 3 usuarios de prueba
- **mockProducts**: 2 productos de prueba
- **mockDatabase**: Objeto con todas las tablas

#### Funciones Auxiliares
- `resetMockDatabase()`: Restaura datos iniciales
- `clearMockDatabase()`: Limpia todas las tablas

### schema.mock.ts
Mock del schema que simula:
- Definición de tablas
- Tipos de datos
- Lista de tablas disponibles

## 📊 Resultados Esperados

Al ejecutar todos los tests, deberías ver:

```
PASS  src/services/devTools/databaseCrud/create.service.test.ts
PASS  src/services/devTools/databaseCrud/read.service.test.ts
PASS  src/services/devTools/databaseCrud/update.service.test.ts
PASS  src/services/devTools/databaseCrud/delete.service.test.ts
PASS  src/services/devTools/databaseCrud/crud-integration.test.ts

Test Suites: 5 passed, 5 total
Tests:       XX passed, XX total
```

## 🔧 Configuración

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js']
};
```

### jest.setup.js
Variables de entorno para testing:
```javascript
process.env.NODE_ENV = 'test';
process.env.PG_DB_NAME = 'test_database';
// ... otras variables
```

## 🚀 Próximos Pasos

Una vez que los tests estén pasando correctamente:

### 1. ✅ **Tests Completados** (Actual)
- [x] Mocks de BD y schema
- [x] Tests unitarios CRUD
- [x] Tests de integración
- [x] Documentación de testing

### 2. 🎯 **Crear Rutas API** (Siguiente)
- [ ] Router de DevTools
- [ ] Endpoints CRUD
- [ ] Middleware de validación
- [ ] Manejo de errores HTTP

### 3. 🔌 **Integración Cliente-Servidor**
- [ ] Cliente HTTP en frontend
- [ ] Tipos TypeScript compartidos
- [ ] Manejo de respuestas
- [ ] Estados de carga y error

### 4. 🎨 **Herramienta Cliente**
- [ ] Interfaz de usuario
- [ ] Tabla de datos
- [ ] Formularios CRUD
- [ ] Feedback visual

## 📝 Notas Importantes

### Limitaciones del Mock Actual
El sistema de mocks es funcional pero simplificado:
- Los filtros no están completamente implementados
- El query builder es una simulación básica
- No hay validación de constraints

### Para Mejorar
Si necesitas mocks más robustos:
1. Implementar evaluación real de condiciones WHERE
2. Agregar validación de tipos de datos
3. Simular constraints (unique, foreign keys)
4. Agregar transacciones

### Testing con BD Real
Para tests de integración con BD real:
1. Crear BD de testing separada
2. Usar docker-compose para BD temporal
3. Seed de datos antes de tests
4. Cleanup después de tests

## 🐛 Troubleshooting

### "Cannot find module"
```bash
# Limpiar cache de Jest
npm test -- --clearCache

# Reinstalar dependencias
npm install
```

### "Timeout exceeded"
Aumentar timeout en jest.config.js:
```javascript
testTimeout: 10000
```

### Mocks no funcionan
Verificar que los paths en `jest.mock()` sean correctos y relativos al archivo de test.

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [ts-jest](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://testingjavascript.com/)
