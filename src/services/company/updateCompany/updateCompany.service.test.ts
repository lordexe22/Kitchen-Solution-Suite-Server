/**
 * Tests para updateCompanyService
 *
 * Cubre actualización exitosa, validaciones, cambio de nombre,
 * permisos, y manejo de errores.
 */

import { updateCompanyService } from './updateCompany.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('updateCompanyService', () => {
  const mockCompany = {
    id: 1,
    name: 'tech solutions',
    description: 'Original description',
    ownerId: 1,
    logoUrl: 'https://example.com/logo.png',
    state: 'active',
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock de transaction que ejecuta el callback
    (mockDb.transaction as any) = jest.fn().mockImplementation(async (callback) => {
      const mockTx = {
        select: jest.fn(),
        update: jest.fn(),
      };
      return await callback(mockTx);
    });
  });

  describe('Happy Path - Actualización Exitosa', () => {
    it('should update only description', async () => {
      const updateInput = {
        description: 'Updated description',
      };

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  { ...mockCompany, description: 'Updated description', updatedAt: new Date() },
                ]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      const result = await updateCompanyService(1, 1, updateInput);

      expect(result.description).toBe('Updated description');
      expect(result.name).toBe('tech solutions');
    });

    it('should update only logo URL', async () => {
      const updateInput = {
        logoUrl: 'https://example.com/new-logo.png',
      };

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  { ...mockCompany, logoUrl: 'https://example.com/new-logo.png', updatedAt: new Date() },
                ]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      const result = await updateCompanyService(1, 1, updateInput);

      expect(result.logoUrl).toBe('https://example.com/new-logo.png');
    });

    it('should update name if it changes and is available', async () => {
      const updateInput = {
        name: 'New Company Name',
      };

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  { ...mockCompany, name: 'new company name', updatedAt: new Date() },
                ]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      const result = await updateCompanyService(1, 1, updateInput);

      expect(result.name).toBe('new company name');
    });

    it('should not update if same name is provided', async () => {
      const updateInput = {
        name: 'tech solutions', // Same as existing
      };

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn()
            .mockReturnValueOnce({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  for: jest.fn().mockResolvedValue([mockCompany]),
                }),
              }),
            })
            .mockReturnValueOnce({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          update: jest.fn(),
        };
        return await callback(mockTx);
      });

      const result = await updateCompanyService(1, 1, updateInput);

      expect(result).toEqual(mockCompany);
    });

    it('should return unchanged company if no fields provided', async () => {
      const updateInput = {};

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn()
            .mockReturnValueOnce({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  for: jest.fn().mockResolvedValue([mockCompany]),
                }),
              }),
            })
            .mockReturnValueOnce({
              from: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          update: jest.fn(),
        };
        return await callback(mockTx);
      });

      const result = await updateCompanyService(1, 1, updateInput);

      expect(result).toEqual(mockCompany);
    });
  });

  describe('Validaciones de Entrada', () => {
    it('should throw error if company ID is invalid', async () => {
      await expect(updateCompanyService(0, 1, { name: 'Test' })).rejects.toThrow(
        'Invalid company ID'
      );
    });

    it('should throw error if user ID is invalid', async () => {
      await expect(updateCompanyService(1, 0, { name: 'Test' })).rejects.toThrow(
        'Invalid user ID'
      );
    });

    it('should throw error if name is empty', async () => {
      await expect(updateCompanyService(1, 1, { name: '   ' })).rejects.toThrow(
        'Company name cannot be empty'
      );
    });

    it('should throw error if name exceeds max length', async () => {
      await expect(updateCompanyService(1, 1, { name: 'a'.repeat(256) })).rejects.toThrow(
        'Company name must be 255 characters or less'
      );
    });

    it('should throw error if description exceeds max length', async () => {
      await expect(
        updateCompanyService(1, 1, { description: 'x'.repeat(1001) })
      ).rejects.toThrow('Company description must be 1000 characters or less');
    });
  });

  describe('Validación de Permisos', () => {
    it('should throw error if user is not owner', async () => {
      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([{ ...mockCompany, ownerId: 2 }]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      await expect(updateCompanyService(1, 999, { name: 'New Name' })).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('Validación de Nombre Duplicado', () => {
    it('should throw error if new name already exists', async () => {
      const updateInput = {
        name: 'Existing Name',
      };

      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockImplementation(() => {
                  const error: any = new Error('duplicate key value violates unique constraint');
                  error.code = '23505';
                  throw error;
                }),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      await expect(updateCompanyService(1, 1, updateInput)).rejects.toThrow(
        'Company name is already taken'
      );
    });
  });

  describe('Errores de Base de Datos', () => {
    it('should throw error if company not found', async () => {
      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      await expect(updateCompanyService(999, 1, { name: 'Test' })).rejects.toThrow(
        'Company not found'
      );
    });

    it('should throw error if update fails', async () => {
      (mockDb.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                for: jest.fn().mockResolvedValue([mockCompany]),
              }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      });

      await expect(updateCompanyService(1, 1, { name: 'New Name' })).rejects.toThrow(
        'Failed to update company'
      );
    });
  });
});
