// src/services/company/checkNameAvailability/checkNameAvailability.service.test.ts
jest.mock('../../../db/init');

import { checkNameAvailability } from './checkNameAvailability.service';
import { db } from '../../../db/init';

const mockDb = db as jest.Mocked<typeof db>;

/**
 * Tests para el servicio checkNameAvailability
 * 
 * Casos a cubrir:
 * 1. Nombre disponible (no existe)
 * 2. Nombre no disponible (ya existe)
 * 3. Nombre con diferentes mayúsculas (case-insensitive)
 * 4. Nombre con espacios extras (normalización)
 * 5. Nombre vacío o inválido
 * 6. Nombre de compañía archivada (debe considerarse ocupado)
 */

describe('checkNameAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería retornar true si el nombre no existe', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const result = await checkNameAvailability('Nueva Empresa Única');
    expect(result).toBe(true);
  });

  test('debería retornar false si el nombre ya existe', async () => {
    const mockCompany = { id: 1 };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCompany]),
        }),
      }),
    } as any);

    const result = await checkNameAvailability('Test Company');
    expect(result).toBe(false);
  });

  test('debería ignorar mayúsculas al comparar nombres', async () => {
    const mockCompany = { id: 1 };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCompany]),
        }),
      }),
    } as any);

    const result1 = await checkNameAvailability('mi empresa');
    const result2 = await checkNameAvailability('MI EMPRESA');
    const result3 = await checkNameAvailability('Mi EMPRESA');

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(result3).toBe(false);
  });

  test('debería normalizar espacios extras', async () => {
    const mockCompany = { id: 1 };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCompany]),
        }),
      }),
    } as any);

    const result1 = await checkNameAvailability('Mi  Empresa');
    const result2 = await checkNameAvailability('Mi   Empresa');
    const result3 = await checkNameAvailability('  Mi Empresa  ');

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(result3).toBe(false);
  });

  test('debería rechazar nombres vacíos', async () => {
    await expect(checkNameAvailability('')).rejects.toThrow();
    await expect(checkNameAvailability('   ')).rejects.toThrow();
  });

  test('debería rechazar valores no válidos', async () => {
    await expect(checkNameAvailability(null as any)).rejects.toThrow();
    await expect(checkNameAvailability(undefined as any)).rejects.toThrow();
    await expect(checkNameAvailability(123 as any)).rejects.toThrow();
  });

  test('debería considerar archivadas como ocupadas', async () => {
    const mockArchivedCompany = { id: 1 };

    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockArchivedCompany]),
        }),
      }),
    } as any);

    const result = await checkNameAvailability('Empresa Archivada');
    expect(result).toBe(false);
  });

  test('debería retornar true si no encuentra coincidencias', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const result = await checkNameAvailability('Empresa Única');
    expect(result).toBe(true);
  });
});
