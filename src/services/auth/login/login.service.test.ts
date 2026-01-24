// src/services/auth/login/login.service.test.ts

jest.mock('../../../db/schema', () => ({
  usersTable: {
    name: 'users',
    id: 'id',
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    passwordHash: 'passwordHash',
    imageUrl: 'imageUrl',
    type: 'type',
    branchId: 'branchId',
    isActive: 'isActive',
    state: 'state',
  },
  apiPlatformsTable: {
    name: 'api_platforms',
    userId: 'userId',
    platformName: 'platformName',
    platformToken: 'platformToken',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: (column: any, value: any) => ({ column, value }),
}));

jest.mock('../../../db/init', () => {
  const mockStore = { users: [] as any[], platforms: [] as any[] };

  const db = {
    select: () => ({
      from: (table: any) => ({
        where: (cond: any) => ({
          limit: (n: number) => {
            const col = typeof cond?.column === 'string' ? cond.column : cond?.column?.name ?? cond?.column?.columnName;
            if (table.name === 'users') {
              const rows = col ? mockStore.users.filter((u) => u[col] === cond.value) : mockStore.users;
              return rows.slice(0, n);
            }
            if (table.name === 'api_platforms') {
              const rows = col ? mockStore.platforms.filter((p) => p[col] === cond.value) : mockStore.platforms;
              return rows.slice(0, n);
            }
            return [];
          },
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (data: any) => ({
        ...(() => {
          let inserted: any;
          if (table.name === 'users') {
            inserted = { id: mockStore.users.length + 1, ...data };
            mockStore.users.push(inserted);
          } else if (table.name === 'api_platforms') {
            inserted = { ...data };
            mockStore.platforms.push(inserted);
          }

          return {
            returning: (shape?: any) => {
              if (!inserted) return [];
              if (shape && shape.id && inserted.id !== undefined) {
                return [{ id: inserted.id }];
              }
              return [inserted];
            },
          };
        })(),
      }),
    }),
    delete: (table: any) => ({
      where: (cond: any) => {
        if (table.name === 'users') {
          const value = cond.value;
          const filtered = mockStore.users.filter((u) => u.id !== value);
          mockStore.users.length = 0;
          mockStore.users.push(...filtered);
        }
        if (table.name === 'api_platforms') {
          const value = cond.value;
          const filtered = mockStore.platforms.filter((p) => p.userId !== value);
          mockStore.platforms.length = 0;
          mockStore.platforms.push(...filtered);
        }
      },
    }),
    __store: mockStore,
  } as any;

  return { db };
});

import { loginService } from './login.service';
import type { LoginPayload } from '../types';
import { db } from '../../../db/init';
import { usersTable, apiPlatformsTable } from '../../../db/schema';
import { hashPassword } from '../../../utils/password.utils';
import { eq } from 'drizzle-orm';
import { validateGoogleToken } from '../../../lib/utils/authentication/validateGoogleToken';

jest.mock('../../../lib/utils/authentication/validateGoogleToken', () => ({
  validateGoogleToken: jest.fn(),
}));

describe('loginService', () => {
  let testLocalUser: any;
  const testLocalPassword = 'TestPassword123!';

  let testGoogleUser: any;
  const testGoogleSub = 'google_test_sub_12345';
  const mockedValidateGoogleToken = validateGoogleToken as jest.MockedFunction<typeof validateGoogleToken>;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testLocalPassword);
    const [localUser] = await db
      .insert(usersTable)
      .values({
        firstName: 'Test',
        lastName: 'Local',
        email: 'test.local@example.com',
        passwordHash,
        type: 'guest',
        state: 'active',
      })
      .returning();
    testLocalUser = localUser;

    const [googleUser] = await db
      .insert(usersTable)
      .values({
        firstName: 'Test',
        lastName: 'Google',
        email: 'test.google@example.com',
        passwordHash: '',
        type: 'guest',
        state: 'active',
      })
      .returning();
    testGoogleUser = googleUser;

    await db.insert(apiPlatformsTable).values({
      userId: googleUser.id,
      platformName: 'google',
      platformToken: testGoogleSub,
    });
  });

  afterAll(async () => {
    if (testLocalUser) {
      await db.delete(usersTable).where(eq(usersTable.id, testLocalUser.id));
    }
    if (testGoogleUser) {
      await db.delete(apiPlatformsTable).where(eq(apiPlatformsTable.userId, testGoogleUser.id));
      await db.delete(usersTable).where(eq(usersTable.id, testGoogleUser.id));
    }
  });

  beforeEach(() => {
    mockedValidateGoogleToken.mockReset();
  });

  describe('Validación de payload', () => {
    it('debería fallar si no se provee platformName', async () => {
      const payload = {
        email: 'test@example.com',
      } as any;

      await expect(loginService(payload)).rejects.toThrow('Missing platform in body');
    });

    it('debería fallar si platformName es inválido', async () => {
      const payload = {
        platformName: 'facebook',
      } as any;

      await expect(loginService(payload)).rejects.toThrow('Invalid platform value');
    });

    it('debería fallar si faltan email/password para local', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
      };

      await expect(loginService(payload)).rejects.toThrow('Missing email or password');
    });

    it('debería fallar si falta credential para Google', async () => {
      const payload: LoginPayload = {
        platformName: 'google',
      };

      await expect(loginService(payload)).rejects.toThrow('Missing Google credential');
    });
  });

  describe('Login local', () => {
    it('debería autenticar exitosamente con credenciales válidas', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
        email: testLocalUser.email,
        password: testLocalPassword,
      };

      const result = await loginService(payload);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(testLocalUser.email);
      expect(result.user.firstName).toBe(testLocalUser.firstName);
      expect(result.token).toBeTruthy();
    });

    it('debería fallar con email inválido', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
        email: 'nonexistent@example.com',
        password: testLocalPassword,
      };

      await expect(loginService(payload)).rejects.toThrow('Invalid email or password');
    });

    it('debería fallar con password inválido', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
        email: testLocalUser.email,
        password: 'WrongPassword123!',
      };

      await expect(loginService(payload)).rejects.toThrow('Invalid email or password');
    });

    it('debería normalizar el email (lowercase y trim)', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
        email: '  ' + testLocalUser.email.toUpperCase() + '  ',
        password: testLocalPassword,
      };

      const result = await loginService(payload);
      expect(result.user.email).toBe(testLocalUser.email.toLowerCase());
    });
  });

  describe('Login Google', () => {
    it('debería autenticar exitosamente con token de Google válido', async () => {
      mockedValidateGoogleToken.mockResolvedValue({
        sub: testGoogleSub,
        email: testGoogleUser.email,
        email_verified: true,
        name: 'Test Google',
        picture: 'https://example.com/avatar.jpg',
        given_name: 'Test',
        family_name: 'Google',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 600,
        iss: 'https://accounts.google.com',
        aud: 'test-client-id',
      });

      const payload: LoginPayload = {
        platformName: 'google',
        credential: 'fake-google-id-token',
      };

      const result = await loginService(payload);

      expect(mockedValidateGoogleToken).toHaveBeenCalledWith('fake-google-id-token');
      expect(result.user.id).toBe(testGoogleUser.id);
      expect(result.token).toBeTruthy();
    });

    it('debería fallar si el usuario Google no está registrado', async () => {
      mockedValidateGoogleToken.mockResolvedValue({
        sub: 'non_existent_sub_99999',
        email: 'nonexistent@example.com',
        email_verified: true,
        name: 'Ghost User',
        picture: 'https://example.com/avatar.jpg',
        given_name: 'Ghost',
        family_name: 'User',
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 600,
        iss: 'https://accounts.google.com',
        aud: 'test-client-id',
      });

      const payload: LoginPayload = {
        platformName: 'google',
        credential: 'fake-google-id-token-missing-user',
      };

      await expect(loginService(payload)).rejects.toThrow('Invalid Google token or user not registered');
      expect(mockedValidateGoogleToken).toHaveBeenCalled();
    });
  });

  describe('Usuario suspendido', () => {
    let suspendedUser: any;

    beforeAll(async () => {
      const passwordHash = await hashPassword('SuspendedPassword123!');
      const [user] = await db
        .insert(usersTable)
        .values({
          firstName: 'Suspended',
          lastName: 'User',
          email: 'suspended@example.com',
          passwordHash,
          type: 'guest',
          state: 'suspended',
        })
        .returning();
      suspendedUser = user;
    });

    afterAll(async () => {
      if (suspendedUser) {
        await db.delete(usersTable).where(eq(usersTable.id, suspendedUser.id));
      }
    });

    it('debería rechazar login de usuario suspendido con local', async () => {
      const payload: LoginPayload = {
        platformName: 'local',
        email: suspendedUser.email,
        password: 'SuspendedPassword123!',
      };

      await expect(loginService(payload)).rejects.toThrow('User account is suspended');
    });
  });
});
