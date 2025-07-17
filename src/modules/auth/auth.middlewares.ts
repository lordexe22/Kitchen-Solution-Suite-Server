// src/modules/auth/auth.middlewares.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
import { getTokenFromHeader, isTokenValid, getTokenPayload } from './auth.utils';

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;

  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Invalid or missing authorization header' });
  }

  const isValid = isTokenValid(token);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const payload = getTokenPayload(token);

  if (!payload) {
    return res.status(401).json({ error: 'Failed to decode token payload' });
  }

  req.user = payload;

  next();
}
