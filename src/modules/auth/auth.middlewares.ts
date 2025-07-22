// src/modules/auth/auth.middlewares.ts
// #section imports
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
import { getTokenFromHeader, isTokenValid, getTokenPayload } from './auth.utils';
// #end-section
// #function requireAuth - Valida el JWT, extrae el payload del usuario y lo asigna a req.user
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // #variable - authHeader, token, isValid, payload
  const authHeader = req.headers.authorization;
  const token = getTokenFromHeader(authHeader);
  const isValid = isTokenValid(token);
  const payload = getTokenPayload(token) as AuthenticatedRequest['user'];
  // #end-variable
   // #step 1 - Verifica la existencia del token
  if (!token) {
    return res.status(401).json({ error: 'Invalid or missing authorization header' });
  }
    // #end-step
  // #step 2 - Verifica la validez del token
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  // #end-step
  // #step 3 - Verifica que el payload sea decodificable
  if (!payload) {
    return res.status(401).json({ error: 'Failed to decode token payload' });
  }
  // #end-step
  // #step 4 - Asigna el payload a req.user
  req.user = payload;
  // #end-step
  // #step 5 - Llama a next() para continuar con la siguiente función middleware
  next();
  // #end-step
}
// #end-function