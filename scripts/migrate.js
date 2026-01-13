// scripts/migrate.js
// Script para ejecutar migraciones SQL en PostgreSQL
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

// Configurar pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=public'
});

async function runMigration(filePath) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔄 Ejecutando migración: ${path.basename(filePath)}`);
    
    // Leer el archivo SQL
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Ejecutar todo el SQL de una vez como transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✅ Migración completada exitosamente\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error ejecutando migración:`);
    console.error(error.message);
    console.error('\nSQL completo:');
    console.error(fs.readFileSync(filePath, 'utf-8'));
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migraciones...\n');
    console.log(`📦 Base de datos: ${process.env.PG_DB_NAME}`);
    console.log(`🔗 Host: ${process.env.PG_HOST}:${process.env.PG_PORT}\n`);
    
    // Directorio de migraciones
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    // Obtener todos los archivos .sql
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('⚠️  No se encontraron migraciones para ejecutar');
      return;
    }
    
    // Ejecutar cada migración
    for (const file of files) {
      await runMigration(path.join(migrationsDir, file));
    }
    
    console.log('🎉 Todas las migraciones completadas\n');
  } catch (error) {
    console.error('\n💥 Error en el proceso de migración');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
