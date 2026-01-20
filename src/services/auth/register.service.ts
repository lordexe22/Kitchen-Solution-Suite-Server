// src/services/auth/register.service.ts

/**
 * Servicio de registro de usuarios
 * 
 * Responsabilidad: Registrar nuevos usuarios mediante credenciales locales o Google OAuth.
 * Este servicio es independiente de Express y puede ser reutilizado en cualquier contexto.
 */

// #section Imports
import { db } from '../../db/init';
import { usersTable, apiPlatformsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../utils/password.utils';
import { createJWT } from '../../lib/modules/jwtCookieManager';
// #end-section

// #section Types
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
}

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  type: 'admin' | 'employee' | 'guest' | 'dev';
  branchId: number | null;
  state: 'pending' | 'active' | 'suspended';
}
// #end-section

// #service registerService
/**
 * Servicio principal de registro.
 * 
 * Flujo:
 * 1. Valida el payload de entrada
 * 2. Verifica que el usuario no exista
 * 3. Hashea la contraseña (si es registro local)
 * 4. Crea el usuario en la base de datos
 * 5. Guarda el token de plataforma (si es Google)
 * 6. Obtiene los datos completos del usuario creado
 * 7. Genera un JWT para la sesión
 * 8. Retorna los datos del usuario y el token
 * 
 * @param payload - Datos de registro
 * @returns Objeto con datos del usuario registrado y token JWT
 * @throws Error si el usuario ya existe o los datos son inválidos
 */
export async function registerService(payload: RegisterPayload): Promise<RegisterResult> {
  // PASO 1: Validar payload
  const validatedPayload = validatePayload(payload);
  
  // PASO 2: Verificar que el usuario no exista
  await checkUserDoesNotExist(validatedPayload.email);
  
  // PASO 3: Hashear contraseña si es registro local
  const passwordHash = validatedPayload.platformName === 'local' && validatedPayload.password
    ? await hashPassword(validatedPayload.password)
    : '';
  
  // PASO 4: Crear usuario en BD
  const userId = await createUser({
    firstName: validatedPayload.firstName,
    lastName: validatedPayload.lastName,
    email: validatedPayload.email,
    passwordHash,
    imageUrl: validatedPayload.imageUrl ?? null,
  });
  
  // PASO 5: Guardar token de plataforma si es Google
  if (validatedPayload.platformName === 'google' && validatedPayload.platformToken) {
    await savePlatformToken(userId, 'google', validatedPayload.platformToken);
  }
  
  // PASO 6: Obtener datos completos del usuario
  const user = await getUserById(userId);
  
  // PASO 7: Generar JWT
  const token = createJWT({ userId: user.id });
  
  // PASO 8: Retornar resultado
  return { user, token };
}
// #end-service

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES INTERNAS (privadas al servicio)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Valida que el payload contenga los campos requeridos.
 */
function validatePayload(payload: RegisterPayload): RegisterPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request body');
  }

  const { platformName, firstName, lastName, email, password, platformToken } = payload;

  if (!platformName || (platformName !== 'local' && platformName !== 'google')) {
    throw new Error('Invalid platform');
  }

  if (!firstName || !lastName || !email) {
    throw new Error('Missing required fields');
  }

  if (platformName === 'local' && !password) {
    throw new Error('Password required for local registration');
  }

  if (platformName === 'google' && !platformToken) {
    throw new Error('Platform token required for Google registration');
  }

  // Normalizar datos
  return {
    platformName,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password: platformName === 'local' ? password : undefined,
    platformToken: platformName === 'google' ? platformToken : undefined,
    imageUrl: payload.imageUrl || null,
  };
}

/**
 * Verifica que el usuario no exista en la base de datos.
 */
async function checkUserDoesNotExist(email: string): Promise<void> {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('User already exists');
  }
}

/**
 * Crea un nuevo usuario en la base de datos.
 */
async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  imageUrl: string | null;
}): Promise<number> {
  const [newUser] = await db
    .insert(usersTable)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash: data.passwordHash,
      imageUrl: data.imageUrl,
      type: 'guest',
      isActive: false,
      state: 'pending',
    })
    .returning({ id: usersTable.id });

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  return newUser.id;
}

/**
 * Guarda el token de plataforma externa en la tabla api_platforms.
 */
async function savePlatformToken(
  userId: number,
  platformName: 'google',
  platformToken: string
): Promise<void> {
  await db.insert(apiPlatformsTable).values({
    userId,
    platformName,
    platformToken,
  });
}

/**
 * Obtiene los datos completos de un usuario por su ID.
 */
async function getUserById(userId: number): Promise<UserData> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found after creation');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl ?? null,
    type: user.type,
    branchId: user.branchId ?? null,
    state: user.state,
  };
}
