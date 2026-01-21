// src/services/auth/autoLogin.service.ts

/**
 * Servicio de auto-login (autenticación por token JWT en cookie)
 * 
 * Responsabilidad: Autenticar usuarios mediante un token JWT existente en cookie.
 * Este servicio es independiente de Express y puede ser reutilizado en cualquier contexto.
 */

// #section Imports
import { getJWTFromCookie, decodeJWT, createJWT, setJWTCookie, CookieData } from '../../lib/modules/jwtCookieManager';
import { db } from '../../db/init';
import { usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { mapUserToUserData } from './user.mapper';
import { Request } from 'express';
// #end-section

// #section Types
export type AutoLoginPayload = Request;

export type AutoLoginStatusCode =
  | 'NO_TOKEN'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'USER_NOT_FOUND'
  | 'USER_SUSPENDED'
  | 'SUCCESS';

export interface AutoLoginResult {
  user?: UserData;
  statusCode: AutoLoginStatusCode;
  cookieData?: CookieData;
}

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  type: 'admin' | 'employee' | 'guest' | 'ownership';
  belongToCompanyId: number | null;
  belongToBranchId: number | null;
  state: 'pending' | 'active' | 'suspended';
}
// #end-section

// #service autoLoginService
/**
 * Servicio principal de auto-login.
 * 
 * Flujo (pendiente de diseñar):
 * 1. Extraer token JWT de cookie
 * 2. Validar y decodificar token
 * 3. Buscar usuario en BD
 * 4. Retornar datos del usuario
 * 
 * @param payload - Datos para auto-login (pendiente de definir)
 * @returns Objeto con datos del usuario autenticado
 * @throws Error si el token es inválido o el usuario no existe
 */
export async function autoLoginService(req: AutoLoginPayload): Promise<AutoLoginResult> {
  // Paso 1: extraer token de cookie
  const token = getJWTFromCookie((req as any).cookies);
  if (!token) {
    return buildFailure('NO_TOKEN');
  }

  // Paso 2: decodificar y validar token
  let payload: any;
  try {
    payload = decodeJWT(token);
  } catch (err: any) {
    const message = (err && err.message) || '';
    const code: AutoLoginStatusCode = message.includes('expired') ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
    return buildFailure(code);
  }

  if (!payload || typeof payload !== 'object' || !(payload as any).userId) {
    return buildFailure('INVALID_TOKEN');
  }

  const userId = Number((payload as any).userId);
  if (!Number.isFinite(userId)) {
    return buildFailure('INVALID_TOKEN');
  }

  // Paso 3: buscar usuario en BD
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return buildFailure('USER_NOT_FOUND');
  }

  if (user.state === 'suspended') {
    return buildFailure('USER_SUSPENDED');
  }

  // Paso 4: mapear datos del usuario
  const userData = mapUserToUserData(user);

  // Paso 5: crear JWT nuevo con datos actualizados de la BD
  const newToken = createJWT({ userId: user.id });
  const cookieData = setJWTCookie(newToken);

  // Paso 6: retornar éxito con usuario y cookie refrescada
  return { user: userData, statusCode: 'SUCCESS', cookieData };
}
// #end-service

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES INTERNAS (privadas al servicio)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildFailure(statusCode: AutoLoginStatusCode): AutoLoginResult {
  return {
    statusCode,
  };
}
