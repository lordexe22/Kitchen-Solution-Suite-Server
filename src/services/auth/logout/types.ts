import type { CookieData } from '../../../lib/modules/jwtCookieManager';

export interface LogoutResult {
  statusCode: 'SUCCESS';
  cookieClearData: CookieData;
}
