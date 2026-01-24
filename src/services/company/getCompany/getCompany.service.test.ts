/**
 * Tests para getCompanyService
 *
 * Cubre obtención exitosa, errores de no encontrado,
 * validaciones, y verificación de permisos.
 */

import { getCompanyService } from './getCompany.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('getCompanyService', () => {
  const mockCompany = {
    id: 1,
    name: 'tech solutions',
    description: 'A tech company',
    ownerId: 1,
    logoUrl: 'https://example.com/logo.png',
    state: 'active',
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Obtener Compañía', () => {
    it('should return company if user is owner', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCompany]),
          }),
        }),
      } as any);

      const result = await getCompanyService(1, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('tech solutions');
      expect(result.ownerId).toBe(1);
    });
  });

  describe('Errores - Compañía no Encontrada', () => {
    it('should throw error if company does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      await expect(getCompanyService(999, 1)).rejects.toThrow('Company not found');
    });
  });

  describe('Validación de Permisos', () => {
    it('should throw error if user is not owner', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCompany]),
          }),
        }),
      } as any);

      await expect(getCompanyService(1, 999)).rejects.toThrow('Access denied');
    });
  });

  describe('Validaciones', () => {
    it('should throw error if company ID is invalid', async () => {
      await expect(getCompanyService(0, 1)).rejects.toThrow('Invalid company ID');
      await expect(getCompanyService(-1, 1)).rejects.toThrow('Invalid company ID');
      await expect(getCompanyService(NaN, 1)).rejects.toThrow('Invalid company ID');
    });

    it('should throw error if user ID is invalid', async () => {
      await expect(getCompanyService(1, 0)).rejects.toThrow('Invalid user ID');
      await expect(getCompanyService(1, -1)).rejects.toThrow('Invalid user ID');
      await expect(getCompanyService(1, NaN)).rejects.toThrow('Invalid user ID');
    });
  });
});
