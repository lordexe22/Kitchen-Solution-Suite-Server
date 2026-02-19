/**
 * Validadores compartidos para servicios de Company
 */

import { isImageBuffer } from '../../../lib/modules/cloudinary';

/**
 * Valida que un ID de compañía sea válido
 */
export function validateCompanyId(id: number): void {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid company ID');
  }
}

/**
 * Valida que un ID de usuario sea válido
 */
export function validateUserId(id: number): void {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid user ID');
  }
}

/**
 * Valida el nombre de una compañía
 */
export function validateCompanyName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Company name is required and must be a string');
  }

  if (name.trim().length === 0) {
    throw new Error('Company name cannot be empty');
  }

  if (name.length > 255) {
    throw new Error('Company name must be 255 characters or less');
  }
}

/**
 * Valida la descripción de una compañía (opcional)
 */
export function validateCompanyDescription(description: string | null | undefined): void {
  if (description === null || description === undefined) {
    return; // Válido
  }

  if (typeof description !== 'string') {
    throw new Error('Company description must be a string');
  }

  if (description.length > 1000) {
    throw new Error('Company description must be 1000 characters or less');
  }
}

/**
 * Tamaño máximo permitido para un logo (5 MB)
 */
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Valida el campo logo (opcional).
 *
 * Valores válidos:
 * - undefined / null → no logo o eliminar logo
 * - string → URL (vacío se interpreta como "sin logo" en create, "eliminar" en update)
 * - Buffer → archivo a subir (se valida tamaño y formato de imagen)
 *
 * La validación de formato de imagen delega al módulo de Cloudinary
 * vía `isImageBuffer()`. Es un fail-fast local antes del upload.
 */
export function validateLogo(logo: unknown): void {
  if (logo === undefined || logo === null) return;

  if (Buffer.isBuffer(logo)) {
    if (logo.length === 0) {
      throw new Error('Logo file cannot be empty');
    }
    if (logo.length > MAX_LOGO_SIZE_BYTES) {
      throw new Error(`Logo file exceeds maximum size of ${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB`);
    }
    if (!isImageBuffer(logo)) {
      throw new Error('Logo file is not a supported image format');
    }
    return;
  }

  if (typeof logo === 'string') return;

  throw new Error('Logo must be a string URL, a file Buffer, or null');
}

/**
 * Valida opciones de paginación
 */
export function validatePagination(page?: number, limit?: number): void {
  if (page !== undefined && (!Number.isFinite(page) || page < 1)) {
    throw new Error('Page must be a positive number');
  }

  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    throw new Error('Limit must be a positive number');
  }
}

/**
 * Valida que el estado sea válido
 */
export function validateCompanyState(state?: string | null): void {
  if (state && !['active', 'archived'].includes(state)) {
    throw new Error('Invalid state value');
  }
}
