import type { CookieData } from '../../../lib/modules/jwtCookieManager';

export interface RegisterPayload {
  platformName: 'local' | 'google';
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  platformToken?: string | null;
  credential?: string | null;
  imageUrl?: string | null;
}

export interface RegisterResult {
  user: UserData;
  token: string;
  cookieData: CookieData;
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
