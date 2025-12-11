-- Script SQL para pruebas del sistema de permisos de empleados
-- Ejecutar en PostgreSQL después de aplicar migraciones
-- Este script crea datos de prueba para validar el funcionamiento del sistema

-- =============================================================================
-- IMPORTANTE: Este script es SOLO PARA PRUEBAS
-- NO ejecutar en producción
-- =============================================================================

-- #step 1 - Limpiar datos de prueba anteriores (opcional)
-- DELETE FROM users WHERE email LIKE '%@test-permissions.com';

-- #step 2 - Crear usuario ADMIN de prueba
INSERT INTO users (
  first_name, 
  last_name, 
  email, 
  password_hash, 
  type, 
  state, 
  is_active,
  branch_id,
  permissions,
  created_at,
  updated_at
) VALUES (
  'Admin',
  'Test',
  'admin@test-permissions.com',
  -- Password: "admin123" (hasheado con bcrypt, 10 rounds)
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'admin',
  'active',
  true,
  NULL, -- Admin no tiene branchId
  NULL, -- Admin no necesita permisos
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- #step 3 - Crear compañía de prueba para el admin
INSERT INTO companies (
  name,
  description,
  owner_id,
  logo_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Compañía de Prueba - Permisos',
  'Compañía creada para probar el sistema de permisos de empleados',
  (SELECT id FROM users WHERE email = 'admin@test-permissions.com'),
  NULL,
  true,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- #step 4 - Crear sucursal de prueba
INSERT INTO branches (
  company_id,
  name,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM companies WHERE name = 'Compañía de Prueba - Permisos'),
  'Sucursal Central - Test',
  true,
  NOW(),
  NOW()
);

-- #step 5 - Crear usuario EMPLOYEE con permisos completos
INSERT INTO users (
  first_name, 
  last_name, 
  email, 
  password_hash, 
  type, 
  state, 
  is_active,
  branch_id,
  permissions,
  created_at,
  updated_at
) VALUES (
  'Juan',
  'Empleado Full',
  'employee-full@test-permissions.com',
  -- Password: "employee123" (mismo hash, cambiar en producción)
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'employee',
  'active',
  true,
  (SELECT id FROM branches WHERE name = 'Sucursal Central - Test' LIMIT 1),
  -- Permisos completos para probar
  '{
    "products": {
      "canView": true,
      "canCreate": true,
      "canEdit": true,
      "canDelete": true
    },
    "categories": {
      "canView": true,
      "canCreate": true,
      "canEdit": true,
      "canDelete": false
    },
    "schedules": {
      "canView": true,
      "canEdit": true
    },
    "socials": {
      "canView": true,
      "canEdit": true
    },
    "location": {
      "canView": true,
      "canEdit": false
    },
    "branchInfo": {
      "canView": true,
      "canEdit": false
    }
  }',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- #step 6 - Crear usuario EMPLOYEE solo lectura
INSERT INTO users (
  first_name, 
  last_name, 
  email, 
  password_hash, 
  type, 
  state, 
  is_active,
  branch_id,
  permissions,
  created_at,
  updated_at
) VALUES (
  'María',
  'Empleado Lectura',
  'employee-readonly@test-permissions.com',
  -- Password: "employee123"
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'employee',
  'active',
  true,
  (SELECT id FROM branches WHERE name = 'Sucursal Central - Test' LIMIT 1),
  -- Solo permisos de lectura (permisos por defecto)
  '{
    "products": {
      "canView": true,
      "canCreate": false,
      "canEdit": false,
      "canDelete": false
    },
    "categories": {
      "canView": true,
      "canCreate": false,
      "canEdit": false,
      "canDelete": false
    },
    "schedules": {
      "canView": false
    },
    "socials": {
      "canView": false
    },
    "location": {
      "canView": false
    },
    "branchInfo": {
      "canView": true,
      "canEdit": false
    }
  }',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- #step 7 - Crear usuario GUEST de prueba
INSERT INTO users (
  first_name, 
  last_name, 
  email, 
  password_hash, 
  type, 
  state, 
  is_active,
  branch_id,
  permissions,
  created_at,
  updated_at
) VALUES (
  'Pedro',
  'Invitado',
  'guest@test-permissions.com',
  -- Password: "guest123"
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'guest',
  'active',
  true,
  NULL, -- Guest no tiene branchId
  NULL, -- Guest no tiene permisos
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- #step 8 - Verificar datos insertados
SELECT 
  id,
  first_name,
  last_name,
  email,
  type,
  branch_id,
  CASE 
    WHEN permissions IS NULL THEN 'Sin permisos'
    ELSE LEFT(permissions::text, 50) || '...'
  END as permissions_preview,
  state,
  is_active
FROM users
WHERE email LIKE '%@test-permissions.com'
ORDER BY type, id;

-- =============================================================================
-- CREDENCIALES DE PRUEBA:
-- =============================================================================
-- ADMIN:
--   Email: admin@test-permissions.com
--   Password: admin123
--   Permisos: Todos (bypass)
--
-- EMPLOYEE (permisos completos):
--   Email: employee-full@test-permissions.com
--   Password: employee123
--   Permisos: Puede editar productos, crear/editar categorías (no eliminar)
--
-- EMPLOYEE (solo lectura):
--   Email: employee-readonly@test-permissions.com
--   Password: employee123
--   Permisos: Solo ver productos y categorías
--
-- GUEST:
--   Email: guest@test-permissions.com
--   Password: guest123
--   Permisos: Ninguno (bloqueado en la mayoría de endpoints)
-- =============================================================================
