/* src/services/devTools/databaseCrud/crud-integration.test.ts */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createRecord } from './create.service';
import { readRecords, readRecordById } from './read.service';
import { updateRecord } from './update.service';
import { deleteRecord } from './delete.service';
import { resetMockDatabase, clearMockDatabase, mockDatabase } from './__mocks__/db.mock';

// Mock dependencies
jest.mock('../../../db/init', () => ({
  db: require('./__mocks__/db.mock').mockDb
}));

jest.mock('../../../db/schema', () => require('./__mocks__/schema.mock').mockSchema);

jest.mock('./schema-discovery.service', () => ({
  tableExists: (tableName: string) => ['users', 'products', 'orders'].includes(tableName),
  getTableSchema: (tableName: string) => {
    const schemas: any = {
      users: {
        columns: {
          id: { type: 'serial', primaryKey: true },
          firstName: { type: 'varchar', nullable: false },
          lastName: { type: 'varchar', nullable: false },
          email: { type: 'varchar', nullable: false },
          type: { type: 'varchar', nullable: false }
        }
      }
    };
    return schemas[tableName] || null;
  }
}));

describe('CRUD Integration Tests', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  // #test Flujo CREATE exitoso
  it('debería crear registros exitosamente', async () => {
    const newUser = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration@test.com',
      passwordHash: 'hash_integration',
      type: 'client'
    };

    const createResult = await createRecord('users', newUser);
    expect(createResult.success).toBe(true);
    expect(createResult.data?.id).toBeDefined();
  });

  // #test Crear múltiples registros
  it('debería crear múltiples usuarios', async () => {
    // Crear 3 usuarios nuevos
    const result1 = await createRecord('users', {
      firstName: 'User1',
      lastName: 'Test',
      email: 'user1@test.com',
      passwordHash: 'hash1',
      type: 'client'
    });

    const result2 = await createRecord('users', {
      firstName: 'User2',
      lastName: 'Test',
      email: 'user2@test.com',
      passwordHash: 'hash2',
      type: 'client'
    });

    const result3 = await createRecord('users', {
      firstName: 'User3',
      lastName: 'Test',
      email: 'user3@test.com',
      passwordHash: 'hash3',
      type: 'admin'
    });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
  });

  // #test Actualizar registros creados
  it('debería actualizar registros correctamente', async () => {
    // Crear un usuario
    const userResult = await createRecord('users', {
      firstName: 'UpdateTest',
      lastName: 'User',
      email: 'update@test.com',
      passwordHash: 'hash',
      type: 'client'
    });

    const userId = userResult.data?.id;
    expect(userId).toBeDefined();

    // Actualizar
    const updateResult = await updateRecord('users', userId, {
      firstName: 'Updated Name'
    });

    expect(updateResult.success).toBe(true);
  });

  // #test Operaciones en diferentes tablas
  it('debería realizar operaciones en diferentes tablas', async () => {
    // Crear usuario
    const userResult = await createRecord('users', {
      firstName: 'Multi',
      lastName: 'Table',
      email: 'multi@test.com',
      passwordHash: 'hash',
      type: 'client'
    });

    // Crear producto
    const productResult = await createRecord('products', {
      name: 'Test Product',
      description: 'For testing',
      price: 100,
      stock: 10
    });

    expect(userResult.success).toBe(true);
    expect(productResult.success).toBe(true);
  });

  // #test Manejo de errores en cadena
  it('debería manejar errores sin afectar operaciones subsecuentes', async () => {
    // Intentar crear en tabla inexistente
    const errorResult = await createRecord('non_existent', { field: 'value' });
    expect(errorResult.success).toBe(false);

    // La siguiente operación válida debería funcionar
    const validResult = await createRecord('users', {
      firstName: 'After',
      lastName: 'Error',
      email: 'after@test.com',
      passwordHash: 'hash',
      type: 'client'
    });

    expect(validResult.success).toBe(true);
  });

  // #test DELETE exitoso
  it('debería eliminar registros correctamente', async () => {
    const deleteResult = await deleteRecord('users', 1);
    expect(deleteResult.success).toBe(true);
  });

  // #test Múltiples operaciones DELETE
  it('debería eliminar registros', async () => {
    const result1 = await deleteRecord('users', 1);
    expect(result1.success).toBe(true);
  });

  // #test Timestamps en CREATE
  it('debería incluir timestamps en registros creados', async () => {
    const createResult = await createRecord('users', {
      firstName: 'Timestamp',
      lastName: 'Test',
      email: 'timestamp@test.com',
      passwordHash: 'hash',
      type: 'client'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.data?.createdAt).toBeDefined();
    expect(createResult.data?.updatedAt).toBeDefined();
  });
});

describe('CRUD Error Handling Integration', () => {
  beforeEach(() => {
    clearMockDatabase();
  });

  // #test Operaciones con datos válidos
  it('debería completar operaciones CRUD válidas', async () => {
    // CREATE
    const createResult = await createRecord('users', {
      firstName: 'Valid',
      lastName: 'User',
      email: 'valid@test.com',
      passwordHash: 'hash',
      type: 'client'
    });
    expect(createResult.success).toBe(true);

    // UPDATE
    const updateResult = await updateRecord('users', 1, {
      firstName: 'Updated'
    });
    expect(updateResult.success).toBe(true);

    // DELETE
    const deleteResult = await deleteRecord('users', 1);
    expect(deleteResult.success).toBe(true);
  });

  // #test Manejo de tablas inexistentes
  it('debería manejar tablas inexistentes gracefully', async () => {
    const createResult = await createRecord('non_existent_table', {
      field: 'value'
    });
    expect(createResult.success).toBe(false);
    expect(createResult.error).toBeDefined();
  });

  // #test Múltiples operaciones sin corrupción
  it('debería mantener integridad después de múltiples operaciones', async () => {
    // Crear
    const create1 = await createRecord('users', {
      firstName: 'User1',
      lastName: 'Test',
      email: 'user1@test.com',
      passwordHash: 'hash1',
      type: 'client'
    });
    expect(create1.success).toBe(true);

    // Error (tabla inexistente)
    const error = await createRecord('invalid_table', { test: 'data' });
    expect(error.success).toBe(false);

    // Crear otro (debería funcionar sin problemas)
    const create2 = await createRecord('users', {
      firstName: 'User2',
      lastName: 'Test',
      email: 'user2@test.com',
      passwordHash: 'hash2',
      type: 'client'
    });
    expect(create2.success).toBe(true);
  });
});
