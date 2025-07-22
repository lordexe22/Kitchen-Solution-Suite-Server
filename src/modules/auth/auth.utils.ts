// src/modules/auth/auth.utils.ts
// #section imports
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.config';
// #end-section
// #function isTokenValid - Retorna true si el jwt es válido, false en caso contrario
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
// #function getTokenFromHeader - Extrae el jwt del encabezado Authorization y lo retorna
export const getTokenFromHeader = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}
// #end-function
// #function getTokenPayload - Retorna el payload (contenido) del jwt si es válido, o null en caso contrario
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