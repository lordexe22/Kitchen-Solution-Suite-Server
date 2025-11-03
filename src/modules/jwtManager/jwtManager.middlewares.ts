/* src/modules/jwtManager/jwtManager.middlewares.ts */
// #section imports
import { Response, NextFunction } from 'express';
import { verifyJWT, getJWTFromCookie, getTokenFromHeader, isTokenValid } from './jwtManager.utils';
import type { JWTPayload, AuthenticatedRequest } from './jwtManager.types';
// #end-section

// #middleware authenticateJWT
/**
 * Middleware de autenticación obligatoria mediante JWT.
 * 
 * Verifica que exista un token válido en cookies o en el header Authorization.
 * Si el token es válido, adjunta el payload decodificado en req.user.
 * Si no hay token o es inválido, retorna 401 Unauthorized.
 * 
 * @param {AuthenticatedRequest} req - Request con user opcional
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar al siguiente middleware
 * 
 * @returns {Response | void} 401 si no hay token válido, o continúa al siguiente middleware
 * 
 * @example
 * // Proteger una ruta
 * router.get('/protected', authenticateJWT, (req, res) => {
 *   const userId = req.user.userId;
 *   res.json({ message: `Hello user ${userId}` });
 * });
 */
export const authenticateJWT = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Response | void => {
  let token = getJWTFromCookie(req);
  
  if (!token) {
    token = getTokenFromHeader(req.headers.authorization);
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required' 
    });
  }
  
  try {
    const payload = verifyJWT(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};
// #end-middleware

// #middleware optionalAuth
/**
 * Middleware de autenticación opcional mediante JWT.
 * 
 * Intenta verificar el token si existe, pero permite continuar
 * incluso si no hay token o es inválido.
 * Si el token es válido, adjunta el payload en req.user.
 * Si no lo es, req.user queda como undefined.
 * 
 * @param {AuthenticatedRequest} req - Request con user opcional
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar al siguiente middleware
 * 
 * @example
 * // Ruta con contenido diferente para usuarios autenticados
 * router.get('/public', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     res.json({ message: `Welcome back, user ${req.user.userId}` });
 *   } else {
 *     res.json({ message: 'Welcome, guest' });
 *   }
 * });
 */
export const optionalAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  const token = getJWTFromCookie(req) || getTokenFromHeader(req.headers.authorization);
  
  if (token && isTokenValid(token)) {
    try {
      const payload = verifyJWT(token);
      req.user = payload;
    } catch {
      req.user = undefined;
    }
  }
  
  next();
};
// #end-middleware

// #middleware validateJWTAndGetPayload
/**
 * Middleware que valida el JWT y extrae el payload completo.
 * 
 * Similar a authenticateJWT, pero con nombre más descriptivo.
 * Usado comúnmente en módulos que requieren datos del usuario autenticado.
 * 
 * @param {AuthenticatedRequest} req - Request con user opcional
 * @param {Response} res - Response de Express
 * @param {NextFunction} next - Función para continuar al siguiente middleware
 * 
 * @returns {Response | void} 401 si no hay token válido, o continúa al siguiente middleware
 * 
 * @example
 * // Usar en rutas de módulos específicos
 * router.post('/companies/create', validateJWTAndGetPayload, createCompany);
 * 
 * // Acceder al payload en el handler
 * export const createCompany = async (req: AuthenticatedRequest, res: Response) => {
 *   const userId = req.user!.userId; // El ! indica que user existe (gracias al middleware)
 *   // ... lógica del handler
 * };
 */
export const validateJWTAndGetPayload = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  let token = getJWTFromCookie(req);

  if (!token) {
    token = getTokenFromHeader(req.headers.authorization);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const payload = verifyJWT(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
// #end-middleware