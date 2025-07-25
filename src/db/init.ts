// src/db/init.ts

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

  const clientReal = new Client({
    user: PG_USER,
    password: PG_PASSWORD,
    host: PG_HOST,
    port: Number(PG_PORT),
    database: PG_DB_NAME,
  });

  await clientReal.connect();

  // Tabla: users
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

  // Tabla: businesses
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

  // Tabla: business_socials
  await clientReal.query(`
    CREATE TABLE IF NOT EXISTS business_socials (
      business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      facebook_url TEXT,
      instagram_url TEXT,
      x_url TEXT,
      tiktok_url TEXT,
      threads_url TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log(`✅ Tabla 'business_socials' verificada.`);

  // Tabla: business_locations
  await clientReal.query(`
    CREATE TABLE IF NOT EXISTS business_locations (
      business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      address TEXT,
      city TEXT,
      province TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log(`✅ Tabla 'business_locations' verificada.`);

  await clientReal.end();
};
