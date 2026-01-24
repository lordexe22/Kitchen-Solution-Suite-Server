/**
 * Servicios de Autenticación
 * 
 * Todos los tipos y utilidades para la autenticación están centralizados aquí.
 * Cada servicio se encarga de una operación específica.
 */

// Tipos centralizados
export type {
  UserData,
  UserType,
  UserState,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  RegisterResult,
  AutoLoginPayload,
  AutoLoginStatusCode,
  AutoLoginResult,
  LogoutResult,
} from './types';

// Constantes
export { USER_TYPES, USER_STATES, AUTH_PLATFORMS, isValidUserType, isValidUserState, normalizeEmail } from './constants';

// Servicios
export { loginService } from './login/login.service';
export { registerService } from './register/register.service';
export { autoLoginService } from './autoLogin/autoLogin.service';
export { logoutService } from './logout/logout.service';

// Utilidades
export { mapUserToUserData } from './user.mapper';
