// src/db/init.ts
// #section - Imports
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
// #end-section

// #variable - DATABASE_URL
const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}
// #end-variable

/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations

*/

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Maneja errores de conexión en el pool
 */
pool.on('error', (error) => {
  console.error('Unexpected pool error:', error);
  process.exit(1);
});

export const db = drizzle(pool);

/**
 * Graceful shutdown: cierra la conexión a la BD cuando se detiene la app
 */
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
