import type { CookieData } from '../../../lib/modules/jwtCookieManager';
import type { Request } from 'express';

export type AutoLoginPayload = Request;

export type AutoLoginStatusCode =
  | 'NO_TOKEN'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'USER_NOT_FOUND'
  | 'USER_SUSPENDED'
  | 'SUCCESS';

export interface AutoLoginResult {
  user?: UserData;
  statusCode: AutoLoginStatusCode;
  cookieData?: CookieData;
}

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  type: 'admin' | 'employee' | 'guest' | 'ownership';
  belongToCompanyId: number | null;
  belongToBranchId: number | null;
  state: 'pending' | 'active' | 'suspended';
}
