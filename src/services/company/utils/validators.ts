/**
 * Validadores compartidos para servicios de Company
 */

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
 * Valida la URL del logo (opcional)
 */
export function validateLogoUrl(logoUrl: string | null | undefined): void {
  if (logoUrl === null || logoUrl === undefined) {
    return; // Válido
  }

  if (typeof logoUrl !== 'string') {
    throw new Error('Logo URL must be a string');
  }
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
