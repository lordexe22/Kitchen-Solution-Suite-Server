/**
 * Servicio: Obtener Todas las Compañías del Usuario
 *
 * Obtiene todas las compañías asociadas a un usuario específico.
 * Soporta filtrado por estado (activas/archivadas) y paginación optimizada.
 */

import { db } from '../../../db/init';
import { companiesTable } from '../../../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { Company, CompanyState } from '../types';
import { validateUserId, validatePagination, validateCompanyState } from '../utils/validators';
import { mapToCompany } from '../utils/mappers';

/**
 * Opciones de filtrado y paginación
 */
export interface GetAllCompaniesOptions {
  /** Filtrar por estado de la compañía (null = todas) */
  state?: CompanyState | null;
  /** Número de página (comenzando en 1) */
  page?: number;
  /** Cantidad de registros por página */
  limit?: number;
}

/**
 * Resultado paginado de compañías
 */
export interface PaginatedCompaniesResult {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Obtiene todas las compañías de un usuario con paginación
 *
 * @param userId - ID del usuario propietario de las compañías
 * @param options - Opciones de filtrado y paginación
 * @returns Resultado paginado con las compañías y metadatos
 */
export async function getAllCompaniesService(
  userId: number,
  options: GetAllCompaniesOptions = {}
): Promise<PaginatedCompaniesResult> {
  validateUserId(userId);
  validatePagination(options.page, options.limit);
  validateCompanyState(options.state);

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const offset = (page - 1) * limit;

  // Construir condiciones de filtro
  const conditions = [eq(companiesTable.ownerId, userId)];

  if (options.state) {
    conditions.push(eq(companiesTable.state, options.state));
  }

  // Query optimizada: obtener registros y total en una sola query usando window function
  const companiesWithCount = await db
    .select({
      // Todos los campos de la compañía
      id: companiesTable.id,
      name: companiesTable.name,
      description: companiesTable.description,
      ownerId: companiesTable.ownerId,
      logoUrl: companiesTable.logoUrl,
      state: companiesTable.state,
      archivedAt: companiesTable.archivedAt,
      createdAt: companiesTable.createdAt,
      updatedAt: companiesTable.updatedAt,
      // COUNT total usando window function
      totalCount: sql<number>`COUNT(*) OVER()::int`.as('total_count'),
    })
    .from(companiesTable)
    .where(and(...conditions))
    .orderBy(desc(companiesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const total = companiesWithCount[0]?.totalCount || 0;
  const companies = companiesWithCount.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    ownerId: record.ownerId,
    logoUrl: record.logoUrl,
    state: record.state,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  return {
    companies,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}


export type { Company } from '../types';
