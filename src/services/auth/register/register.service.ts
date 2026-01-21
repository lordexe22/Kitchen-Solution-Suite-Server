// Servicio de registro de usuarios
import { db } from '../../../db/init';
import { usersTable, apiPlatformsTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../utils/password.utils';
import { createJWT, setJWTCookie } from '../../../lib/modules/jwtCookieManager';
import { mapUserToUserData } from '../user.mapper';
import type { RegisterPayload, RegisterResult, UserData } from './types';

export type { RegisterPayload, RegisterResult, UserData } from './types';

export async function registerService(payload: RegisterPayload): Promise<RegisterResult> {
  const validatedPayload = validatePayload(payload);
  await checkUserDoesNotExist(validatedPayload.email);

  const passwordHash = validatedPayload.platformName === 'local' && validatedPayload.password
    ? await hashPassword(validatedPayload.password)
    : '';

  const userId = await createUser({
    firstName: validatedPayload.firstName,
    lastName: validatedPayload.lastName,
    email: validatedPayload.email,
    passwordHash,
    imageUrl: validatedPayload.imageUrl ?? null,
  });

  if (validatedPayload.platformName === 'google' && validatedPayload.platformToken) {
    await savePlatformToken(userId, 'google', validatedPayload.platformToken);
  }

  const user = await getUserById(userId);

  const token = createJWT({ userId: user.id });
  const cookieData = setJWTCookie(token);

  return { user, token, cookieData };
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

async function checkUserDoesNotExist(email: string): Promise<void> {
  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingUser) {
    throw new Error('Email already registered');
  }
}

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
      type: 'admin',
      isActive: true,
      state: 'active',
    })
    .returning({ id: usersTable.id });

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  return newUser.id;
}

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

async function getUserById(userId: number): Promise<UserData> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found after creation');
  }

  return mapUserToUserData(user);
}
