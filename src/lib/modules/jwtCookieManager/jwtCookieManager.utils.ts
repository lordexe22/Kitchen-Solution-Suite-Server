/* #info - Core utility functions for jwtCookieManager */
// #section Imports
import jwt from "jsonwebtoken";
import type { JwtPayload, SignJwtOptions, CookieConfig, CookieData } from "./jwtCookieManager.types";
import { JwtPayloadError, JwtSignError, JwtConfigurationError } from "./jwtCookieManager.errors";
import { config } from "./jwtCookieManager.config";
// #end-section
// #section INTERNAL VALIDATORS (not exported, used by public functions)
// #function _validatePayloadStructure - Validates payload structure (internal)
/**
 * @description Valida que el payload sea un objeto no nulo (no array) antes de crear un JWT.
 * @purpose Prevenir firmas JWT con payloads inválidos que causarían errores en tiempo de ejecución.
 * @context Utilizado internamente por createJWT y refreshJWT antes de firmar tokens.
 * @param payload valor a validar como objeto de payload JWT
 * @returns void (usa assertion signature de TypeScript para narrowing de tipos)
 * @throws JwtPayloadError si el payload es null, no es un objeto o es un array
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validatePayloadStructure(payload: unknown): asserts payload is JwtPayload {
  // #step 1 - Ensure payload is a non-null object
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new JwtPayloadError(
      "Payload must be a non-null object (not an array)"
    );
  }
  // #end-step
}
// #end-function
// #function _validateSecret - Validates JWT_SECRET presence (internal)
/**
 * @description Valida que la variable de entorno JWT_SECRET esté configurada.
 * @purpose Prevenir firmas JWT sin secreto configurado que producirían tokens inseguros.
 * @context Utilizado internamente antes de firmar o verificar tokens JWT.
 * @throws JwtConfigurationError si JWT_SECRET no está definido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validateSecret(): void {
  // #step 1 - Ensure JWT_SECRET exists
  if (!config.secret) {
    throw new JwtConfigurationError(
      "JWT_SECRET environment variable is not defined"
    );
  }
  // #end-step
}
// #end-function
// #function _validateAbsoluteSessionMs - Validates absolute session lifetime presence (internal)
/**
 * @description Valida que la duración absoluta de sesión esté configurada y sea un número positivo.
 * @purpose Prevenir configuraciones inválidas de sesión que producirían tokens con expiración incorrecta.
 * @context Utilizado internamente por createJWT y refreshJWT para validar la configuración de sesión.
 * @throws JwtConfigurationError si absoluteSessionMs no está definido o no es un número positivo
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validateAbsoluteSessionMs(): void {
  if (!Number.isFinite(config.absoluteSessionMs) || config.absoluteSessionMs <= 0) {
    throw new JwtConfigurationError("JWT_ABSOLUTE_SESSION_MS must be a positive number");
  }
}
// #end-function
// #function _validateCookieName - Validates JWT_COOKIE_NAME presence (internal)
/**
 * @description Valida que la variable de entorno JWT_COOKIE_NAME esté configurada.
 * @purpose Prevenir operaciones de cookie sin nombre configurado que causarían errores en tiempo de ejecución.
 * @context Utilizado internamente antes de setear, obtener o limpiar cookies JWT.
 * @throws JwtConfigurationError si JWT_COOKIE_NAME no está definido
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validateCookieName(): void {
  // #step 1 - Ensure JWT_COOKIE_NAME exists
  if (!config.cookieName) {
    throw new JwtConfigurationError(
      "JWT_COOKIE_NAME environment variable is not defined"
    );
  }
  // #end-step
}
// #end-function
// #function _validateEnvironmentConfig - Validates all required env vars (internal)
/**
 * @description Valida que todas las variables de entorno JWT requeridas estén configuradas.
 * @purpose Unificar la validación de configuración y devolver un solo error con todas las variables faltantes.
 * @context Utilizado por validateEnvironmentVariables para validar la configuración al iniciar la aplicación.
 * @throws JwtConfigurationError si alguna variable de entorno requerida falta
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validateEnvironmentConfig(): void {
  // #step 1 - Collect missing variables
  const missingVars: string[] = [];

  if (!config.secret) {
    missingVars.push("JWT_SECRET");
  }

  if (!config.cookieName) {
    missingVars.push("JWT_COOKIE_NAME");
  }

  if (!Number.isFinite(config.absoluteSessionMs)) {
    missingVars.push("JWT_ABSOLUTE_SESSION_MS");
  }

  if (!Number.isFinite(config.refreshMs)) {
    missingVars.push("JWT_REFRESH_MS");
  }
  // #end-step

  // #step 2 - Throw if any variable is missing
  if (missingVars.length > 0) {
    throw new JwtConfigurationError(
      `Missing required JWT environment variables: ${missingVars.join(", ")}`
    );
  }
  // #end-step
}
// #end-function
// #function _validateTokenFormat - Validates token format (internal)
/**
 * @description Valida que un token sea un string no vacío antes de verificarlo.
 * @purpose Prevenir llamadas al SDK de JWT con tokens inválidos que producirían errores.
 * @context Utilizado internamente por decodeJWT y refreshJWT antes de verificar tokens.
 * @param token valor a validar como string de token JWT
 * @returns void (usa assertion signature de TypeScript para narrowing de tipos)
 * @throws JwtPayloadError si el token no es un string no vacío
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _validateTokenFormat(token: unknown): asserts token is string {
  // #step 1 - Ensure token is a non-empty string
  if (typeof token !== "string" || token.trim().length === 0) {
    throw new JwtPayloadError(
      "Token must be a non-empty string"
    );
  }
  // #end-step
}
// #end-function
// #end-section
// #section INTERNAL HELPERS (not exported, used by public functions)
// #function _buildDefaultCookieOptions - Builds default cookie options (internal)
/**
 * @description Construye las opciones seguras por defecto para cookies JWT.
 * @purpose Centralizar la configuración de cookies con valores seguros (httpOnly, sameSite, secure según NODE_ENV).
 * @context Utilizado por setJWTCookie y clearJWTCookie para obtener la configuración base de la cookie.
 * @param maxAge edad máxima de la cookie en milisegundos
 * @returns configuración de cookie con valores seguros por defecto
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
function _buildDefaultCookieOptions(maxAge?: number): CookieConfig {
  // #step 1 - Determine if secure based on NODE_ENV
  const isProduction = config.nodeEnv === "production";
  const secure = isProduction;
  // #end-step

  // #step 2 - Build defaults
  return {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: secure,
    maxAge: maxAge,
  };
  // #end-step
}
// #end-function
// #end-section
// #section PUBLIC VALIDATORS (exported wrappers)
// #function validatePayload - Public wrapper for payload validation
/**
 * @description Valida que el payload sea un objeto válido para la creación de JWT.
 * @purpose Exponer la validación interna de payload como API pública del módulo.
 * @context Utilizado por consumidores del módulo antes de llamar a createJWT.
 * @param payload valor a validar como objeto de payload JWT
 * @returns void (usa assertion signature de TypeScript para narrowing de tipos)
 * @throws JwtPayloadError si el payload es null, no es un objeto o es un array
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function validatePayload(payload: unknown): asserts payload is JwtPayload {
  _validatePayloadStructure(payload);
}
// #end-function
// #function validateEnvironmentVariables - Public wrapper for env validation
/**
 * @description Valida que las variables de entorno JWT requeridas estén configuradas.
 * @purpose Permitir a los consumidores verificar la configuración del módulo al inicio de la aplicación.
 * @context Utilizado en el startup del servidor para detectar configuraciones faltantes antes de procesar requests.
 * @throws JwtConfigurationError si alguna variable de entorno requerida falta
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function validateEnvironmentVariables(): void {
  _validateEnvironmentConfig();
}
// #end-function

// #function getConfiguredRefreshMs - Returns configured refresh window
/**
 * @description Retorna la ventana de tiempo configurada antes de la expiración para permitir el refresh del token.
 * @purpose Exponer la configuración de refresh window para que los middlewares calculen elegibilidad de refresh.
 * @context Utilizado por middlewares de autenticación para determinar si un token está dentro de la ventana de refresh.
 * @returns ventana de refresh en milisegundos (por defecto 60000ms / 1 minuto)
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function getConfiguredRefreshMs(): number {
  return config.refreshMs;
}
// #end-function

// #function getConfiguredAbsoluteSessionMs - Returns configured absolute session lifetime
/**
 * @description Retorna la duración máxima absoluta de sesión configurada.
 * @purpose Exponer la configuración de sesión absoluta para cálculos de expiración en middlewares.
 * @context Utilizado por middlewares de autenticación para verificar si una sesión ha superado su tiempo máximo.
 * @returns duración absoluta de sesión en milisegundos (por defecto 604800000ms / 7 días)
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function getConfiguredAbsoluteSessionMs(): number {
  return config.absoluteSessionMs;
}
// #end-function
// #end-section
// #section CORE JWT FUNCTIONS (public)
// #function createJWT - Creates a signed JWT token from a given payload and return it
/**
 * @description Crea un token JWT firmado a partir de un payload, incluyendo originalIat para control de sesión absoluta.
 * @purpose Proveer la operación de firma de JWT con validaciones y configuración centralizada.
 * @context Utilizado por el middleware de autenticación al crear tokens en login/registro.
 * @param payload datos a codificar en el JWT (debe ser un objeto no nulo)
 * @returns token JWT firmado como string
 * @throws JwtPayloadError si el payload no es un objeto válido
 * @throws JwtConfigurationError si JWT_SECRET o JWT_ABSOLUTE_SESSION_MS no están configurados
 * @throws JwtSignError si la firma del JWT falla por cualquier otra razón
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function createJWT(payload: JwtPayload): string {
  // #step 1 - Validate payload structure
  _validatePayloadStructure(payload);
  // #end-step
  // #step 2 - Validate environment configuration
  _validateSecret();
  _validateAbsoluteSessionMs();
  // #end-step
  // #step 3 - Sign and return the JWT
  try {
    const secret = config.secret!;
    const expiresInSeconds = Math.floor(config.absoluteSessionMs / 1000);

    // Inject originalIat if not already present to track absolute session start
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payloadWithOriginal = (payload as any).originalIat
      ? payload
      : { ...payload, originalIat: nowSeconds };

    const options: SignJwtOptions = {
      expiresIn: expiresInSeconds,
    };

    const token = jwt.sign(payloadWithOriginal, secret, options);

    return token;
  } catch (error) {
    throw new JwtSignError("Failed to sign JWT", error);
  }
  // #end-step
}
// #end-function
// #function refreshJWT - Re-signs an existing JWT payload into a fresh token
/**
 * @description Re-firma un token JWT existente extendiendo su expiración, preservando claims y originalIat.
 * @purpose Extender la sesión del usuario sin reautenticación cuando el token está próximo a expirar.
 * @context Utilizado por el middleware de autenticación al detectar tokens dentro de la ventana de refresh.
 * @param token token JWT existente a renovar (debe ser un string válido y no expirado)
 * @returns nuevo token JWT con expiración renovada basada en absoluteSessionMs
 * @throws JwtPayloadError si el token no es un string válido
 * @throws JwtConfigurationError si JWT_SECRET o JWT_ABSOLUTE_SESSION_MS no están configurados
 * @throws JwtSignError si la verificación o firma del token falla
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function refreshJWT(token: unknown): string {
  // #step 1 - Validate token format and configuration
  _validateTokenFormat(token);
  _validateSecret();
  _validateAbsoluteSessionMs();
  // #end-step

  try {
    const secret = config.secret!;

    // #step 2 - Verify and decode the existing token
    const decoded = jwt.verify(token, secret) as JwtPayload;
    _validatePayloadStructure(decoded);
    // #end-step

    // #step 3 - Preserve custom claims and originalIat; discard JWT registered claims
    const { exp, iat, nbf, jti, aud, iss, sub, ...rest } = decoded as any;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const originalIat = (decoded as any).originalIat ?? iat ?? nowSeconds;
    // #end-step

    // #step 4 - Build payload for new token with preserved originalIat
    const payloadToSign: JwtPayload = {
      ...rest,
      originalIat,
    } as JwtPayload;
    // #end-step

    // #step 5 - Sign and return the new token
    const options: SignJwtOptions = {
      expiresIn: Math.floor(config.absoluteSessionMs / 1000),
    };

    const newToken = jwt.sign(payloadToSign, secret, options);
    return newToken;
    // #end-step
  } catch (error) {
    throw new JwtSignError("Failed to refresh JWT", error);
  }
}
// #end-function
// #function decodeJWT - Decodes and verifies a JWT token
/**
 * @description Decodifica y verifica un token JWT, retornando el payload si es válido.
 * @purpose Proveer la operación de verificación de JWT con validaciones y configuración centralizada.
 * @context Utilizado por middlewares de autenticación para verificar tokens en cada request.
 * @param token token JWT a decodificar (debe ser un string JWT válido)
 * @returns payload decodificado del token
 * @throws JwtPayloadError si el token no es un string válido
 * @throws JwtConfigurationError si JWT_SECRET no está configurado
 * @throws JwtSignError si la verificación del JWT falla (firma inválida, expirado, etc.)
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function decodeJWT(token: unknown): JwtPayload {
  // #step 1 - Validate token format
  _validateTokenFormat(token);
  // #end-step

  // #step 2 - Validate environment configuration
  _validateSecret();
  // #end-step

  // #step 3 - Verify and decode the JWT
  try {
    const secret = config.secret!;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new JwtSignError("Failed to verify JWT", error);
  }
  // #end-step
}
// #end-function
// #end-section
// #section COOKIE FUNCTIONS (public)
// #function setJWTCookie - Prepares cookie data for setting JWT token
/**
 * @description Genera los datos de cookie para almacenar un token JWT con opciones seguras por defecto.
 * @purpose Centralizar la creación de datos de cookie JWT framework-agnostic con valores seguros.
 * @context Utilizado por el middleware de autenticación tras crear o renovar un JWT para enviarlo al cliente.
 * @param token token JWT a almacenar en la cookie
 * @param options opciones de cookie opcionales que sobreescriben los valores por defecto
 * @returns objeto con nombre, valor y opciones de cookie listo para usar
 * @throws JwtPayloadError si el token no es un string válido
 * @throws JwtConfigurationError si JWT_COOKIE_NAME no está configurado
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function setJWTCookie(
  token: string,
  options?: Partial<CookieConfig>
): CookieData {
  // #step 1 - Validate token format
  _validateTokenFormat(token);
  // #end-step
  // #step 2 - Validate cookie name is configured
  _validateCookieName();
  // #end-step
  // #step 3 - Build default cookie options and merge with provided options
  // Default maxAge should align with JWT absolute session lifetime
  const defaultMaxAge = config.absoluteSessionMs;
  const defaultOptions = _buildDefaultCookieOptions(defaultMaxAge);
  const mergedOptions: CookieConfig = {
    ...defaultOptions,
    ...options,
    httpOnly: true, // Force httpOnly to true for security
  };
  // #end-step
  // #step 4 - Return cookie data
  return {
    name: config.cookieName!,
    value: token,
    options: mergedOptions,
  };
  // #end-step
}
// #end-function
// #function getJWTFromCookie - Extracts JWT from cookies object
/**
 * @description Extrae el token JWT de un objeto de cookies usando el nombre de cookie configurado.
 * @purpose Centralizar la lectura del token desde las cookies de la request de forma segura.
 * @context Utilizado por el middleware de autenticación al inicio del pipeline de autenticación.
 * @param cookies objeto con pares clave-valor de cookies (ej: de Express, Next.js)
 * @returns token JWT si se encontró, null en caso contrario
 * @throws JwtConfigurationError si JWT_COOKIE_NAME no está configurado
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function getJWTFromCookie(
  cookies: Record<string, string> | null | undefined
): string | null {
  // #step 1 - Validate cookie name is configured
  _validateCookieName();
  // #end-step
  // #step 2 - Handle null/undefined cookies
  if (!cookies || typeof cookies !== "object" || Array.isArray(cookies)) {
    return null;
  }
  // #end-step
  // #step 3 - Extract and return token from cookies
  const token = cookies[config.cookieName!];
  return token || null;
  // #end-step
}
// #end-function
// #function clearJWTCookie - Prepares cookie data for clearing JWT cookie
/**
 * @description Genera los datos de cookie para limpiar/eliminar la cookie de JWT.
 * @purpose Centralizar la creación de datos de cookie de limpieza con maxAge=0 para invalidar el token del cliente.
 * @context Utilizado por el middleware de autenticación al procesar el logout del usuario.
 * @param options opciones de cookie opcionales que sobreescriben los valores por defecto
 * @returns objeto con nombre, valor vacío y opciones de borrado listo para usar
 * @throws JwtConfigurationError si JWT_COOKIE_NAME no está configurado
 * @since 1.0.0
 * @author Walter Ezequiel Puig
 */
export function clearJWTCookie(
  options?: Partial<CookieConfig>
): CookieData {
  // #step 1 - Validate cookie name is configured
  _validateCookieName();
  // #end-step
  // #step 2 - Build cookie options for clearing (maxAge 0)
  const defaultOptions = _buildDefaultCookieOptions(0);
  const mergedOptions: CookieConfig = {
    ...defaultOptions,
    ...options,
    maxAge: 0, // Force maxAge to 0 to clear cookie
    httpOnly: true, // Force httpOnly to true for consistency
  };
  // #end-step
  // #step 3 - Return cookie data with empty value
  return {
    name: config.cookieName!,
    value: "",
    options: mergedOptions,
  };
  // #end-step
}
// #end-function
// #end-section