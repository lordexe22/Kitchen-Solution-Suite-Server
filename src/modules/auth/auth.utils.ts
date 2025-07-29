// src/modules/auth/auth.utils.ts
// #section Imports
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.config';
// #end-section
// #function isTokenValid - Returns true if the JWT is valid, false otherwise
export const isTokenValid = (token: string | null): boolean => {
  try {
    if (!token) return false;
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
// #end-function
// #function getTokenFromHeader - Extracts the JWT from the Authorization header and returns it
export const getTokenFromHeader = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
// #end-function
// #function getTokenPayload - Returns the JWT payload if valid, or null otherwise
export const getTokenPayload = <T = any>(token: string | null): T | null => {
  try {
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET) as T;
    return payload;
  } catch {
    return null;
  }
}
// #end-function
