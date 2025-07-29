// src\db\pool.ts

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// #variable commonEnvDataForDB - aux use
const commonEnvDataForDB = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
}
// #end-variable
// #variable tempPool - Temporal pool for initializa the database if it not exists
export const tempPool = new Pool({
 ...commonEnvDataForDB,
  database: 'postgres',
});
// #end-variable
// #variable pool - Pool for make queries to the database
export const pool = new Pool({
 ...commonEnvDataForDB,
  database: process.env.PG_DB_NAME,
});
// #end-variable

/* #info

  Un pool es grupo de conexiones reutilizables a la base de datos, 
  evita abrir/cerrar conexiones en cada consulta y mejora el rendimiento.
  Cada pool se configura con la información que le corresponde a la base
  de datos a la cual se va a conectar.

  tempPool >> pensada para operaciones de ejecución única (ej - crear tablas)
  pool >> pensada para uso normal
  
*/