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
 * Normalización de nombres de compañía para búsqueda
 * - Trim: elimina espacios al inicio y final
 * - Lowercase: convierte a minúsculas
 * - Múltiples espacios se reducen a uno
 */
export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
