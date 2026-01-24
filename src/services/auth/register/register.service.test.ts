// src/services/auth/register/register.service.test.ts

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
            // Simular UNIQUE constraint en email
            const emailExists = mockStore.users.some((u) => u.email === data.email);
            if (emailExists) {
              const error: any = new Error('duplicate key value violates unique constraint');
              error.code = '23505';
              throw error;
            }
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
    transaction: async (callback: (tx: any) => Promise<any>) => {
      // Mock de transacción: simplemente ejecuta el callback con el mismo db
      return await callback(db);
    },
    __store: mockStore,
  } as any;

  return { db };
});

import { registerService } from './register.service';
import type { RegisterPayload } from '../types';
import { db } from '../../../db/init';
import { usersTable, apiPlatformsTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';

describe('registerService', () => {
  const createdUserIds: number[] = [];

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(apiPlatformsTable).where(eq(apiPlatformsTable.userId, userId));
      await db.delete(usersTable).where(eq(usersTable.id, userId));
    }
  });

  describe('Validación de payload', () => {
    it('debería fallar si no se provee platformName', async () => {
      const payload = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      } as any;

      await expect(registerService(payload)).rejects.toThrow('Invalid platform');
    });

    it('debería fallar si platformName es inválido', async () => {
      const payload = {
        platformName: 'facebook',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      } as any;

      await expect(registerService(payload)).rejects.toThrow('Invalid platform');
    });

    it('debería fallar si faltan campos requeridos', async () => {
      const payload = {
        platformName: 'local',
        firstName: 'Test',
      } as any;

      await expect(registerService(payload)).rejects.toThrow('Missing required fields');
    });

    it('debería fallar si falta password para local', async () => {
      const payload: RegisterPayload = {
        platformName: 'local',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };

      await expect(registerService(payload)).rejects.toThrow('Password required for local registration');
    });

    it('debería fallar si falta platformToken para Google', async () => {
      const payload: RegisterPayload = {
        platformName: 'google',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      };

      await expect(registerService(payload)).rejects.toThrow('Platform token required for Google registration');
    });
  });

  describe('Registro local', () => {
    it('debería registrar exitosamente un nuevo usuario', async () => {
      const payload: RegisterPayload = {
        platformName: 'local',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.local@example.com',
        password: 'SecurePassword123!',
      };

      const result = await registerService(payload);
      createdUserIds.push(result.user.id);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(payload.email.toLowerCase());
      expect(result.user.firstName).toBe(payload.firstName);
      expect(result.user.lastName).toBe(payload.lastName);
      expect(result.user.type).toBe('admin');
      expect(result.user.state).toBe('active');
      expect(result.token).toBeTruthy();
    });

    it('debería impedir registrar un email duplicado', async () => {
      const payload: RegisterPayload = {
        platformName: 'local',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'duplicate.local@example.com',
        password: 'SecurePassword123!',
      };

      const result = await registerService(payload);
      createdUserIds.push(result.user.id);

      await expect(registerService(payload)).rejects.toThrow('Email already registered');
    });
  });

  describe('Registro Google', () => {
    it('debería registrar exitosamente un usuario de Google', async () => {
      const payload: RegisterPayload = {
        platformName: 'google',
        firstName: 'Gina',
        lastName: 'Google',
        email: 'gina.google@example.com',
        platformToken: 'google_sub_12345',
        credential: 'google_id_token',
        imageUrl: 'https://example.com/avatar.jpg',
      };

      const result = await registerService(payload);
      createdUserIds.push(result.user.id);

      expect(result.user.email).toBe(payload.email.toLowerCase());
      expect(result.user.imageUrl).toBe(payload.imageUrl);
      expect(result.token).toBeTruthy();
    });

    it('debería fallar si el email ya existe en Google', async () => {
      const payload: RegisterPayload = {
        platformName: 'google',
        firstName: 'Greg',
        lastName: 'Google',
        email: 'greg.google@example.com',
        platformToken: 'google_sub_dup',
        credential: 'google_id_token_dup',
        imageUrl: null,
      };

      const first = await registerService(payload);
      createdUserIds.push(first.user.id);

      await expect(registerService(payload)).rejects.toThrow('Email already registered');
    });
  });
});