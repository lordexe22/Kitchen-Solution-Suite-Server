/* src/scripts/fixEmployeeInvitationsTable.ts */

/**
 * Script para corregir la tabla employee_invitations.
 * Elimina las secuencias DEFAULT de columnas que fueron cambiadas de serial a integer.
 */

import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixEmployeeInvitationsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigiendo tabla employee_invitations...\n');

    // Eliminar defaults de las columnas que eran serial
    await client.query('ALTER TABLE employee_invitations ALTER COLUMN branch_id DROP DEFAULT');
    console.log('✓ branch_id: DEFAULT eliminado');

    await client.query('ALTER TABLE employee_invitations ALTER COLUMN company_id DROP DEFAULT');
    console.log('✓ company_id: DEFAULT eliminado');

    await client.query('ALTER TABLE employee_invitations ALTER COLUMN created_by DROP DEFAULT');
    console.log('✓ created_by: DEFAULT eliminado');

    await client.query('ALTER TABLE employee_invitations ALTER COLUMN used_by_user_id DROP DEFAULT');
    console.log('✓ used_by_user_id: DEFAULT eliminado');

    // Eliminar las secuencias huérfanas
    await client.query('DROP SEQUENCE IF EXISTS employee_invitations_branch_id_seq CASCADE');
    console.log('✓ Secuencia branch_id_seq eliminada');

    await client.query('DROP SEQUENCE IF EXISTS employee_invitations_company_id_seq CASCADE');
    console.log('✓ Secuencia company_id_seq eliminada');

    await client.query('DROP SEQUENCE IF EXISTS employee_invitations_created_by_seq CASCADE');
    console.log('✓ Secuencia created_by_seq eliminada');

    await client.query('DROP SEQUENCE IF EXISTS employee_invitations_used_by_user_id_seq CASCADE');
    console.log('✓ Secuencia used_by_user_id_seq eliminada');

    console.log('\n✅ Tabla corregida exitosamente');
  } catch (error) {
    console.error('❌ Error al corregir la tabla:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixEmployeeInvitationsTable();
