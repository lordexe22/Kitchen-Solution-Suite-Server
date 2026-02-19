import { pgTable, serial, text, varchar, boolean, timestamp, pgEnum, integer, index } from 'drizzle-orm/pg-core';

/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations
  
*/

// #section Enumeraciones
export const userTypeEnum = pgEnum('user_type', ['admin', 'employee', 'guest', 'ownership']);
export const userStateEnum = pgEnum('user_state', ['pending', 'active', 'suspended']);
export const companyStateEnum = pgEnum('company_state', ['active', 'archived']);
export const platformNameEnum = pgEnum('platform_name', ['local', 'google', 'facebook', 'x']);
// #end-section

// #variable usersTable - Tabla de usuarios
/**
 * Tabla principal de usuarios del sistema.
 * 
 * Soporta múltiples tipos de usuario mediante el campo 'type':
 * - ownership: Propietario de compañías, control total (en desarrollo, usar 'admin' temporalmente)
 * - admin: Usuario administrador del sistema (equipo desarrollo)
 * - employee: Empleado asignado a UNA sucursal con permisos específicos
 * - guest: Usuario visitante, solo lectura de recursos públicos
 * 
 * Campos específicos por tipo:
 * - employee: Requiere belongToBranchId (sucursal asignada). Los permisos se almacenan en la tabla employee_permissions
 * - admin/guest/dev: belongToBranchId debe ser NULL
 * 
 * @field id - Identificador único autoincremental
 * @field firstName - Nombre del usuario (255 caracteres máx)
 * @field lastName - Apellido del usuario (255 caracteres máx)
 * @field email - Email único del usuario
 * @field passwordHash - Hash bcrypt de la contraseña
 * @field type - Tipo de usuario (enum: admin, employee, guest, dev)
 * @field belongToCompanyId - FK a compañía (nullable, solo para usuarios con acceso a compañía)
 * @field belongToBranchId - FK a sucursal (solo para employee, nullable)
 * @field createdAt - Fecha de creación
 * @field updatedAt - Fecha de última actualización
 * @field state - Estado del usuario (enum: pending, active, suspended)
 * @field imageUrl - URL de la imagen de perfil (Cloudinary)
 */
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  type: userTypeEnum('type').notNull().default('guest'),
  
  // Campos de pertenencia a compañía y sucursal
  belongToCompanyId: integer('belong_to_company_id'),
  belongToBranchId: integer('belong_to_branch_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  state: userStateEnum('state').notNull().default('pending'),
  imageUrl: text('image_url'),
});
// #end-variable

// #variable apiPlatformsTable - Tabla para vincular usuarios con plataformas externas
export const apiPlatformsTable = pgTable('api_platforms', {
  userId: integer('user_id').notNull().references(() => usersTable.id), // FK a users
  platformName: platformNameEnum('platform_name').notNull(),
  platformToken: text('token').notNull(),
  linkedAt: timestamp('linked_at').notNull().defaultNow(),
});
// #end-variable

// #variable companiesTable - Tabla de compañías
/**
 * Tabla de compañías del sistema.
 * 
 * Una compañía es la entidad principal que agrupa sucursales y empleados.
 * Cada compañía tiene un dueño (ownership) que puede tener múltiples compañías.
 * 
 * @field id - Identificador único autoincremental
 * @field name - Nombre único de la compañía
 * @field description - Descripción de la compañía (opcional)
 * @field ownerId - FK a users (el propietario/ownership de la compañía)
 * @field logoUrl - URL del logo (Cloudinary, opcional)
 * @field state - Estado de la compañía (enum: active, archived)
 * @field archivedAt - Fecha de archivo (null si no está archivada)
 * @field createdAt - Fecha de creación
 * @field updatedAt - Fecha de última actualización
 */
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: integer('owner_id').notNull().references(() => usersTable.id),
  logoUrl: text('logo_url'),
  state: companyStateEnum('state').notNull().default('active'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Índice para queries por owner
  ownerIdIdx: index('companies_owner_id_idx').on(table.ownerId),
  
  // Índice compuesto para la query más común: WHERE owner_id = ? AND state = ?
  ownerStateIdx: index('companies_owner_state_idx').on(table.ownerId, table.state),
  
  // Índice para ordenamiento por fecha de creación
  createdAtIdx: index('companies_created_at_idx').on(table.createdAt.desc()),
  
  // Índice compuesto óptimo para query completa con ORDER BY
  ownerStateCreatedIdx: index('companies_owner_state_created_idx')
    .on(table.ownerId, table.state, table.createdAt.desc()),
}));
// #end-variable

