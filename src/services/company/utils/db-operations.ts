/**
 * Operaciones de BD compartidas para servicios de Company
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Cuenta el número de compañías que tiene un usuario
 */
export async function countUserCompanies(userId: number): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(companiesTable)
    .where(eq(companiesTable.ownerId, userId));

  return result?.count || 0;
}
