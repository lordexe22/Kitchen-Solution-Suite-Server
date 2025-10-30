// src/utils/jwt.utils.ts
import jwt, { SignOptions } from 'jsonwebtoken';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable');

// #interface JWTPayload - Estructura del payload del JWT.
export interface JWTPayload {
  userId: number;
}
// #end-interface
// #function signJWT - Genera un JWT firmado a partir del ID del usuario.
/**
 * Genera un JWT firmado.
 * @param payload - Datos del usuario a incluir en el token.
 * @param expiresIn - Duración del token. Por defecto '7d'.
 * @returns Token JWT firmado.
 */
export const signJWT = (payload: JWTPayload, expiresIn: jwt.SignOptions['expiresIn'] = '30d'): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign({ ...payload }, JWT_SECRET, options);
};
// #end-function
// #function verifyJWT - Verifica un JWT y devuelve su contenido decodificado.
/**
 * Verifica un JWT y devuelve su contenido decodificado.
 * @param token - Token JWT a verificar.
 * @returns Payload decodificado.
 */
export const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
// #end-function
