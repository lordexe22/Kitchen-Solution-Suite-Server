/**
 * Servicio: Modificar Compañía
 *
 * Actualiza los datos de una compañía existente con transacciones.
 * Usa FOR UPDATE para prevenir race conditions.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { normalizeCompanyName } from '../constants';
import type { Company, UpdateCompanyInput } from '../types';
import {
  validateCompanyId,
  validateUserId,
  validateCompanyName,
  validateCompanyDescription,
  validateLogoUrl,
} from '../utils/validators';
import { mapToCompany } from '../utils/mappers';
import { handleDatabaseError } from '../utils/error-handler';

/**
 * Modifica una compañía existente
 *
 * @param companyId - ID de la compañía a modificar
 * @param userId - ID del usuario (debe ser el propietario)
 * @param input - Datos a actualizar
 * @returns La compañía actualizada
 * @throws Error si la compañía no existe, el usuario no tiene permiso, o hay validaciones fallidas
 */
export async function updateCompanyService(
  companyId: number,
  userId: number,
  input: UpdateCompanyInput
): Promise<Company> {
  validateInput(companyId, userId, input);

  try {
    return await db.transaction(async (tx) => {
      // SELECT FOR UPDATE previene modificaciones concurrentes
      const [existingCompany] = await tx
        .select({
          id: companiesTable.id,
          name: companiesTable.name,
          ownerId: companiesTable.ownerId,
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

      // Preparar datos a actualizar
      const updateData: Record<string, any> = {};

      if (input.name !== undefined) {
        const normalizedNewName = normalizeCompanyName(input.name);
        // Solo actualizar si el nombre realmente cambió
        if (normalizedNewName !== existingCompany.name) {
          updateData.name = normalizedNewName;
        }
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.logoUrl !== undefined) {
        updateData.logoUrl = input.logoUrl;
      }

      // Si no hay cambios, obtener la compañía completa y retornar
      if (Object.keys(updateData).length === 0) {
        const [fullCompany] = await tx
          .select()
          .from(companiesTable)
          .where(eq(companiesTable.id, companyId));
        return mapToCompany(fullCompany);
      }

      // Agregar fecha de actualización
      updateData.updatedAt = new Date();

      // Actualizar la compañía
      const [updatedCompany] = await tx
        .update(companiesTable)
        .set(updateData)
        .where(eq(companiesTable.id, companyId))
        .returning();

      if (!updatedCompany) {
        throw new Error('Failed to update company');
      }

      return mapToCompany(updatedCompany);
    });
  } catch (error: any) {
    // Drizzle envuelve los errores de PostgreSQL en error.cause
    const dbError = error.cause || error;
    
    // Manejar unique constraint violation
    if (dbError.code === '23505' || 
        dbError.constraint === 'companies_name_unique' ||
        (dbError.message && dbError.message.includes('duplicate key')) ||
        (dbError.message && dbError.message.includes('companies_name_unique'))) {
      throw new Error('Nombre no disponible');
    }
    
    // Si el error ya tiene un mensaje amigable, usarlo
    if (error.message && !error.code && !error.cause) {
      throw error;
    }
    
    handleDatabaseError(dbError, 'company update');
  }
}

/**
 * Valida los parámetros de entrada
 */
function validateInput(companyId: number, userId: number, input: UpdateCompanyInput): void {
  validateCompanyId(companyId);
  validateUserId(userId);

  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body');
  }

  if (input.name !== undefined) {
    validateCompanyName(input.name);
  }

  if (input.description !== undefined) {
    validateCompanyDescription(input.description);
  }

  if (input.logoUrl !== undefined) {
    validateLogoUrl(input.logoUrl);
  }
}

export type { Company, UpdateCompanyInput } from '../types';
