/* #info - Environment configuration for jwtCookieManager */
// #section Imports
import dotenv from "dotenv";
// #end-section
// #section config
dotenv.config();
// #end-section

// #section Helper functions
/**
 * Parses a numeric environment variable with validation and fallback.
 * @param value - The environment variable value to parse
 * @param fallback - Default value if parsing fails
 * @returns Parsed number or fallback
 */
function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
// #end-section

// #const config - JWT module configuration >> exported
/**
 * JWT module configuration loaded from environment variables
 */
export const config = {
  // #v-field secret - JWT secret key used to sign and verify tokens (REQUIRED)
  /** JWT secret key used to sign and verify tokens (REQUIRED) */
  secret: process.env.JWT_SECRET,
  // #end-v-field
  // #v-field cookieName - Cookie name used to store JWT - defaults to "jwt_token"
  /** Cookie name used to store JWT - defaults to "jwt_token" */
  cookieName: process.env.JWT_COOKIE_NAME || "jwt_token",
  // #end-v-field
  // #v-field nodeEnv - Current runtime environment - defaults to "development"
  /** Current runtime environment - defaults to "development" */
  nodeEnv: process.env.NODE_ENV || "development",
  // #end-v-field
  // #v-field refreshMs - Time window before expiration to allow token refresh (ms) - defaults to 60000 (1 minute)
  /** Time window before expiration to allow token refresh (ms) - defaults to 60000 (1 minute) */
  refreshMs: parseNumberEnv(process.env.JWT_REFRESH_MS, 60000),
  // #end-v-field
  // #v-field absoluteSessionMs - Maximum absolute session lifetime (ms) - defaults to 604800000 (7 days)
  /** Maximum absolute session lifetime (ms) - defaults to 604800000 (7 days) */
  absoluteSessionMs: parseNumberEnv(process.env.JWT_ABSOLUTE_SESSION_MS, 604800000),
  // #end-v-field
} as const;
// #end-const
