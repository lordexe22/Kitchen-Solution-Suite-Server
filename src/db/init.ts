// src/db/init.ts
// #section - Imports
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';
// #end-section

dotenv.config();

// #variable - DATABASE_URL
const { DATABASE_URL } = process.env;
// #end-variable

/* #info 

Initialize Drizzle ORM with PostgreSQL.
Drizzle initialize connection automatically using the connection string from environment variable DATABASE_URL.

Need execute the following commands to upgrade the database schema:

npx drizzle-kit generate
npx drizzle-kit migrate

*/

export const db = drizzle(DATABASE_URL!);
