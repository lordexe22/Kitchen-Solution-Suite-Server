// src/modules/auth/auth.middlewares.ts
// #section Imports
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.types';
import { getTokenFromHeader, isTokenValid, getTokenPayload } from './auth.utils';
// #end-section
// #function requireAuth - Validates the JWT, extracts the user payload and assigns it to req.user
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // #variable - authHeader, token, isValid, payload
  const authHeader = req.headers.authorization;
  const token = getTokenFromHeader(authHeader);
  const isValid = isTokenValid(token);
  const payload = getTokenPayload(token) as AuthenticatedRequest['user'];
  // #end-variable
  // #step 1 - Check for token existence
  if (!token) {
    return res.status(401).json({ error: 'Invalid or missing authorization header' });
  }
    // #end-step
  // #step 2 - Check token validity
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  // #end-step
  // #step 3 - Check if the payload is decodable
  if (!payload) {
    return res.status(401).json({ error: 'Failed to decode token payload' });
  }
  // #end-step
  // #step 4 - Assign payload to req.user
  req.user = payload;
  // #end-step
  // #step 5 - Call next() to proceed to the next middleware function
  next();
  // #end-step
}
// #end-function