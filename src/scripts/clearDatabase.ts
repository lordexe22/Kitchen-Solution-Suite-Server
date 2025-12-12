// src/scripts/clearDatabase.ts
/**
 * Script para limpiar todas las tablas de la base de datos
 * Útil para desarrollo y testing
 */

// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/init';
import { 
  usersTable, 
  apiPlatformsTable, 
  userTagsTable,
  companiesTable,
  branchesTable,
  branchSchedulesTable,
  branchSocialsTable,
  branchLocationsTable,
  productsTable,
  categoriesTable,
  employeeInvitationsTable,
  pendingDeletionsTable
} from '../db/schema';
import { sql } from 'drizzle-orm';

async function clearDatabase() {
  try {
    console.log('🗑️  Iniciando limpieza de base de datos...');

    // Limpiar todas las tablas en orden (respetando foreign keys)
    // Solo limpiar las tablas principales que existen
    
    try {
      console.log('📋 Limpiando employee_invitations...');
      await db.delete(employeeInvitationsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla employee_invitations no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando categories...');
      await db.delete(categoriesTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla categories no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando products...');
      await db.delete(productsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla products no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando branch_socials...');
      await db.delete(branchSocialsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla branch_socials no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando branch_schedules...');
      await db.delete(branchSchedulesTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla branch_schedules no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando branch_locations...');
      await db.delete(branchLocationsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla branch_locations no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando branches...');
      await db.delete(branchesTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla branches no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando companies...');
      await db.delete(companiesTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla companies no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando user_tags...');
      await db.delete(userTagsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla user_tags no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando pending_deletions...');
      await db.delete(pendingDeletionsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla pending_deletions no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando api_platforms...');
      await db.delete(apiPlatformsTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla api_platforms no existe, saltando...');
    }
    
    try {
      console.log('📋 Limpiando users...');
      await db.delete(usersTable);
    } catch (err: any) {
      if (err?.cause?.code !== '42P01') throw err;
      console.log('⚠️  Tabla users no existe, saltando...');
    }

    console.log('✅ Base de datos limpiada exitosamente');
    console.log('🔔 El próximo usuario que se registre será admin (primer usuario)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  }
}

clearDatabase();
