// Public API exports for jwtCookieManager module

// Types
export type { JwtPayload, SignJwtOptions, CookieConfig, CookieData } from "./jwtCookieManager.types";

// Errors
export {
  JwtError,
  JwtSignError,
  JwtConfigurationError,
  JwtPayloadError,
} from "./jwtCookieManager.errors";

// Validators and Core Functions
export {
  validatePayload,
  validateEnvironmentVariables,
  getConfiguredRefreshMs,
  getConfiguredAbsoluteSessionMs,
  createJWT,
  refreshJWT,
  decodeJWT,
  setJWTCookie,
  getJWTFromCookie,
  clearJWTCookie,
} from "./jwtCookieManager.utils";
