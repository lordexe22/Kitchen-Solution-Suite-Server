// Servicio de auto-login (token en cookie)
import { getJWTFromCookie, decodeJWT, createJWT, setJWTCookie } from '../../../lib/modules/jwtCookieManager';
import { db } from '../../../db/init';
import { usersTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { mapUserToUserData } from '../user.mapper';
import type { AutoLoginPayload, AutoLoginResult, AutoLoginStatusCode } from './types';

export type { AutoLoginPayload, AutoLoginResult, AutoLoginStatusCode } from './types';

export async function autoLoginService(req: AutoLoginPayload): Promise<AutoLoginResult> {
  const token = getJWTFromCookie((req as any).cookies);
  if (!token) {
    return buildFailure('NO_TOKEN');
  }

  let payload: any;
  try {
    payload = decodeJWT(token);
  } catch (err: any) {
    const message = (err && err.message) || '';
    const code: AutoLoginStatusCode = message.includes('expired') ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN';
    return buildFailure(code);
  }

  if (!payload || typeof payload !== 'object' || !(payload as any).userId) {
    return buildFailure('INVALID_TOKEN');
  }

  const userId = Number((payload as any).userId);
  if (!Number.isFinite(userId)) {
    return buildFailure('INVALID_TOKEN');
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return buildFailure('USER_NOT_FOUND');
  }

  if (user.state === 'suspended') {
    return buildFailure('USER_SUSPENDED');
  }

  const userData = mapUserToUserData(user);

  const newToken = createJWT({ userId: user.id });
  const cookieData = setJWTCookie(newToken);

  return { user: userData, statusCode: 'SUCCESS', cookieData };
}

function buildFailure(statusCode: AutoLoginStatusCode): AutoLoginResult {
  return {
    statusCode,
  };
}
