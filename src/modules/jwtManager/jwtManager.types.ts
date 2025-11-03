/* src\modules\jwtManager\jwtManager.types.ts */
// #interface JWTPayload
export interface JWTPayload {
  userId: number;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}
// #end-interface
// #interface JWTConfig
export interface JWTConfig {
  secret: string;
  defaultExpiration: string;
  cookieName: string;
  cookieOptions: CookieOptions;
}
// #end-interface
// #interface CookieOptions
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}
// #end-interface
// #type JWTExpiration
export type JWTExpiration = string | number;
// #end-type