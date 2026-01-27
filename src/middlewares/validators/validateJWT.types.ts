// src/middlewares/validators/validateJWT.types.ts

/**
 * Tipos para el middleware de validación JWT
 */

import type { Request } from 'express';

/**
 * Payload del JWT decodificado
 */
export interface JWTPayload {
  userId: number;
  state: 'pending' | 'active' | 'suspended';
}

/**
 * Datos del usuario autenticado agregados a req.user
 */
export interface AuthUser {
  id: number;
  state: 'pending' | 'active' | 'suspended';
}

/**
 * Request de Express con usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
