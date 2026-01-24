/**
 * Servicio: Obtener una Compañía Particular
 *
 * Obtiene los detalles de una compañía específica verificando
 * que el usuario tenga permiso de acceso.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import type { Company } from '../types';
import { validateCompanyId, validateUserId } from '../utils/validators';
import { mapToCompany } from '../utils/mappers';

/**
 * Obtiene una compañía por su ID
 *
 * @param companyId - ID de la compañía a obtener
 * @param userId - ID del usuario (debe ser el propietario)
 * @returns La compañía si existe y el usuario tiene permiso
 * @throws Error si la compañía no existe o el usuario no tiene permiso
 */
export async function getCompanyService(companyId: number, userId: number): Promise<Company> {
  validateCompanyId(companyId);
  validateUserId(userId);

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))
    .limit(1);

  if (!company) {
    throw new Error('Company not found');
  }

  if (company.ownerId !== userId) {
    throw new Error('Access denied');
  }

  return mapToCompany(company);
}

export type { Company } from '../types';
