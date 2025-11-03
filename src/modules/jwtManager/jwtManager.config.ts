/* src\modules\jwtManager\jwtManager.config.ts */
// #section imports
import type { JWTConfig } from './jwtManager.types';
// #end-section
// #section initialization
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}
// #end-section
// #variable JWT_CONFIG
export const JWT_CONFIG: JWTConfig = {
  secret: JWT_SECRET,
  defaultExpiration: '30d',
  cookieName: 'auth_token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    path: '/',
  },
};
// #end-variable
// #variable SECRET
export const SECRET = JWT_CONFIG.secret;
// #end-variable