import type { UserType, UserState } from './types';

/**
 * Objeto que contiene todos los tipos de usuario válidos
 */
export const USER_TYPES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  GUEST: 'guest',
  OWNERSHIP: 'ownership',
} as const;

/**
 * Objeto que contiene todos los estados de usuario válidos
 */
export const USER_STATES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

/**
 * Plataformas de autenticación soportadas
 */
export const AUTH_PLATFORMS = {
  LOCAL: 'local',
  GOOGLE: 'google',
} as const;

/**
 * Validar si un tipo de usuario es válido
 * @param type - El tipo de usuario a validar
 * @returns true si el tipo es válido, false en caso contrario
 */
export function isValidUserType(type: unknown): type is UserType {
  return Object.values(USER_TYPES).includes(type as UserType);
}

/**
 * Validar si un estado de usuario es válido
 * @param state - El estado del usuario a validar
 * @returns true si el estado es válido, false en caso contrario
 */
export function isValidUserState(state: unknown): state is UserState {
  return Object.values(USER_STATES).includes(state as UserState);
}

/**
 * Normalizar email: trim y lowercase
 * @param email - El email a normalizar
 * @returns Email normalizado
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
