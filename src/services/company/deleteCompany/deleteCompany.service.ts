/**
 * Servicio: Eliminar Compañía
 *
 * Realiza eliminación física de una compañía de la BD usando transacciones.
 * Verifica que no haya dependencias críticas antes de eliminar.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { validateCompanyId, validateUserId } from '../utils/validators';
import { handleDatabaseError } from '../utils/error-handler';
import { deleteCompanyLogo } from '../utils/logo-operations';

/**
 * Elimina una compañía de la BD
 *
 * @param companyId - ID de la compañía a eliminar
 * @param userId - ID del usuario (debe ser el propietario)
 * @throws Error si la compañía no existe, el usuario no tiene permiso, hay dependencias, o hay un error en la BD
 */
export async function deleteCompanyService(companyId: number, userId: number): Promise<void> {
  validateCompanyId(companyId);
  validateUserId(userId);

  try {
    await db.transaction(async (tx) => {
      // SELECT FOR UPDATE previene eliminaciones concurrentes
      const [existingCompany] = await tx
        .select({
          id: companiesTable.id,
          name: companiesTable.name,
          ownerId: companiesTable.ownerId,
          state: companiesTable.state,
          logoUrl: companiesTable.logoUrl,
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

      // Limpiar logo de Cloudinary si existe
      if (existingCompany.logoUrl) {
        await deleteCompanyLogo(companyId, existingCompany.name);
      }

      // TODO: Cuando se agreguen tablas relacionadas (branches, products, etc.),
      // descomentar y agregar verificaciones de dependencias aquí:
      // 
      // const [branchCount] = await tx
      //   .select({ count: sql<number>`COUNT(*)::int` })
      //   .from(branchesTable)
      //   .where(eq(branchesTable.companyId, companyId));
      // 
      // if (branchCount.count > 0) {
      //   throw new Error(
      //     `Cannot delete company with ${branchCount.count} branches. ` +
      //     'Archive it instead or delete branches first.'
      //   );
      // }

      // Eliminar la compañía (solo si no hay dependencias)
      await tx.delete(companiesTable).where(eq(companiesTable.id, companyId));
    });
  } catch (error) {
    handleDatabaseError(error, 'company deletion');
  }
}
