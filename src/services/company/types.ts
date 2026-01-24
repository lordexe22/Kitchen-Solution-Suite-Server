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
 */
export interface CreateCompanyInput {
  name: string;
  description?: string;
  logoUrl?: string;
}

/**
 * Datos que se pueden actualizar en una compañía
 */
export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}
