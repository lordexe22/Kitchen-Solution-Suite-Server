/* #info - Types and interfaces for jwtCookieManager */
// #section Imports
import type { SignOptions } from "jsonwebtoken";
// #end-section
// #type JwtPayload - Generic JWT payload structure
/** Generic JWT payload type. Accepts any object structure. */
export type JwtPayload = Record<string, unknown>;
// #end-type
// #type SignJwtOptions - Options for signing JWT tokens
/** Sign options for JWT creation. Uses jsonwebtoken's SignOptions. */
export type SignJwtOptions = SignOptions;
// #end-type
// #section Cookie Types
// #type CookieConfig - Configuration for JWT cookies
/**
 * Configuration options for setting or clearing JWT cookies.
 * All properties are optional and will use sensible defaults.
 * Note: httpOnly is always forced to true for security.
 */
export type CookieConfig = {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
};
// #end-type

// #type CookieData - Cookie data to be set
/**
 * Data structure containing cookie information ready to be set.
 * Framework-agnostic - use with Express, Fastify, Next.js, etc.
 */
export type CookieData = {
  name: string;
  value: string;
  options: CookieConfig;
};
// #end-type
// #end-section
