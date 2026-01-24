# TODO: Servicios de Compañías - Backend

## Plan de Implementación

Trabajaremos en estos servicios de forma incremental: implementar → testing → integración con cliente.

### 1. Verificar disponibilidad de nombre de compañía
- **Responsabilidad**: Recibe un nombre y responde si puede usarse
- **Entrada**: string (nombre)
- **Salida**: boolean
- **Notas**:
  - No crea ni modifica nada
  - Comparación case-insensitive y normalización de espacios
  - Decidir si nombres archivados se consideran ocupados
  - Solo responde la verdad actual del sistema
- **Status**: ⏳ TODO

### 2. Crear una compañía
- **Responsabilidad**: Servicio central de creación
- **Entrada**: nombre, descripción (opcional), userId
- **Salida**: Company completa con id, timestamps, etc.
- **Validaciones**:
  - Datos coherentes
  - Nombre disponible en el momento
  - Verificar usuario autenticado
- **Errores**: Claros y específicos
- **Status**: ⏳ TODO

### 3. Obtener todas las compañías de un usuario
- **Responsabilidad**: Listar compañías del usuario
- **Entrada**: userId
- **Salida**: Company[] (solo datos necesarios)
- **Reglas**:
  - Decidir si incluir archivadas
  - Orden predictible
  - Rápido y eficiente
- **Status**: ⏳ TODO

### 4. Obtener una compañía en particular
- **Responsabilidad**: Obtener estado actual completo
- **Entrada**: companyId
- **Salida**: Company completa
- **Notas**:
  - Representa "la verdad actual"
  - No asumir datos en cliente están actualizados
  - Usado al entrar a trabajar en una compañía
- **Status**: ⏳ TODO

### 5. Modificar una compañía
- **Responsabilidad**: Cambiar datos existentes
- **Entrada**: companyId, updates (nombre, descripción, etc.)
- **Salida**: Company actualizada
- **Validaciones**:
  - Cambios válidos
  - No romper reglas (unicidad de nombre)
  - Solo modificar lo solicitado
- **Status**: ⏳ TODO

### 6. Archivar una compañía
- **Responsabilidad**: Cambiar estado a inactivo sin eliminar
- **Entrada**: companyId
- **Salida**: Company con isActive = false
- **Notas**:
  - No toca otros datos
  - La compañía sigue existiendo
  - Reversible
- **Status**: ⏳ TODO

### 7. Reactivar una compañía archivada
- **Responsabilidad**: Devolver a estado operativo
- **Entrada**: companyId
- **Salida**: Company con isActive = true
- **Validaciones**:
  - Verificar que esté archivada
  - Evitar estados inconsistentes
- **Status**: ⏳ TODO

### 8. Eliminar una compañía
- **Responsabilidad**: Borrar definitivamente
- **Entrada**: companyId
- **Salida**: confirmación o vacío
- **Notas**:
  - Acción fuerte y poco frecuente
  - Cuidado con cuándo permitirla
  - Sin vuelta atrás
  - Podría convertirse en borrado lógico
- **Status**: ⏳ TODO

### 9. Verificar permisos sobre una compañía
- **Responsabilidad**: ¿Puede este usuario operar sobre esta compañía?
- **Entrada**: userId, companyId, action (opcional)
- **Salida**: boolean
- **Notas**:
  - Solo confirmación, no devuelve datos
  - Centraliza lógica de permisos
  - Evita contradicciones
- **Status**: ⏳ TODO

---

## Consideraciones Generales

- **Normalización**: El nombre debe normalizarse consistentemente (trim, lowercase para comparación)
- **Estados**: Definir claramente qué significan active/archived/deleted
- **Ownership**: Verificar siempre que el usuario sea dueño de la compañía
- **Errores**: Mensajes específicos y útiles
- **Testing**: Unit tests y tests de integración para cada servicio
- **Documentación**: Comentarios claros en el código

## Próximos Pasos

1. Verificar estructura actual de BD (tabla companies)
2. Crear tipos/interfaces en el backend
3. Implementar servicio #1 (verificar disponibilidad)
4. Tests para #1
5. Integración en API
6. Pasar al siguiente...
