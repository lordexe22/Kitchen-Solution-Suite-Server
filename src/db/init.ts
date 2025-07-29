// src/db/init.ts
// #section - Imports
import { pool, tempPool } from "./pool";
import { 
  CREATE_USER_TABLE,
  CREATE_COMPANY_TABLE,
  CREATE_SOCIAL_MEDIA_TABLE,
  CREATE_LOCATION_TABLE
} from "./queries";
import dotenv from "dotenv";
// #end-section
dotenv.config();
// #variable - PG_DB_NAME
const { PG_DB_NAME } = process.env;
// #end-variable
// #function initializeDatabase - Setup for initialize the postgres DB 
export const initializeDatabase = async () => {
  // #step 1 - Check if PG_DB_NAME exists in the default postgres db
  const dbExists = await tempPool.query(`
    SELECT 1 FROM pg_database WHERE datname = '${PG_DB_NAME}'
  `);
  // #end-step
  // #step 2 - If PG_DB_NAME does not exist, create it
  if (dbExists.rowCount === 0) {
    await tempPool.query(`CREATE DATABASE "${PG_DB_NAME}"`);
  } 
  // #end-step
  // #step 3 - Create tables into PG_DB_NAME if they don't exist
  await pool.query(CREATE_USER_TABLE);
  await pool.query(CREATE_COMPANY_TABLE);
  await pool.query(CREATE_SOCIAL_MEDIA_TABLE);
  await pool.query(CREATE_LOCATION_TABLE);
  // #end-step
};
// #end-function