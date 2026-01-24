/**
 * Servicio: Crear Compañía
 *
 * Crea una nueva compañía y la asigna al usuario como propietario.
 * Usa la restricción única de BD como árbitro final para prevenir duplicados.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { normalizeCompanyName, COMPANY_STATES } from '../constants';
import type { Company, CreateCompanyInput } from '../types';
import {
  validateUserId,
  validateCompanyName,
  validateCompanyDescription,
  validateLogoUrl,
} from '../utils/validators';
import { mapToCompany } from '../utils/mappers';
import { handleDatabaseError } from '../utils/error-handler';
import { countUserCompanies } from '../utils/db-operations';

// Límite de compañías por usuario para prevenir abuso
const MAX_COMPANIES_PER_USER = 100;

/**
 * Crea una nueva compañía
 *
 * @param input - Datos de entrada para crear la compañía
 * @param userId - ID del usuario que creará la compañía (será el propietario)
 * @returns La compañía creada
 * @throws Error si el nombre ya existe, se alcanza el límite de compañías, o hay problemas con la BD
 */
export async function createCompanyService(input: CreateCompanyInput, userId: number): Promise<Company> {
  // Validaciones de entrada
  validateUserId(userId);
  validateInput(input);

  // Rate limiting: verificar límite de compañías por usuario
  const userCompanyCount = await countUserCompanies(userId);
  if (userCompanyCount >= MAX_COMPANIES_PER_USER) {
    throw new Error(
      `Maximum companies limit reached (${MAX_COMPANIES_PER_USER}). ` +
        'Please contact support to increase your limit.'
    );
  }

  const normalizedName = normalizeCompanyName(input.name);

  try {
    // Intentar crear la compañía - La BD es el árbitro final para nombres únicos
    const [createdCompany] = await db
      .insert(companiesTable)
      .values({
        name: normalizedName,
        description: input.description || null,
        ownerId: userId,
        logoUrl: input.logoUrl || null,
        state: COMPANY_STATES.ACTIVE,
        archivedAt: null,
      })
      .returning();

    if (!createdCompany) {
      throw new Error('Failed to create company');
    }

    return mapToCompany(createdCompany);
  } catch (error) {
    handleDatabaseError(error, 'company creation');
  }
}

/**
 * Valida los datos de entrada
 */
function validateInput(input: CreateCompanyInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body');
  }

  validateCompanyName(input.name);
  validateCompanyDescription(input.description);
  validateLogoUrl(input.logoUrl);
}

export type { Company, CreateCompanyInput } from '../types';
