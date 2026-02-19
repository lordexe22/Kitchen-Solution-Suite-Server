// src/services/company/types.ts

/**
 * Tipos e interfaces para el dominio de Compañías
 */

/**
 * Estados posibles de una compañía
 */
export type CompanyState = 'active' | 'archived';

/**
 * Interfaz que representa una compañía en la base de datos
 */
export interface Company {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  logoUrl: string | null;
  state: CompanyState;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Datos requeridos para crear una nueva compañía
 *
 * Campo logo:
 * - string  → asigna una URL directamente
 * - Buffer  → sube el archivo a Cloudinary y asigna la URL resultante
 * - omitido → la compañía se crea sin logo
 */
export interface CreateCompanyInput {
  name: string;
  description?: string;
  logo?: string | Buffer;
}

/**
 * Datos que se pueden actualizar en una compañía
 *
 * Campo logo:
 * - string  → asigna una URL directamente
 * - Buffer  → sube el archivo a Cloudinary y asigna la URL resultante
 * - null    → elimina el logo de Cloudinary y limpia logoUrl
 * - omitido → no modifica el logo
 */
export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  logo?: string | Buffer | null;
}
