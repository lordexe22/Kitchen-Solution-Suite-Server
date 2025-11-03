/* src/modules/jwtManager/jwtManager.utils.ts */
// #section imports
import jwt, { SignOptions, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import type { Request, Response } from 'express';
import type { JWTPayload, JWTExpiration } from './jwtManager.types';
import { SECRET, JWT_CONFIG } from './jwtManager.config';
// #end-section

// #function signJWT
/**
 * Genera un token JWT firmado con el payload proporcionado.
 * 
 * @param {JWTPayload} payload - Datos a incluir en el token (userId obligatorio)
 * @param {JWTExpiration} [expiresIn='30d'] - Tiempo de expiración del token
 * 
 * @returns {string} Token JWT firmado
 * 
 * @throws {Error} Si el payload es inválido o falta el SECRET
 * 
 * @example
 * // Token con expiración por defecto (30 días)
 * const token = signJWT({ userId: 123 });
 * 
 * @example
 * // Token con expiración personalizada
 * const shortToken = signJWT({ userId: 123, email: 'user@example.com' }, '15m');
 * const longToken = signJWT({ userId: 123 }, '90d');
 */
export const signJWT = (
  payload: JWTPayload, 
  expiresIn: JWTExpiration = JWT_CONFIG.defaultExpiration
): string => {
  if (!payload.userId) {
    throw new Error('JWT payload must include userId');
  }

  const options = { expiresIn } as unknown as SignOptions;
  return jwt.sign({ ...payload }, SECRET, options);
};
// #end-function

// #function verifyJWT
/**
 * Verifica y decodifica un token JWT.
 * 
 * @param {string} token - Token JWT a verificar
 * 
 * @returns {JWTPayload} Payload decodificado del token
 * 
 * @throws {TokenExpiredError} Si el token ha expirado
 * @throws {JsonWebTokenError} Si el token es inválido o está mal formado
 * @throws {Error} Si el token no contiene userId
 * 
 * @example
 * try {
 *   const payload = verifyJWT(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   if (error instanceof TokenExpiredError) {
 *     console.error('Token expired');
 *   } else {
 *     console.error('Invalid token');
 *   }
 * }
 */
export const verifyJWT = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    
    if (!decoded.userId) {
      throw new Error('JWT payload missing userId');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('Invalid token signature or format');
    }
    throw error;
  }
};
// #end-function

// #function isTokenValid
/**
 * Verifica si un token JWT es válido sin lanzar excepciones.
 * 
 * Útil para validaciones opcionales donde no se requiere el payload.
 * 
 * @param {string | null} token - Token JWT a validar
 * 
 * @returns {boolean} true si el token es válido, false en caso contrario
 * 
 * @example
 * const token = req.cookies.auth_token;
 * if (isTokenValid(token)) {
 *   console.log('Token is valid');
 * } else {
 *   console.log('Token is invalid or expired');
 * }
 */
export const isTokenValid = (token: string | null): boolean => {
  try {
    if (!token) return false;
    jwt.verify(token, SECRET);
    return true;
  } catch {
    return false;
  }
};
// #end-function

// #function getTokenFromHeader
/**
 * Extrae el token JWT del header Authorization.
 * 
 * Espera el formato: "Bearer <token>"
 * 
 * @param {string} [headerValue] - Valor del header Authorization
 * 
 * @returns {string | null} Token extraído o null si no existe o formato inválido
 * 
 * @example
 * // En un middleware
 * const token = getTokenFromHeader(req.headers.authorization);
 * if (token) {
 *   const payload = verifyJWT(token);
 * }
 * 
 * @example
 * // Headers válidos
 * getTokenFromHeader('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
 * // -> 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 * // Headers inválidos
 * getTokenFromHeader('Basic xyz') // -> null
 * getTokenFromHeader('Bearer')    // -> null
 * getTokenFromHeader(undefined)   // -> null
 */
export const getTokenFromHeader = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  
  const parts = headerValue.trim().split(/\s+/); // ⬅️ Cambio: trim() y split por espacios múltiples
  
  if (parts.length !== 2) return null; // ⬅️ Cambio: debe tener exactamente 2 partes
  
  const [type, token] = parts;
  
  if (type !== 'Bearer' || !token) return null;
  
  return token;
};
// #end-function

// #function setJWTCookie
/**
 * Establece una cookie HTTP-only con el token JWT.
 * 
 * La cookie es segura (HTTPS en producción), HttpOnly (no accesible desde JS),
 * y tiene protección CSRF mediante SameSite.
 * 
 * @param {Response} res - Response de Express
 * @param {string} token - Token JWT a guardar en la cookie
 * 
 * @returns {void}
 * 
 * @example
 * // En un handler de login
 * export const loginHandler = (req: Request, res: Response) => {
 *   const user = authenticateUser(req.body);
 *   const token = signJWT({ userId: user.id });
 *   setJWTCookie(res, token);
 *   res.json({ success: true, user });
 * };
 */
export const setJWTCookie = (res: Response, token: string): void => {
  res.cookie(JWT_CONFIG.cookieName, token, JWT_CONFIG.cookieOptions);
};
// #end-function

// #function clearJWTCookie
/**
 * Elimina la cookie de autenticación JWT.
 * 
 * Usado típicamente en logout para invalidar la sesión del usuario.
 * 
 * @param {Response} res - Response de Express
 * 
 * @returns {void}
 * 
 * @example
 * // En un handler de logout
 * export const logoutHandler = (req: Request, res: Response) => {
 *   clearJWTCookie(res);
 *   res.json({ success: true, message: 'Logged out successfully' });
 * };
 */
export const clearJWTCookie = (res: Response): void => {
  res.clearCookie(JWT_CONFIG.cookieName, {
    path: JWT_CONFIG.cookieOptions.path,
  });
};
// #end-function

// #function getJWTFromCookie
/**
 * Extrae el token JWT desde las cookies de la request.
 * 
 * Requiere que cookie-parser esté configurado en el servidor.
 * 
 * @param {Request} req - Request de Express
 * 
 * @returns {string | null} Token extraído o null si no existe
 * 
 * @example
 * // En un middleware
 * const token = getJWTFromCookie(req);
 * if (token) {
 *   const payload = verifyJWT(token);
 *   req.user = payload;
 * }
 */
export const getJWTFromCookie = (req: Request): string | null => {
  if (!req.cookies) {
    console.warn('⚠️ req.cookies is undefined. Ensure cookie-parser middleware is configured.');
    return null;
  }
  return req.cookies[JWT_CONFIG.cookieName] || null;
};
// #end-function

// #function hasJWTCookie
/**
 * Verifica si existe una cookie de autenticación JWT en la request.
 * 
 * No valida si el token es válido, solo verifica su presencia.
 * 
 * @param {Request} req - Request de Express
 * 
 * @returns {boolean} true si existe la cookie, false en caso contrario
 * 
 * @example
 * // Verificar si el usuario tiene sesión
 * if (hasJWTCookie(req)) {
 *   console.log('User has authentication cookie');
 * } else {
 *   console.log('User is not authenticated');
 * }
 */
export const hasJWTCookie = (req: Request): boolean => {
  return getJWTFromCookie(req) !== null;
};
// #end-function