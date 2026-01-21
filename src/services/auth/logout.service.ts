// src/services/auth/logout.service.ts

/**
 * Servicio de cierre de sesión (logout)
 * 
 * Responsabilidad: Limpiar la sesión del usuario eliminando el JWT de la cookie.
 * Este servicio es independiente de Express y puede ser reutilizado en cualquier contexto.
 */

// #section Imports
import { clearJWTCookie, CookieData } from '../../lib/modules/jwtCookieManager';
// #end-section

// #section Types
export interface LogoutResult {
  statusCode: 'SUCCESS';
  cookieClearData: CookieData;
}
// #end-section

// #service logoutService
/**
 * Servicio principal de logout.
 * 
 * Flujo:
 * 1. Preparar datos para limpiar la cookie
 * 2. Retornar instrucción de limpieza
 * 
 * @returns Objeto con datos para limpiar la cookie
 */
export function logoutService(): LogoutResult {
  // Paso 1: preparar datos para limpiar la cookie
  const cookieClearData = clearJWTCookie();

  // Paso 2: retornar resultado
  return {
    statusCode: 'SUCCESS',
    cookieClearData,
  };
}
// #end-service
