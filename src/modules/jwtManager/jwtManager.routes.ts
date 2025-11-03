/* src/modules/jwtManager/jwtManager.routes.ts */
// #section imports
import { Router, Request, Response } from 'express';
import { verifyJWT, signJWT, getJWTFromCookie, setJWTCookie, clearJWTCookie } from './jwtManager.utils';
import { authenticateJWT } from './jwtManager.middlewares';
import type { AuthenticatedRequest } from './jwtManager.types';
// #end-section

// #variable router
/**
 * Router para las rutas de gestión de JWT.
 * 
 * Rutas disponibles:
 * - POST /refresh - Refresca un token expirado
 * - POST /logout - Cierra sesión y limpia la cookie
 */
const router = Router();
// #end-variable

// #route POST /refresh
/**
 * Ruta para refrescar un token JWT.
 * 
 * Toma el token existente desde la cookie, verifica que sea válido,
 * y genera uno nuevo con expiración extendida.
 * 
 * @route POST /refresh
 * @access Public (requiere token válido en cookie)
 * 
 * @returns {200} Token refrescado exitosamente
 * @returns {401} No hay token o token inválido
 * 
 * @example
 * // Desde el cliente
 * fetch('/api/jwt/refresh', {
 *   method: 'POST',
 *   credentials: 'include' // Importante para enviar cookies
 * })
 * .then(res => res.json())
 * .then(data => console.log(data.message));
 */
router.post('/refresh', (req: Request, res: Response) => {
  const oldToken = getJWTFromCookie(req);
  
  if (!oldToken) {
    return res.status(401).json({ 
      success: false,
      error: 'No token to refresh' 
    });
  }
  
  try {
    const payload = verifyJWT(oldToken);
    const newToken = signJWT({ userId: payload.userId }, '30d');
    setJWTCookie(res, newToken);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
});
// #end-route

// #route POST /logout
/**
 * Ruta para cerrar sesión.
 * 
 * Requiere autenticación válida (middleware authenticateJWT).
 * Elimina la cookie de autenticación del navegador.
 * 
 * @route POST /logout
 * @access Private (requiere autenticación)
 * 
 * @returns {200} Sesión cerrada exitosamente
 * @returns {401} No autenticado
 * 
 * @example
 * // Desde el cliente
 * fetch('/api/jwt/logout', {
 *   method: 'POST',
 *   credentials: 'include'
 * })
 * .then(res => res.json())
 * .then(data => console.log(data.message));
 */
router.post('/logout', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  clearJWTCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
// #end-route

export default router;