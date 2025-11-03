/* src/modules/jwtManager/jwtManager.config.ts */
// #section imports
import type { JWTConfig } from './jwtManager.types';
// #end-section

// #section initialization
/**
 * Validación de la variable de entorno JWT_SECRET.
 * 
 * Esta variable es crítica para la seguridad del sistema.
 * Debe ser una cadena larga, aleatoria y secreta.
 */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET environment variable is not defined. Add it to your .env file.');
}
// #end-section

// #variable JWT_CONFIG
/**
 * Configuración principal del módulo JWT.
 * 
 * Define cómo se generan, validan y almacenan los tokens JWT.
 * 
 * @property {string} secret - Clave secreta para firmar tokens (desde .env)
 * @property {string} defaultExpiration - Expiración por defecto: 30 días
 * @property {string} cookieName - Nombre de la cookie: 'auth_token'
 * @property {object} cookieOptions - Opciones de seguridad de la cookie
 * @property {boolean} cookieOptions.httpOnly - Cookie no accesible desde JavaScript
 * @property {boolean} cookieOptions.secure - Solo HTTPS en producción
 * @property {'lax'} cookieOptions.sameSite - Protección CSRF moderada
 * @property {number} cookieOptions.maxAge - 30 días en milisegundos
 * @property {string} cookieOptions.path - Cookie válida en todas las rutas
 * 
 * @example
 * // Usar la configuración en otro archivo
 * import { JWT_CONFIG } from './jwtManager.config';
 * console.log(JWT_CONFIG.defaultExpiration); // '30d'
 */
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
/**
 * Clave secreta extraída de JWT_CONFIG para uso directo.
 * 
 * Exportada por conveniencia para evitar escribir JWT_CONFIG.secret.
 * 
 * @type {string}
 */
export const SECRET = JWT_CONFIG.secret;
// #end-variable