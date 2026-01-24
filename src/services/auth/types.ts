import type { CookieData } from '../../lib/modules/jwtCookieManager';
import type { Request } from 'express';

// ============================================================================
// Tipos de Usuario
// ============================================================================

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

export type UserType = 'admin' | 'employee' | 'guest' | 'ownership';
export type UserState = 'pending' | 'active' | 'suspended';

// ============================================================================
// Tipos de Login
// ============================================================================

export interface LoginPayload {
  platformName: 'local' | 'google';
  email?: string;
  password?: string;
  credential?: string;
}

export interface LoginResult {
  user: UserData;
  token: string;
  cookieData: CookieData;
}

// ============================================================================
// Tipos de Registro
// ============================================================================

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

// ============================================================================
// Tipos de AutoLogin
// ============================================================================

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

// ============================================================================
// Tipos de Logout
// ============================================================================

export interface LogoutResult {
  statusCode: 'SUCCESS' | 'FAILURE';
  message: string;
  cookieClearData: CookieData;
}
