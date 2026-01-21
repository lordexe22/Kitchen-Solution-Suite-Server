// Tipos para el servicio de login
export interface LoginPayload {
  platformName: 'local' | 'google';
  email?: string;
  password?: string;
  credential?: string;
}

import type { CookieData } from '../../../lib/modules/jwtCookieManager';

export interface LoginResult {
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
