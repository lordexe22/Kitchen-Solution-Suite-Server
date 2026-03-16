/* #info - Tipos e interfaces del módulo jwtCookieManager */

// #section Imports
import type { SignOptions } from "jsonwebtoken";
// #end-section

// #type JwtPayload - Estructura genérica del payload JWT
/**
 * @description
 * Tipo genérico que representa el payload de un token JWT.
 *
 * @purpose
 * Permitir tipado flexible del payload JWT sin restringir su estructura, adaptándose a distintos contextos.
 *
 * @context
 * Utilizado por las funciones de firma y verificación del módulo jwtCookieManager.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type JwtPayload = Record<string, unknown>;
// #end-type

// #type SignJwtOptions - Opciones para la firma de tokens JWT
/**
 * @description
 * Opciones de configuración utilizadas al firmar un token JWT.
 *
 * @purpose
 * Reutilizar las opciones de SignOptions de jsonwebtoken con un alias semántico del módulo.
 *
 * @context
 * Utilizado por las funciones de creación de tokens del módulo jwtCookieManager.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type SignJwtOptions = SignOptions;
// #end-type

// #section Cookie Types

// #type CookieConfig - Opciones de configuración para cookies JWT
/**
 * @description
 * Opciones de configuración para definir o limpiar cookies JWT en la respuesta HTTP.
 *
 * @purpose
 * Centralizar la configuración de cookies con opciones seguras, forzando siempre httpOnly=true.
 *
 * @context
 * Utilizado por las funciones de gestión de cookies del módulo jwtCookieManager.
 *
 * @remarks
 * La propiedad httpOnly siempre es forzada a true internamente, independientemente del valor provisto.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type CookieConfig = {
  /** tiempo de vida de la cookie en milisegundos */
  maxAge?: number;
  /** ruta de alcance de la cookie */
  path?: string;
  /** dominio de alcance de la cookie */
  domain?: string;
  /** indica si la cookie solo se transmite por HTTPS */
  secure?: boolean;
  /** siempre forzado a true internamente por seguridad */
  httpOnly?: boolean;
  /** política de envío entre sitios */
  sameSite?: "strict" | "lax" | "none";
};
// #end-type

// #type CookieData - Datos de cookie listos para ser enviados en la respuesta
/**
 * @description
 * Estructura que encapsula los datos completos de una cookie para ser enviada en la respuesta HTTP.
 *
 * @purpose
 * Proveer una estructura agnóstica de framework con toda la información necesaria para establecer una cookie.
 *
 * @context
 * Retornado por las funciones del módulo jwtCookieManager para ser aplicado por Express, Fastify, Next.js u otros.
 *
 * @since 1.0.0
 *
 * @author Walter Ezequiel Puig
 */
export type CookieData = {
  /** nombre de la cookie */
  name: string;
  /** valor de la cookie (token JWT serializado) */
  value: string;
  /** opciones de configuración de la cookie */
  options: CookieConfig;
};
// #end-type

// #end-section
