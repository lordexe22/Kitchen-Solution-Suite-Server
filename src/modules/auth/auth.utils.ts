// src/modules/auth/auth.utils.ts
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.config';

// #function isTokenValid
export const isTokenValid = (token: string): boolean => {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
// #end-function
// #function getTokenFromHeader
export const getTokenFromHeader = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
// #end-function
// #function getTokenPayload
export const getTokenPayload = <T = any>(token: string): T | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as T;
    return payload;
  } catch {
    return null;
  }
}
// #end-function