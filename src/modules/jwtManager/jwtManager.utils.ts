/* src\modules\jwtManager\jwtManager.utils.ts */
// #section imports
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Request, Response } from 'express';
import type { JWTPayload, JWTExpiration } from './jwtManager.types';
import { SECRET, JWT_CONFIG } from './jwtManager.config';
// #end-section
// #function signJWT
export const signJWT = (
  payload: JWTPayload, 
  expiresIn: JWTExpiration = JWT_CONFIG.defaultExpiration
): string => {
  const options = { expiresIn } as unknown as SignOptions;
  return jwt.sign({ ...payload }, SECRET, options);
};
// #end-function
// #function verifyJWT
export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};
// #end-function
// #function isTokenValid
export const isTokenValid = (token: string | null): boolean => {
  try {
    if (!token) return false;
    jwt.verify(token, SECRET);
    return true;
  } catch {
    return false;
  }
};
// #end-function
// #function getTokenFromHeader
export const getTokenFromHeader = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const [type, token] = headerValue.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
};
// #end-function
// #function setJWTCookie
export const setJWTCookie = (res: Response, token: string): void => {
  res.cookie(JWT_CONFIG.cookieName, token, JWT_CONFIG.cookieOptions);
};
// #end-function
// #function clearJWTCookie
export const clearJWTCookie = (res: Response): void => {
  res.clearCookie(JWT_CONFIG.cookieName, {
    path: JWT_CONFIG.cookieOptions.path,
  });
};
// #end-function
// #function getJWTFromCookie
export const getJWTFromCookie = (req: Request): string | null => {
  if (!req.cookies) {
    console.warn('Warning: req.cookies is undefined. Configure cookie-parser middleware.');
    return null;
  }
  return req.cookies[JWT_CONFIG.cookieName] || null;
};
// #end-function
// #function hasJWTCookie
export const hasJWTCookie = (req: Request): boolean => {
  return getJWTFromCookie(req) !== null;
};
// #end-function
