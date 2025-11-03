/* src\modules\jwtManager\jwtManager.middlewares.ts */
// #section imports
import { Request, Response, NextFunction } from 'express';
import { verifyJWT, getJWTFromCookie, getTokenFromHeader, isTokenValid } from './jwtManager.utils';
import type { JWTPayload } from './jwtManager.types';
// #end-section
// #section declare global
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
// #end-section
// #middleware authenticateJWT
export const authenticateJWT = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
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
export const optionalAuth = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
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