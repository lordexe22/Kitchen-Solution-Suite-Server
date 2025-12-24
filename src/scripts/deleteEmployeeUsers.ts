/* src/scripts/deleteEmployeeUsers.ts */

import 'dotenv/config';
import { db } from '../db/init';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

async function deleteEmployees(): Promise<void> {
  try {
    console.log('🧹 Eliminando usuarios type=employee (y sus permisos)...');

    const deletedUsers = await db
      .delete(usersTable)
      .where(eq(usersTable.type, 'employee'))
      .returning({ id: usersTable.id, email: usersTable.email });

    console.log(`✅ Usuarios eliminados: ${deletedUsers.length}`);
    if (deletedUsers.length) {
      console.table(deletedUsers.map(u => ({ id: u.id, email: u.email })));
    }

  } catch (err) {
    console.error('❌ Error eliminando empleados:', err);
  } finally {
    process.exit(0);
  }
}

deleteEmployees();