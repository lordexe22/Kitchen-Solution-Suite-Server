// Servicio de cierre de sesión (logout)
import { clearJWTCookie } from '../../../lib/modules/jwtCookieManager';
import type { LogoutResult } from '../types';

export type { LogoutResult } from '../types';

export function logoutService(): LogoutResult {
  const cookieClearData = clearJWTCookie();

  return {
    statusCode: 'SUCCESS',
    message: 'Logged out successfully',
    cookieClearData,
  };
}
