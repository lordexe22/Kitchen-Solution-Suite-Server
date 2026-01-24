/**
 * Servicio: Archivar Compañía
 *
 * Marca una compañía como archivada usando transacciones para prevenir race conditions.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { Company } from '../types';
import { validateCompanyId, validateUserId } from '../utils/validators';
import { mapToCompany } from '../utils/mappers';
import { handleDatabaseError } from '../utils/error-handler';

/**
 * Archiva una compañía
 *
 * @param companyId - ID de la compañía a archivar
 * @param userId - ID del usuario (debe ser el propietario)
 * @returns La compañía archivada
 * @throws Error si la compañía no existe, el usuario no tiene permiso, o ya está archivada
 */
export async function archiveCompanyService(companyId: number, userId: number): Promise<Company> {
  validateCompanyId(companyId);
  validateUserId(userId);

  try {
    return await db.transaction(async (tx) => {
      // SELECT FOR UPDATE previene modificaciones concurrentes
      const [existingCompany] = await tx
        .select({
          id: companiesTable.id,
          ownerId: companiesTable.ownerId,
          state: companiesTable.state,
        })
        .from(companiesTable)
        .where(eq(companiesTable.id, companyId))
        .for('update');

      if (!existingCompany) {
        throw new Error('Company not found');
      }

      if (existingCompany.ownerId !== userId) {
        throw new Error('Access denied');
      }

      if (existingCompany.state === 'archived') {
        throw new Error('Company is already archived');
      }

      // Actualizar la compañía
      const [updatedCompany] = await tx
        .update(companiesTable)
        .set({
          state: 'archived',
          archivedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(companiesTable.id, companyId))
        .returning();

      if (!updatedCompany) {
        throw new Error('Failed to archive company');
      }

      return mapToCompany(updatedCompany);
    });
  } catch (error) {
    handleDatabaseError(error, 'company archival');
  }
}

export type { Company } from '../types';
