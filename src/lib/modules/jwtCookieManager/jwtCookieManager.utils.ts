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
 * Validates that the payload is a non-null object (not an array).
 * Does NOT validate business logic.
 * @internal
 * @param payload - Value to validate as a JWT payload object
 * @returns void - Uses TypeScript assertion signature to narrow the type
 * @throws {JwtPayloadError} If payload is null, not an object, or is an array
 * @version 1.0.0
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
 * Validates that the JWT_SECRET environment variable is configured.
 * This is used internally before signing or verifying JWT tokens.
 * @internal
 * @returns void
 * @throws {JwtConfigurationError} If JWT_SECRET is not defined
 * @version 1.0.0
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
 * Validates that the absolute session lifetime is configured.
 * Uses JWT_ABSOLUTE_SESSION_MS from environment or defaults.
 * @internal
 * @returns void
 * @throws {JwtConfigurationError} If absoluteSessionMs is not defined or invalid
 * @version 1.0.0
 */
function _validateAbsoluteSessionMs(): void {
  if (!Number.isFinite(config.absoluteSessionMs) || config.absoluteSessionMs <= 0) {
    throw new JwtConfigurationError("JWT_ABSOLUTE_SESSION_MS must be a positive number");
  }
}
// #end-function
// #function _validateCookieName - Validates JWT_COOKIE_NAME presence (internal)
/**
 * Validates that the JWT_COOKIE_NAME environment variable is configured.
 * This is used internally before setting, getting, or clearing JWT cookies.
 * @internal
 * @returns void
 * @throws {JwtConfigurationError} If JWT_COOKIE_NAME is not defined
 * @version 1.0.0
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
 * Validates that all required JWT environment variables are configured.
 * Collects all missing variables and throws a single error listing them.
 * This provides a better developer experience than failing on the first missing var.
 * @internal
 * @returns void
 * @throws JwtConfigurationError If any required environment variable is missing
 * @version 1.0.0
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
 * Validates that a token is a non-empty string.
 * Uses TypeScript's assertion signature to narrow the type.
 * @internal
 * @param token - Value to validate as a JWT token string
 * @returns void - Uses TypeScript assertion signature to narrow the type
 * @throws {JwtPayloadError} If token is not a non-empty string
 * @version 1.0.0
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
 * Builds secure default options for JWT cookies.
 * Sets httpOnly=true (always), sameSite=strict, path=/, and secure based on NODE_ENV.
 * @internal
 * @param maxAge - Optional maximum age in milliseconds for the cookie
 * @returns Cookie configuration object with secure defaults
 * @version 1.0.0
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
 * Validates that the payload is a valid object for JWT creation.
 * This is a public wrapper around the internal validation logic.
 * @param payload - Value to validate as a JWT payload object
 * @returns void - Uses TypeScript assertion signature to narrow the type
 * @throws {JwtPayloadError} If payload is null, not an object, or is an array
 * @version 1.0.0
 */
export function validatePayload(payload: unknown): asserts payload is JwtPayload {
  _validatePayloadStructure(payload);
}
// #end-function
// #function validateEnvironmentVariables - Public wrapper for env validation
/**
 * Validates that required JWT environment variables are configured.
 * This is a public wrapper that checks all required environment variables at once.
 * Useful for validating configuration at application startup.
 * @returns void
 * @throws {JwtConfigurationError} If any required environment variable is missing
 * @version 1.0.0
 */
export function validateEnvironmentVariables(): void {
  _validateEnvironmentConfig();
}
// #end-function

// #function getConfiguredRefreshMs - Returns configured refresh window
/**
 * Returns the configured time window before expiration to allow token refresh.
 * This value is read from JWT_REFRESH_MS environment variable or defaults to 60000ms (1 minute).
 * @returns Refresh window in milliseconds
 * @version 1.0.0
 */
export function getConfiguredRefreshMs(): number {
  return config.refreshMs;
}
// #end-function

// #function getConfiguredAbsoluteSessionMs - Returns configured absolute session lifetime
/**
 * Returns the configured maximum absolute session lifetime.
 * This value is read from JWT_ABSOLUTE_SESSION_MS environment variable or defaults to 604800000ms (7 days).
 * @returns Absolute session lifetime in milliseconds
 * @version 1.0.0
 */
export function getConfiguredAbsoluteSessionMs(): number {
  return config.absoluteSessionMs;
}
// #end-function
// #end-section
// #section CORE JWT FUNCTIONS (public)
// #function createJWT - Creates a signed JWT token from a given payload and return it
/**
 * Creates a signed JWT token from a given payload.
 * @param payload The data to encode in the JWT (must be a non-null object)
 * @returns A signed JWT token as a string
 * @throws JwtPayloadError If payload is not a valid object
 * @throws JwtConfigurationError If JWT_SECRET or JWT_ABSOLUTE_SESSION_MS are not configured
 * @throws JwtSignError If JWT signing fails for any other reason
 * @version 1.0.0
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
 * Re-signs an existing JWT token to extend its expiration.
 * Verifies the token, preserves custom claims and originalIat, and generates a new token with fresh expiration.
 * Does not evaluate refresh eligibility or update cookies; only returns the newly signed token.
 * @param token Existing JWT token (must be a valid, non-empty string)
 * @returns New JWT token with fresh expiration based on absoluteSessionMs
 * @throws JwtPayloadError If token is not a valid string
 * @throws JwtConfigurationError If JWT_SECRET or JWT_ABSOLUTE_SESSION_MS are not configured
 * @throws JwtSignError If token verification or signing fails
 * @version 1.0.0
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
 * Decodes and verifies a JWT token, returning the payload if valid.
 * @param token The JWT token to decode (must be a valid JWT string)
 * @returns The decoded payload object
 * @throws JwtPayloadError If token is not a valid string
 * @throws JwtConfigurationError If JWT_SECRET is not configured
 * @throws JwtSignError If JWT verification fails (invalid signature, expired, etc.)
 * @version 1.0.0
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
 * Generates cookie data for setting a JWT token.
 * Returns framework-agnostic cookie configuration ready to be set.
 * @param token JWT token to store in the cookie
 * @param options Optional cookie configuration overrides
 * @returns Object containing cookie name, value, and options
 * @throws JwtPayloadError If token is not a valid string
 * @throws JwtConfigurationError If JWT_COOKIE_NAME is not configured
 * @version 1.0.0
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
 * Extracts JWT token from a cookies object using the configured cookie name.
 * Returns null if cookie not found. Accepts null/undefined cookies safely.
 * @param cookies Object containing cookie key-value pairs (e.g., from Express, Next.js)
 * @returns JWT token if found, null otherwise
 * @throws JwtConfigurationError If JWT_COOKIE_NAME is not configured
 * @version 1.0.0
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
 * Generates cookie data for clearing/removing a JWT cookie.
 * Returns framework-agnostic cookie configuration ready to be set.
 * @param options Optional cookie configuration overrides
 * @returns Object containing cookie name, empty value, and clearing options
 * @throws JwtConfigurationError If JWT_COOKIE_NAME is not configured
 * @version 1.0.0
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