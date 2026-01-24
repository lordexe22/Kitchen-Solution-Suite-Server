/**
 * Mapeadores compartidos para servicios de Company
 */

import type { Company } from '../types';

/**
 * Mapea un registro de BD a la interfaz Company
 */
export function mapToCompany(record: any): Company {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    ownerId: record.ownerId,
    logoUrl: record.logoUrl,
    state: record.state,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
