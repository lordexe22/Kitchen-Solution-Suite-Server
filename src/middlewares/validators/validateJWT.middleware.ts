// src/middlewares/validators/validateJWT.middleware.ts

/**
 * MIDDLEWARE DE VALIDACIÓN JWT
 * 
 * Valida el token JWT de la cookie y agrega req.user con la información del usuario.
 * Debe aplicarse a todas las rutas protegidas que requieren autenticación.
 * 
 * Uso:
 * app.use('/api/dashboard', validateJWTMiddleware, dashboardRouter);
 */

// #section Imports
import { Request, Response, NextFunction } from 'express';
import { getJWTFromCookie, decodeJWT } from '../../lib/modules/jwtCookieManager';
import type { AuthenticatedRequest, JWTPayload } from './validateJWT.types';
// #end-section

/**
 * Middleware que valida el JWT de la cookie y agrega req.user
 * 
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función next de Express
 * 
 * Flujo:
 * 1. Extrae JWT de cookie
 * 2. Decodifica y valida el token
 * 3. Valida que el payload tenga userId y state
 * 4. Verifica que el usuario no esté suspendido
 * 5. Agrega req.user = { id, state }
 * 6. Continúa a la siguiente operación
 * 
 * Respuestas de error:
 * - 401: Token ausente, inválido o expirado
 * - 403: Usuario suspendido
 * 
 * @example
 * // En server.ts
 * app.use('/api/dashboard', validateJWTMiddleware, dashboardRouter);
 * 
 * // En un middleware posterior
 * const userId = (req as AuthenticatedRequest).user.id;
 */
export const validateJWTMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // #step 1 - Extraer token de cookie
    const token = getJWTFromCookie(req.cookies);
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: No authentication token provided' 
      });
      return;
    }
    // #end-step

    // #step 2 - Decodificar y validar token
    let payload: any;
    try {
      payload = decodeJWT(token);
    } catch (err: any) {
      const message = (err && err.message) || '';
      
      if (message.includes('expired')) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized: Token expired' 
        });
        return;
      }
      
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid token' 
      });
      return;
    }
    // #end-step

    // #step 3 - Validar estructura del payload
    if (!payload || typeof payload !== 'object') {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid token payload' 
      });
      return;
    }

    const userId = Number(payload.userId);
    const userState = payload.state;

    if (!Number.isFinite(userId) || userId <= 0) {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid user ID in token' 
      });
      return;
    }

    if (!userState || !['pending', 'active', 'suspended'].includes(userState)) {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid user state in token' 
      });
      return;
    }
    // #end-step

    // #step 4 - Verificar que el usuario no esté suspendido
    if (userState === 'suspended') {
      res.status(403).json({ 
        success: false, 
        error: 'Forbidden: User account is suspended' 
      });
      return;
    }
    // #end-step

    // #step 5 - Agregar usuario autenticado a req.user
    (req as AuthenticatedRequest).user = {
      id: userId,
      state: userState as 'pending' | 'active' | 'suspended'
    };
    // #end-step

    // #step 6 - Continuar a la siguiente operación
    next();
    // #end-step

  } catch (error) {
    console.error('Error in validateJWTMiddleware:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication' 
    });
  }
};
