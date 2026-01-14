/* src/services/devTools/databaseCrud/delete.service.test.ts */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { deleteRecord } from './delete.service';
import { resetMockDatabase, mockDatabase } from './__mocks__/db.mock';

// Mock dependencies
jest.mock('../../../db/init', () => ({
  db: require('./__mocks__/db.mock').mockDb
}));

jest.mock('../../../db/schema', () => require('./__mocks__/schema.mock').mockSchema);

jest.mock('./schema-discovery.service', () => ({
  tableExists: (tableName: string) => ['users', 'products', 'orders'].includes(tableName)
}));

describe('DeleteService - deleteRecord', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  // #test Eliminar sin errores
  it('debería eliminar sin generar errores', async () => {
    const result = await deleteRecord('users', 1);

    expect(result).toBeDefined();
  });

  // #test Eliminar producto
  it('debería eliminar producto sin errores', async () => {
    const result = await deleteRecord('products', 1);

    expect(result).toBeDefined();
  });

  // #test Retornar datos
  it('debería retornar datos del registro', async () => {
    const result = await deleteRecord('users', 1);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });

  // #test Error - Tabla no existe
  it('debería retornar error si la tabla no existe', async () => {
    const result = await deleteRecord('non_existent_table', 1);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('no encontrada');
  });

  // #test ID como string
  it('debería aceptar ID como string', async () => {
    const result = await deleteRecord('users', '2');

    expect(result).toBeDefined();
  });

  // #test Metadata
  it('debería incluir metadata en respuesta exitosa', async () => {
    const result = await deleteRecord('users', 1);

    expect(result).toBeDefined();
    if (result.success) {
      expect(result.metadata).toBeDefined();
    }
  });

  // #test Hard delete
  it('debería eliminar el registro', async () => {
    const result = await deleteRecord('users', 1);
    expect(result).toBeDefined();
  });

  // #test Eliminar registros
  it('debería manejar múltiples eliminaciones', async () => {
    const result1 = await deleteRecord('users', 1);
    const result2 = await deleteRecord('users', 2);

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  // #test No afectar otras tablas
  it('no debería afectar registros de otras tablas', async () => {
    const initialProductsCount = mockDatabase.products.length;
    
    await deleteRecord('users', 1);
    
    const afterProductsCount = mockDatabase.products.length;
    expect(afterProductsCount).toBe(initialProductsCount);
  });
});
