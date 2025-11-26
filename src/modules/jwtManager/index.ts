// src/modules/jwtManager/index.ts

// #section Exports - Configuration
export { JWT_CONFIG, SECRET } from './jwtManager.config';
// #end-section

// #section Exports - Types
export type { 
  JWTPayload, 
  JWTConfig, 
  CookieOptions, 
  JWTExpiration,
  AuthenticatedRequest
} from './jwtManager.types';
// #end-section

// #section Exports - Utils
export {
  signJWT,
  verifyJWT,
  isTokenValid,
  getTokenFromHeader,
  setJWTCookie,
  clearJWTCookie,
  getJWTFromCookie,
  hasJWTCookie
} from './jwtManager.utils';
// #end-section

// #section Exports - Middlewares
export {
  authenticateJWT,
  optionalAuth,
  validateJWTAndGetPayload
} from './jwtManager.middlewares';
// #end-section

// #section Exports - Routes
export { default as jwtManagerRoutes } from './jwtManager.routes';
// #end-section