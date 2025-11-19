import { pgTable, serial, text, varchar, boolean, timestamp, pgEnum, decimal, integer } from 'drizzle-orm/pg-core';


/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations
  
*/

// #section Enumeraciones
export const userTypeEnum = pgEnum('user_type', ['admin', 'employ', 'guest', 'dev']);
export const userStateEnum = pgEnum('user_state', ['pending', 'active', 'suspended']);
export const platformNameEnum = pgEnum('platform_name', ['local', 'google', 'facebook', 'x']);
export const backgroundModeEnum = pgEnum('background_mode', ['solid', 'gradient']);
export const gradientTypeEnum = pgEnum('gradient_type', ['linear', 'radial']);
// #end-section
// #variable usersTable - Tabla de usuarios
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(), // ID autoincremental
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  type: userTypeEnum('type').notNull().default('guest'),
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
// #variable companiesTable - Tabla de compañías (marcas corporativas)
/**
 * Tabla de compañías/marcas del sistema.
 * 
 * Esta tabla representa SOLO la marca/empresa corporativa.
 * Los datos específicos de ubicación (sucursales) estarán en otras tablas.
 * 
 * Modelo: USER → COMPANIES → BRANCHES → (locations, socials, schedules, employees, products)
 * 
 * Características:
 * - Un usuario puede crear múltiples compañías/marcas
 * - El nombre de la compañía es único a nivel global
 * - Implementa soft delete con período de 30 días
 * - Minimalista: solo datos corporativos de la marca
 * 
 * Casos de uso:
 * - Empresa con múltiples sucursales: "Grido" → [Sucursal Centro, Sucursal Norte, ...]
 * - Negocio único: "Pizzería La Esquina" → [Sucursal Única]
 * 
 * @field id - Identificador único autoincremental
 * @field name - Nombre único de la marca/empresa (255 caracteres máx)
 * @field description - Descripción corporativa opcional (500 caracteres máx)
 * @field ownerId - ID del usuario propietario (FK a users con cascade delete)
 * @field logoUrl - URL del logo corporativo (pendiente integración con Cloudinary)
 * @field createdAt - Fecha de creación
 * @field updatedAt - Fecha de última actualización
 * @field isActive - Estado activo/inactivo (false = soft deleted)
 * @field deletedAt - Fecha de eliminación lógica (null = no eliminado)
 */
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  ownerId: serial('owner_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at'),
});
// #end-variable
// #variable branchesTable - Tabla de sucursales
export const branchesTable = pgTable('branches', {
  id: serial('id').primaryKey(),
  companyId: serial('company_id')
    .notNull()
    .references(() => companiesTable.id, { onDelete: 'cascade' }),
  
  // Nombre personalizado (NULLABLE)
  name: varchar('name', { length: 255 }), // ← PUEDE SER NULL
  
  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
// #end-variable
// #variable branchLocationsTable - Tabla de direcciones
export const branchLocationsTable = pgTable('branch_locations', {
  id: serial('id').primaryKey(),
  branchId: serial('branch_id')
    .notNull()
    .references(() => branchesTable.id, { onDelete: 'cascade' })
    .unique(), // UNA sucursal = UNA ubicación
  
  // Campos OBLIGATORIOS
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  
  // Campos OPCIONALES
  postalCode: varchar('postal_code', { length: 20 }), // ← INCLUIDO como opcional
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// #end-variable
// #variable branchSocialsTable - Tabla de redes sociales de sucursales
/**
 * Tabla de redes sociales de sucursales.
 * 
 * Almacena los enlaces a redes sociales de cada sucursal.
 * Relación: Muchos-a-Uno con Branch (una sucursal puede tener múltiples redes).
 * 
 * Características:
 * - Permite múltiples redes sociales por sucursal
 * - Tipos de redes: facebook, instagram, twitter, linkedin, tiktok, youtube, whatsapp, website
 * - URL obligatoria
 * - Sin soft delete (eliminación física)
 */
export const branchSocialsTable = pgTable('branch_socials', {
  id: serial('id').primaryKey(),
  branchId: serial('branch_id')
    .notNull()
    .references(() => branchesTable.id, { onDelete: 'cascade' }),
  
  // Tipo de red social
  platform: varchar('platform', { length: 50 }).notNull(),
  
  // URL de la red social
  url: varchar('url', { length: 500 }).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// #end-variable
// #variable branchSchedulesTable - Tabla de horarios de sucursales
/**
 * Tabla de horarios de atención de sucursales.
 * 
 * Almacena los horarios de apertura/cierre para cada día de la semana.
 * Relación: Muchos-a-Uno con Branch (una sucursal puede tener múltiples horarios).
 * 
 * Características:
 * - Un registro por día de la semana por sucursal
 * - Permite marcar días como cerrados
 * - Formato de hora: "HH:MM" (24 horas)
 * - Sin soft delete (eliminación física)
 * 
 * Ejemplo:
 * - branchId: 1, dayOfWeek: 'monday', openTime: '09:00', closeTime: '18:00', isClosed: false
 * - branchId: 1, dayOfWeek: 'sunday', isClosed: true
 */
export const branchSchedulesTable = pgTable('branch_schedules', {
  id: serial('id').primaryKey(),
  branchId: serial('branch_id')
    .notNull()
    .references(() => branchesTable.id, { onDelete: 'cascade' }),
  
  // Día de la semana
  dayOfWeek: varchar('day_of_week', { length: 20 }).notNull(),
  
  // Horarios (nullable para días cerrados)
  openTime: varchar('open_time', { length: 5 }), // "09:00"
  closeTime: varchar('close_time', { length: 5 }), // "18:00"
  
  // Indicador de cerrado
  isClosed: boolean('is_closed').notNull().default(false),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// #end-variable
// #variable pendingDeletionsTable
/**
 * Tabla de eliminaciones programadas (soft deletes con período de gracia).
 * 
 * Almacena qué entidades están programadas para eliminación definitiva.
 * Se usa para el cron job que ejecuta hard deletes.
 * 
 * Características:
 * - Agnóstica a la entidad (users, companies, branches, etc.)
 * - Permite auditoría (quién, cuándo, por qué)
 * - Se limpia automáticamente después del hard delete
 * 
 * Flujo:
 * 1. Usuario solicita eliminar cuenta → Se crea registro aquí
 * 2. Cron job diario revisa `scheduledAt < now`
 * 3. Ejecuta hard delete (elimina de Cloudinary + BD)
 * 4. Elimina este registro
 */
export const pendingDeletionsTable = pgTable('pending_deletions', {
  id: serial('id').primaryKey(),
  
  // Qué entidad se va a eliminar
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'user' | 'company' | 'branch'
  entityId: serial('entity_id').notNull(), // ID de la entidad
  
  // Cuándo se debe eliminar
  scheduledAt: timestamp('scheduled_at').notNull(), // Fecha de eliminación definitiva
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(), // Cuándo se programó
  reason: varchar('reason', { length: 255 }), // Opcional: razón de eliminación
  
  // Para auditoría (opcional)
  requestedBy: serial('requested_by').references(() => usersTable.id), // Quién lo solicitó
});
// #end-variable
// #variable categoriesTable - Tabla de categorías de productos
/**
 * Tabla de categorías de productos.
 * 
 * Almacena las categorías que organizan los productos de cada sucursal.
 * Relación: Muchos-a-Uno con Branch (una sucursal puede tener múltiples categorías).
 * 
 * Características:
 * - Una categoría pertenece a UNA sucursal específica
 * - Nombre obligatorio (máx 100 caracteres)
 * - Descripción opcional (máx 500 caracteres)
 * - Imagen opcional (URL de Cloudinary)
 * - Color de texto obligatorio (hex, default #FFFFFF)
 * - Modo de fondo: sólido o gradiente
 * - Si es gradiente, almacena configuración en JSONB
 * - Hard delete (eliminación física)
 * - sortOrder: Orden de visualización (menor = primero)
 * 
 * Ejemplo:
 * - branchId: 1, name: 'Pizzas', backgroundColor: '#FF6B6B', backgroundMode: 'solid', sortOrder: 1
 * - branchId: 1, name: 'Bebidas', backgroundMode: 'gradient', gradientConfig: {...}, sortOrder: 2
 * 
 * Relación futura:
 * - BRANCH → CATEGORIES → PRODUCTS (una categoría tendrá muchos productos)
 */
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  branchId: serial('branch_id')
    .notNull()
    .references(() => branchesTable.id, { onDelete: 'cascade' }),
  
  // Información básica
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  imageUrl: text('image_url'),
  
  // Configuración de color de texto
  textColor: varchar('text_color', { length: 7 }).notNull().default('#FFFFFF'),
  
  // Configuración de fondo
  backgroundMode: backgroundModeEnum('background_mode').notNull().default('solid'),
  backgroundColor: varchar('background_color', { length: 7 }).notNull().default('#3B82F6'),
  
  // Configuración de gradiente (almacenada como JSON)
  // { type: 'linear' | 'radial', angle: number, colors: string[] }
  gradientConfig: text('gradient_config'), // Almacenaremos JSON stringificado
  
  // Orden de visualización (menor = primero)
  sortOrder: integer('sort_order').notNull().default(0),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// #end-variable


