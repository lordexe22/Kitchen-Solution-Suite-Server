// src/db/init.ts
// #section - Imports
import { drizzle } from 'drizzle-orm/node-postgres';
// #end-section

// #variable - DATABASE_URL
const { DATABASE_URL } = process.env;
// #end-variable

/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit push -> apply the migrations to the database
npx drizzle-kit generate -> generate new migration files
npx drizzle-kit migrate -> run pending migrations

*/

export const db = drizzle(DATABASE_URL!);
