/* Servicio de autenticación (Login) */

import { validateGoogleToken } from '../../../lib/utils/authentication/validateGoogleToken';
import { createJWT, setJWTCookie } from '../../../lib/modules/jwtCookieManager';
import { comparePassword } from '../../../utils/password.utils';
import { db } from '../../../db/init';
import { usersTable, apiPlatformsTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { mapUserToUserData } from '../user.mapper';
import type { LoginPayload, LoginResult, UserData } from './types';

export type { LoginPayload, LoginResult, UserData } from './types';

export async function loginService(payload: LoginPayload): Promise<LoginResult> {
  validatePayload(payload);
  const user = await authenticateUser(payload);

  const token = createJWT({ userId: user.id, state: user.state });
  const cookieData = setJWTCookie(token);

  return { user, token, cookieData };
}

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

async function authenticateUser(payload: LoginPayload): Promise<UserData> {
  if (payload.platformName === 'local') {
    return await authenticateLocalUser(payload.email!, payload.password!);
  }
  return await authenticateGoogleUser(payload.credential!);
}

async function authenticateLocalUser(email: string, password: string): Promise<UserData> {
  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return mapUserToUserData(user);
}

async function authenticateGoogleUser(credential: string): Promise<UserData> {
  const googlePayload = await validateGoogleToken(credential);
  const userId = googlePayload.sub;

  const [platform] = await db
    .select()
    .from(apiPlatformsTable)
    .where(eq(apiPlatformsTable.platformToken, userId))
    .limit(1);

  if (!platform) {
    throw new Error('Invalid Google token or user not registered');
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, platform.userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.state === 'suspended') {
    throw new Error('User account is suspended');
  }

  return mapUserToUserData(user);
}
