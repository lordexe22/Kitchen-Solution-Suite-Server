/* src/modules/jwtManager/jwtManager.types.ts */
// #section imports
import { Request } from 'express';
// #end-section
// #interface JWTPayload
/**
 * Estructura del payload contenido en el JWT.
 * 
 * @property {number} userId - ID único del usuario en la base de datos
 * @property {string} [email] - Email del usuario (opcional)
 * @property {UserType} [type] - Tipo de usuario en el sistema
 * @property {number | null} [branchId] - Sucursal asignada si es employee
 * @property {string | null} [permissions] - Permisos (JSON stringificado) si es employee
 * @property {'pending' | 'active' | 'suspended'} [state] - Estado del usuario
 * @property {number} [iat] - Timestamp de emisión del token (issued at)
 * @property {number} [exp] - Timestamp de expiración del token (expiration)
 */
export type UserType = 'admin' | 'employee' | 'guest' | 'dev';

export interface JWTPayload {
  userId: number;
  email?: string;
  type?: UserType;
  branchId?: number | null;
    companyId?: number | null;
  permissions?: string | null;
  state?: 'pending' | 'active' | 'suspended';
  iat?: number;
  exp?: number;
}
// #end-interface
// #interface JWTConfig
/**
 * Configuración general del módulo JWT.
 * 
 * @property {string} secret - Clave secreta para firmar tokens
 * @property {string} defaultExpiration - Tiempo de expiración por defecto (ej: '7d', '24h')
 * @property {string} cookieName - Nombre de la cookie donde se almacena el token
 * @property {CookieOptions} cookieOptions - Opciones de configuración de la cookie
 */
export interface JWTConfig {
  secret: string;
  defaultExpiration: string;
  cookieName: string;
  cookieOptions: CookieOptions;
}
// #end-interface
// #interface CookieOptions
/**
 * Opciones de configuración para la cookie que almacena el JWT.
 * 
 * @property {boolean} httpOnly - Si true, la cookie no es accesible desde JavaScript del cliente
 * @property {boolean} secure - Si true, la cookie solo se envía por HTTPS
 * @property {'strict' | 'lax' | 'none'} sameSite - Política CSRF de la cookie
 * @property {number} maxAge - Tiempo de vida de la cookie en milisegundos
 * @property {string} path - Ruta donde la cookie es válida
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}
// #end-interface
// #type JWTExpiration
/**
 * Tipo para definir el tiempo de expiración de un JWT.
 * 
 * Puede ser:
 * - String: '7d', '24h', '30m', '60s'
 * - Number: Tiempo en segundos
 * 
 * @example
 * const shortExpiration: JWTExpiration = '15m';
 * const longExpiration: JWTExpiration = '30d';
 * const numericExpiration: JWTExpiration = 3600; // 1 hora en segundos
 */
export type JWTExpiration = string | number;
// #end-type
// #interface AuthenticatedRequest
/**
 * Extensión del Request de Express que incluye el usuario autenticado.
 * 
 * Usar este tipo en handlers que requieren autenticación.
 * 
 * @property {JWTPayload} [user] - Payload del JWT con datos del usuario
 * 
 * @example
 * export const protectedHandler = (req: AuthenticatedRequest, res: Response) => {
 *   const userId = req.user!.userId; // El ! indica que user existe (middleware lo garantiza)
 *   res.json({ userId });
 * };
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
// #end-interface