// Servicio de registro de usuarios
import { db } from '../../../db/init';
import { usersTable, apiPlatformsTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../utils/password.utils';
import { createJWT, setJWTCookie } from '../../../lib/modules/jwtCookieManager';
import { mapUserToUserData } from '../user.mapper';
import type { RegisterPayload, RegisterResult, UserData } from '../types';

export type { RegisterPayload, RegisterResult, UserData } from '../types';

export async function registerService(payload: RegisterPayload): Promise<RegisterResult> {
  const validatedPayload = validatePayload(payload);

  const passwordHash = validatedPayload.platformName === 'local' && validatedPayload.password
    ? await hashPassword(validatedPayload.password)
    : '';

  try {
    const user = await db.transaction(async (tx) => {
      // Crear usuario - UNIQUE constraint previene duplicados
      const [newUser] = await tx
        .insert(usersTable)
        .values({
          firstName: validatedPayload.firstName,
          lastName: validatedPayload.lastName,
          email: validatedPayload.email,
          passwordHash,
          imageUrl: validatedPayload.imageUrl ?? null,
          type: 'admin',
          state: 'active',
        })
        .returning();

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      // Guardar token de plataforma (si aplica)
      if (validatedPayload.platformName === 'google' && validatedPayload.platformToken) {
        await tx.insert(apiPlatformsTable).values({
          userId: newUser.id,
          platformName: 'google',
          platformToken: validatedPayload.platformToken,
        });
      }

      return mapUserToUserData(newUser);
    });

    const token = createJWT({ userId: user.id, state: user.state });
    const cookieData = setJWTCookie(token);

    return { user, token, cookieData };
  } catch (error: any) {
    // Manejar unique constraint violation
    if (error.code === '23505') {
      throw new Error('Email already registered');
    }
    throw error;
  }
}

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


