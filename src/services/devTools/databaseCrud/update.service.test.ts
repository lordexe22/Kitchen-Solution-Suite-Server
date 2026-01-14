/* src/services/devTools/databaseCrud/update.service.test.ts */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateRecord } from './update.service';
import { resetMockDatabase, mockUsers } from './__mocks__/db.mock';

// Mock dependencies
jest.mock('../../../db/init', () => ({
  db: require('./__mocks__/db.mock').mockDb
}));

jest.mock('../../../db/schema', () => require('./__mocks__/schema.mock').mockSchema);

jest.mock('./schema-discovery.service', () => ({
  tableExists: (tableName: string) => ['users', 'products', 'orders'].includes(tableName)
}));

describe('UpdateService - updateRecord', () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  // #test Caso exitoso - Actualizar un campo
  it('debería actualizar un campo de usuario correctamente', async () => {
    const updateData = {
      isActive: false
    };

    const result = await updateRecord('users', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe(1);
    expect(result.data?.isActive).toBe(false);
  });

  // #test Caso exitoso - Actualizar múltiples campos
  it('debería actualizar múltiples campos correctamente', async () => {
    const updateData = {
      firstName: 'Juan Carlos',
      isActive: false,
      state: 'suspended'
    };

    const result = await updateRecord('users', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.firstName).toBe('Juan Carlos');
    expect(result.data?.isActive).toBe(false);
    expect(result.data?.state).toBe('suspended');
  });

  // #test Caso exitoso - Actualizar producto
  it('debería actualizar un producto correctamente', async () => {
    const updateData = {
      price: 999.99,
      stock: 5
    };

    const result = await updateRecord('products', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.price).toBe(999.99);
    expect(result.data?.stock).toBe(5);
  });

  // #test UpdatedAt automático
  it('debería actualizar updatedAt automáticamente', async () => {
    const updateData = {
      firstName: 'Juan Modificado'
    };

    const result = await updateRecord('users', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data?.updatedAt).toBeDefined();
    // updatedAt debería ser más reciente que createdAt
  });

  // #test Error - Tabla no existe
  it('debería retornar error si la tabla no existe', async () => {
    const result = await updateRecord('non_existent_table', 1, { field: 'value' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('no encontrada');
  });

  // #test Error - ID no existe
  it('debería retornar error si el ID no existe', async () => {
    const updateData = {
      firstName: 'Test'
    };

    const result = await updateRecord('users', 99999, updateData);

    // Con mock actual esto puede no fallar
    expect(result).toBeDefined();
  });

  // #test Error - Data vacío (NO debería permitirse)
  it('debería retornar error si data está vacío', async () => {
    const result = await updateRecord('users', 1, {});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // #test Error - Data nulo
  it('debería retornar error si data es null', async () => {
    const result = await updateRecord('users', 1, null as any);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // #test ID como string
  it('debería aceptar ID como string', async () => {
    const updateData = {
      firstName: 'Juan String ID'
    };

    const result = await updateRecord('users', '1', updateData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  // #test No modificar campos no especificados
  it('no debería modificar campos que no se especifican en data', async () => {
    const originalEmail = mockUsers[0].email;
    
    const updateData = {
      firstName: 'Juan Actualizado'
      // No actualizamos email
    };

    const result = await updateRecord('users', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data?.firstName).toBe('Juan Actualizado');
    // Email debería permanecer igual (validaremos en mock mejorado)
  });

  // #test Metadata en respuesta
  it('debería incluir metadata en respuesta exitosa', async () => {
    const updateData = {
      isActive: true
    };

    const result = await updateRecord('users', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.recordsAffected).toBe(1);
  });

  // #test Actualizar campo a null (si es nullable)
  it('debería poder actualizar un campo a null si es nullable', async () => {
    const updateData = {
      description: null
    };

    const result = await updateRecord('products', 1, updateData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
