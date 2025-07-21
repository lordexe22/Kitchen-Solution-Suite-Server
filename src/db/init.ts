// src\db\init.ts

// #section - Inicialización de base de datos y estructura
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  PG_USER,
  PG_PASSWORD,
  PG_PORT,
  PG_HOST,
  PG_DB_NAME
} = process.env;

const dbBase = "postgres";

export const inicializarBase = async () => {
  // Conexión temporal a la base 'postgres' para crear la base real si no existe
  const clientTemp = new Client({
    user: PG_USER,
    password: PG_PASSWORD,
    host: PG_HOST,
    port: Number(PG_PORT),
    database: dbBase,
  });

  await clientTemp.connect();

  const existeDB = await clientTemp.query(`
    SELECT 1 FROM pg_database WHERE datname = '${PG_DB_NAME}'
  `);

  if (existeDB.rowCount === 0) {
    console.log(`🛠️  Creando base de datos '${PG_DB_NAME}'...`);
    await clientTemp.query(`CREATE DATABASE "${PG_DB_NAME}"`);
  } else {
    console.log(`✅ Base de datos '${PG_DB_NAME}' ya existe.`);
  }

  await clientTemp.end();

  // Ahora conectar a la base correcta
  const clientReal = new Client({
    user: PG_USER,
    password: PG_PASSWORD,
    host: PG_HOST,
    port: Number(PG_PORT),
    database: PG_DB_NAME,
  });

  await clientReal.connect();

  // Crear tabla usuarios si no existe
  await clientReal.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT,
      company_name TEXT,
      register_date TIMESTAMP NOT NULL,
      role TEXT NOT NULL,
      account_status TEXT NOT NULL
    )
  `);

  console.log(`✅ Tabla 'users' verificada.`);

  // Crear tabla businesses si no existe
  await clientReal.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      alias TEXT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);

  console.log(`✅ Tabla 'businesses' verificada.`);

  await clientReal.end();
};
// #end-section
