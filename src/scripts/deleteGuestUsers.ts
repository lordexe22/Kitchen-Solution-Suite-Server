/* src/scripts/deleteGuestUsers.ts */

import 'dotenv/config';
import { db } from '../db/init';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

async function deleteGuests() {
  try {
    console.log('🧹 Eliminando usuarios guest...');
    const deleted = await db.delete(usersTable).where(eq(usersTable.type, 'guest')).returning({ id: usersTable.id, email: usersTable.email });
    console.log(`✅ Eliminados ${deleted.length} usuarios guest`);
    if (deleted.length) {
      console.table(deleted.map(u => ({ id: u.id, email: u.email })));
    }
  } catch (err) {
    console.error('❌ Error eliminando guests:', err);
  } finally {
    process.exit(0);
  }
}

deleteGuests();
