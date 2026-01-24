/**
 * Servicio: Verificar Permisos sobre Compañía
 *
 * Valida si un usuario tiene permisos para acceder/modificar una compañía.
 * Actualmente solo verifica que sea el propietario.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Resultado de verificación de permisos
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
}

/**
 * Verifica si un usuario tiene permiso sobre una compañía
 *
 * @param companyId - ID de la compañía
 * @param userId - ID del usuario
 * @returns Objeto indicando si tiene permiso y razón si no
 */
export async function checkCompanyPermissionService(
  companyId: number,
  userId: number
): Promise<PermissionCheckResult> {
  validateInput(companyId, userId);

  // Obtener la compañía
  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))
    .limit(1);

  if (!company) {
    return {
      hasPermission: false,
      reason: 'Company not found',
    };
  }

  // Verificar que el usuario sea el propietario
  if (company.ownerId !== userId) {
    return {
      hasPermission: false,
      reason: 'User is not the owner',
    };
  }

  return {
    hasPermission: true,
  };
}

/**
 * Valida los parámetros de entrada
 *
 * @param companyId - ID de la compañía
 * @param userId - ID del usuario
 * @throws Error si los parámetros no son válidos
 */
function validateInput(companyId: number, userId: number): void {
  if (!Number.isFinite(companyId) || companyId <= 0) {
    throw new Error('Invalid company ID');
  }

  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('Invalid user ID');
  }
}
