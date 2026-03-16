/* src/middlewares/validators/validateJWT.types.ts */

// #section Imports
import type { Request } from 'express';
// #end-section
// #interface JWTPayload - Payload del JWT decodificado
/**
 * @description
 * Estructura del payload decodificado de un token JWT del sistema.
 *
 * @purpose
 * Definir el contrato de los datos que contiene el JWT para su uso en middlewares de validación.
 *
 * @context
 * Utilizado por el middleware validateJWT para extraer y tipar la información del token.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface JWTPayload {
  // #v-field userId - Identificador del usuario
  /** identificador del usuario codificado en el token */
  userId: number;
  // #end-v-field
  // #v-field state - Estado de la cuenta del usuario
  /** estado de la cuenta del usuario al momento de emisión del token */
  state: 'pending' | 'active' | 'suspended';
  // #end-v-field
}
// #end-interface
// #interface AuthUser - Datos del usuario autenticado adjuntos al request
/**
 * @description
 * Datos del usuario autenticado que se inyectan en el objeto request de Express.
 *
 * @purpose
 * Proveer un tipo explícito para los datos del usuario disponibles en req.user tras pasar el middleware.
 *
 * @context
 * Utilizado por el middleware validateJWT y por los controladores que requieren datos del usuario autenticado.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface AuthUser {
  // #v-field id - Identificador del usuario
  /** identificador del usuario autenticado */
  id: number;
  // #end-v-field
  // #v-field state - Estado de la cuenta del usuario
  /** estado de la cuenta del usuario */
  state: 'pending' | 'active' | 'suspended';
  // #end-v-field
}
// #end-interface
// #interface AuthenticatedRequest - Request de Express con usuario autenticado
/**
 * @description
 * Extensión del Request de Express que incluye los datos del usuario autenticado.
 *
 * @purpose
 * Proveer tipado estático para el objeto request en rutas protegidas, garantizando acceso a req.user.
 *
 * @context
 * Utilizado en controladores y middlewares que operan sobre rutas que requieren autenticación.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export interface AuthenticatedRequest extends Request {
  // #v-field user - Datos del usuario autenticado
  /** datos del usuario autenticado inyectados por el middleware validateJWT */
  user: AuthUser;
  // #end-v-field
}
// #end-interface