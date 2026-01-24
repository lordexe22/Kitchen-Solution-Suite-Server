/**
 * Servicio: Reactivar Compañía Archivada
 *
 * Cambia una compañía de estado 'archived' a 'active' usando transacciones.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { Company } from '../types';
import { validateCompanyId, validateUserId } from '../utils/validators';
import { mapToCompany } from '../utils/mappers';
import { handleDatabaseError } from '../utils/error-handler';

/**
 * Reactiva una compañía archivada
 *
 * @param companyId - ID de la compañía a reactivar
 * @param userId - ID del usuario (debe ser el propietario)
 * @returns La compañía reactivada
 * @throws Error si la compañía no existe, el usuario no tiene permiso, o no está archivada
 */
export async function reactivateCompanyService(companyId: number, userId: number): Promise<Company> {
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

      if (existingCompany.state !== 'archived') {
        throw new Error('Company is not archived');
      }

      // Actualizar la compañía
      const [updatedCompany] = await tx
        .update(companiesTable)
        .set({
          state: 'active',
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(companiesTable.id, companyId))
        .returning();

      if (!updatedCompany) {
        throw new Error('Failed to reactivate company');
      }

      return mapToCompany(updatedCompany);
    });
  } catch (error) {
    handleDatabaseError(error, 'company reactivation');
  }
}

export type { Company } from '../types';
