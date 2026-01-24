// src/services/auth/user.mapper.ts

/**
 * Utilidad para mapear registros de BD a estructura UserData
 * Centraliza la lógica de transformación de datos de usuario
 */

import type { UserData } from './types';

/**
 * Mapea un registro de usuario de la base de datos a la estructura UserData
 * que se retorna en respuestas HTTP.
 * 
 * @param user - Registro de usuario desde la BD (puede ser parcial)
 * @returns Objeto UserData con estructura consistente
 */
export function mapUserToUserData(user: any): UserData {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl ?? null,
    type: user.type,
    belongToCompanyId: user.belongToCompanyId ?? null,
    belongToBranchId: user.belongToBranchId ?? null,
    state: user.state,
  };
}
