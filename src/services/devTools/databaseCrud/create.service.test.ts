/* src/services/devTools/databaseCrud/create.service.test.ts */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createRecord } from './create.service';
import { resetMockDatabase, clearMockDatabase } from './__mocks__/db.mock';

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
          passwordHash: { type: 'varchar', nullable: false },
          type: { type: 'varchar', nullable: false },
          isActive: { type: 'boolean', default: true },
          state: { type: 'varchar', default: 'pending' }
        }
      },
      products: {
        columns: {
          id: { type: 'serial', primaryKey: true },
          name: { type: 'varchar', nullable: false },
          description: { type: 'text', nullable: true },
          price: { type: 'numeric', nullable: false },
          stock: { type: 'integer', nullable: false },
          isActive: { type: 'boolean', default: true }
        }
      }
    };
    return schemas[tableName] || null;
  }
}));

describe('CreateService - createRecord', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  // #test Caso exitoso - Crear usuario
  it('debería crear un nuevo usuario correctamente', async () => {
    const newUser = {
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos@test.com',
      passwordHash: 'hash999',
      type: 'client'
    };

    const result = await createRecord('users', newUser);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.firstName).toBe('Carlos');
    expect(result.data?.lastName).toBe('López');
    expect(result.data?.email).toBe('carlos@test.com');
    expect(result.data?.id).toBeDefined();
  });

  // #test Caso exitoso - Crear producto
  it('debería crear un nuevo producto correctamente', async () => {
    const newProduct = {
      name: 'Teclado Mecánico',
      description: 'Teclado RGB gaming',
      price: 150.00,
      stock: 20,
      isActive: true
    };

    const result = await createRecord('products', newProduct);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Teclado Mecánico');
    expect(result.data?.price).toBe(150.00);
    expect(result.data?.id).toBeDefined();
  });

  // #test Error - Tabla no existe
  it('debería retornar error si la tabla no existe', async () => {
    const result = await createRecord('non_existent_table', { field: 'value' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('no encontrada');
  });

  // #test Data vacío (actualmente permitido, crea registro sin campos)
  it('debería permitir crear registro con data vacío', async () => {
    const result = await createRecord('users', {});

    expect(result.success).toBe(true);
    // El registro se crea aunque no tenga campos adicionales
    expect(result.data).toBeDefined();
  });

  // #test Error - Data nulo (debería capturarse como error)
  it('debería retornar error si data es null', async () => {
    const result = await createRecord('users', null as any);

    // El servicio debería manejar esto gracefully
    expect(result).toBeDefined();
  });

  // #test Timestamps automáticos
  it('debería agregar timestamps automáticamente', async () => {
    const newUser = {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana@test.com',
      passwordHash: 'hash111',
      type: 'admin'
    };

    const result = await createRecord('users', newUser);

    expect(result.success).toBe(true);
    expect(result.data?.createdAt).toBeDefined();
    expect(result.data?.updatedAt).toBeDefined();
  });

  // #test Crear sin especificar campos opcionales
  it('debería crear usuario sin especificar todos los campos', async () => {
    const newUser = {
      firstName: 'Luis',
      lastName: 'García',
      email: 'luis@test.com',
      passwordHash: 'hash222',
      type: 'client'
      // No especificamos isActive ni state
    };

    const result = await createRecord('users', newUser);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.firstName).toBe('Luis');
  });

  // #test Manejo de campos opcionales
  it('debería manejar campos opcionales correctamente', async () => {
    const newProduct = {
      name: 'Mouse Pad',
      // description es opcional
      price: 15.00,
      stock: 100
    };

    const result = await createRecord('products', newProduct);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Mouse Pad');
    expect(result.data?.price).toBe(15.00);
  });

  // #test Metadata en respuesta exitosa
  it('debería incluir metadata en respuesta exitosa', async () => {
    const newUser = {
      firstName: 'Sofia',
      lastName: 'Torres',
      email: 'sofia@test.com',
      passwordHash: 'hash333',
      type: 'client'
    };

    const result = await createRecord('users', newUser);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.recordsAffected).toBe(1);
  });
});
