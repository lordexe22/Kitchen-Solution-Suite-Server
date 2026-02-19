// src/services/company/constants.ts

/**
 * Constantes para el dominio de Compañías
 */

export const COMPANY_STATES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const COMPANY_STATE_VALUES = ['active', 'archived'] as const;

/**
 * Verifica si un valor es un estado válido de compañía
 */
export function isValidCompanyState(value: unknown): value is 'active' | 'archived' {
  return COMPANY_STATE_VALUES.includes(value as any);
}

/**
 * Sanitiza el nombre de compañía para guardar en BD.
 * Preserva el case original del usuario.
 * - Trim: elimina espacios al inicio y final
 * - Múltiples espacios se reducen a uno
 */
export function sanitizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Normaliza el nombre de compañía para comparaciones de unicidad.
 * Solo para queries de búsqueda, NUNCA para guardar en BD.
 * - Trim + lowercase + colapsar espacios
 */
export function normalizeForComparison(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
