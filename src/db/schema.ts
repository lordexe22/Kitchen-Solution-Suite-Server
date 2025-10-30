import { pgTable, serial, text, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';


/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations

*/

// Enumeraciones
export const userTypeEnum = pgEnum('user_type', ['admin', 'employ', 'guest', 'dev']);
export const userStateEnum = pgEnum('user_state', ['pending', 'active', 'suspended']);
export const platformNameEnum = pgEnum('platform_name', ['local', 'google', 'facebook', 'x']);

// Tabla de usuarios
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

// Tabla para vincular usuarios con plataformas externas
export const apiPlatformsTable = pgTable('api_platforms', {
  userId: serial('user_id').notNull().references(() => usersTable.id), // FK a users
  platformName: platformNameEnum('platform_name').notNull(),
  platformToken: text('token').notNull(),
  linkedAt: timestamp('linked_at').notNull().defaultNow(),
});