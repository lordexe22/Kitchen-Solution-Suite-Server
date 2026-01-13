import { pgTable, serial, text, varchar, boolean, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations
  
*/

// #section Enumeraciones
export const userTypeEnum = pgEnum('user_type', ['admin', 'employee', 'guest', 'dev']);
export const userStateEnum = pgEnum('user_state', ['pending', 'active', 'suspended']);
export const platformNameEnum = pgEnum('platform_name', ['local', 'google', 'facebook', 'x']);
// #end-section

// #variable usersTable - Tabla de usuarios
/**
 * Tabla principal de usuarios del sistema.
 * 
 * Soporta múltiples tipos de usuario mediante el campo 'type':
 * - admin: Propietario de compañías, control total de sus recursos
 * - employee: Empleado asignado a UNA sucursal con permisos específicos
 * - guest: Usuario visitante, solo lectura de recursos públicos
 * - dev: Usuario desarrollador con acceso especial
 * 
 * Campos específicos por tipo:
 * - employee: Requiere branchId (sucursal asignada). Los permisos se almacenan en la tabla employee_permissions
 * - admin/guest/dev: branchId debe ser NULL
 * 
 * @field id - Identificador único autoincremental
 * @field firstName - Nombre del usuario (255 caracteres máx)
 * @field lastName - Apellido del usuario (255 caracteres máx)
 * @field email - Email único del usuario
 * @field passwordHash - Hash bcrypt de la contraseña
 * @field type - Tipo de usuario (enum: admin, employee, guest, dev)
 * @field branchId - FK a sucursal (solo para employee, nullable)
 * @field createdAt - Fecha de creación
 * @field updatedAt - Fecha de última actualización
 * @field isActive - Estado activo/inactivo (email verificado)
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
  
  // Campo específico para empleados: ID de la sucursal (nullable)
  branchId: integer('branch_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(false),
  state: userStateEnum('state').notNull().default('pending'),
  imageUrl: text('image_url'),
});
// #end-variable

// #variable apiPlatformsTable - Tabla para vincular usuarios con plataformas externas
export const apiPlatformsTable = pgTable('api_platforms', {
  userId: serial('user_id').notNull().references(() => usersTable.id), // FK a users
  platformName: platformNameEnum('platform_name').notNull(),
  platformToken: text('token').notNull(),
  linkedAt: timestamp('linked_at').notNull().defaultNow(),
});
// #end-variable
