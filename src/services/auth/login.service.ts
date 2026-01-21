/* src/services/auth/login.service.ts */

/**
 * Servicio de autenticación (Login)
 * 
 * Responsabilidad: Autenticar usuarios mediante credenciales locales o Google OAuth.
 * Este servicio es independiente de Express y puede ser reutilizado en cualquier contexto.
 */

// #section Imports
import { validateGoogleToken } from '../../lib/utils/authentication/validateGoogleToken';
import { CookieData, createJWT, setJWTCookie } from '../../lib/modules/jwtCookieManager';
import { comparePassword } from '../../utils/password.utils';
import { db } from '../../db/init';
import { usersTable, apiPlatformsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { mapUserToUserData } from './user.mapper';
// #end-section
// #section Types
// #interface LoginPayload
export interface LoginPayload {
  platformName: 'local' | 'google';
  email?: string;
  password?: string;
  credential?: string;
}
// #end-interface
// #interface LoginResult
export interface LoginResult {
  user: UserData;
  token: string;
  cookieData: CookieData;
}
// #end-interface
// #interface UserData
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
// #end-interface
// #end-section
// #service loginService
/**
 * Servicio principal de login.
 * 
 * Flujo:
 * 1. Valida el payload de entrada
 * 2. Autentica al usuario según la plataforma (local o Google)
 * 3. Genera un JWT para la sesión
 * 4. Retorna los datos del usuario y el token
 * 
 * @param payload - Datos de login (email/password para local, credential para Google)
 * @returns Objeto con datos del usuario y token JWT
 * @throws Error si las credenciales son inválidas o el usuario está suspendido
 */
export async function loginService(payload: LoginPayload): Promise<LoginResult> {
  // #step 1: Validate payload
  validatePayload(payload);
  // #end-step
  // #step 2: Authenticate user by platform
  const user = await authenticateUser(payload);
  // #end-step
  // #step 3: Generate JWT and cookie data
  const token = createJWT({ userId: user.id });
  const cookieData = setJWTCookie(token);
  // #end-step
  // #step 4: Return result with cookie ready to set
  return { user, token, cookieData };
  // #end-step

}
// #end-service
// #section Internal Functions
// #function validatePayload
/**
 * Valida que el payload contenga los campos requeridos según la plataforma.
 */
function validatePayload(payload: LoginPayload): void {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request body');
  }

  if (!payload.platformName) {
    throw new Error('Missing platform in body');
  }

  if (payload.platformName === 'local') {
    if (!payload.email || !payload.password) {
      throw new Error('Missing email or password');
    }
  } else if (payload.platformName === 'google') {
    if (!payload.credential) {
      throw new Error('Missing Google credential');
    }
  } else {
    throw new Error('Invalid platform value');
  }
}
// #end-function
// #function authenticateUser
/**
 * Autentica al usuario según la plataforma especificada.
 */
async function authenticateUser(payload: LoginPayload): Promise<UserData> {
  if (payload.platformName === 'local') {
    return await authenticateLocalUser(payload.email!, payload.password!);
  }
  
  return await authenticateGoogleUser(payload.credential!);
}
// #end-function
// #function authenticateLocalUser
/**
 * Autentica un usuario con credenciales locales (email/password).
 * 
 * @param email - Email del usuario
 * @param password - Contraseña sin hashear
 * @returns Datos del usuario autenticado
 * @throws Error si las credenciales son inválidas
 */
async function authenticateLocalUser(email: string, password: string): Promise<UserData> {
  // Buscar usuario por email
  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verificar contraseña
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return mapUserToUserData(user);
}
// #end-function
// #function authenticateGoogleUser
/**
 * Autentica un usuario con Google OAuth.
 * 
 * Flujo:
 * 1. Valida la firma del token JWT de Google
 * 2. Extrae el 'userId' (Google User ID) del token validado
 * 3. Busca el usuario en la tabla api_platforms usando el userId de Google
 * 4. Obtiene los datos completos del usuario
 * 5. Valida que el usuario no esté suspendido
 * 
 * @param credential - Token JWT completo de Google
 * @returns Datos del usuario autenticado
 * @throws Error si el token es inválido o el usuario no está registrado
 */
async function authenticateGoogleUser(credential: string): Promise<UserData> {
  // PASO 1: Validar firma del token de Google
  const googlePayload = await validateGoogleToken(credential);
  
  // PASO 2: Extraer userId (Google User ID)
  const userId = googlePayload.sub;
  
  // PASO 3: Buscar usuario en api_platforms
  const [platform] = await db
    .select()
    .from(apiPlatformsTable)
    .where(eq(apiPlatformsTable.platformToken, userId))
    .limit(1);

  if (!platform) {
    throw new Error('Invalid Google token or user not registered');
  }

  // PASO 4: Obtener datos del usuario
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, platform.userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // PASO 5: Validar estado del usuario
  if (user.state === 'suspended') {
    throw new Error('User account is suspended');
  }

  return mapUserToUserData(user);
}
// #end-function
// #end-section