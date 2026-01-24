/**
 * Tests para getAllCompaniesService
 *
 * Cubre casos de éxito, paginación, filtrado,
 * validaciones y manejo de errores.
 */

import { getAllCompaniesService } from './getAllCompanies.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('getAllCompaniesService', () => {
  const mockCompanies = [
    {
      id: 1,
      name: 'company one',
      description: 'First company',
      ownerId: 1,
      logoUrl: null,
      state: 'active',
      archivedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: 'company two',
      description: 'Second company',
      ownerId: 1,
      logoUrl: 'https://example.com/logo.png',
      state: 'active',
      archivedAt: null,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 3,
      name: 'archived company',
      description: 'Archived',
      ownerId: 1,
      logoUrl: null,
      state: 'archived',
      archivedAt: new Date('2024-02-01'),
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-02-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Obtener todas las compañías', () => {
    it('should return all companies for a user with pagination', async () => {
      const userId = 1;

      const companiesWithCount = mockCompanies.map((c) => ({
        ...c,
        totalCount: 3,
      }));

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(companiesWithCount),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId);

      expect(result.companies).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should return empty list if user has no companies', async () => {
      const userId = 2;

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId);

      expect(result.companies).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Filtrado por Estado', () => {
    it('should filter companies by active state', async () => {
      const userId = 1;
      const activeCompanies = mockCompanies.filter((c) => c.state === 'active').map((c) => ({
        ...c,
        totalCount: 2,
      }));

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(activeCompanies),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId, { state: 'active' });

      expect(result.companies).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.companies.every((c) => c.state === 'active')).toBe(true);
    });

    it('should filter companies by archived state', async () => {
      const userId = 1;
      const archivedCompanies = mockCompanies.filter((c) => c.state === 'archived').map((c) => ({
        ...c,
        totalCount: 1,
      }));

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(archivedCompanies),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId, { state: 'archived' });

      expect(result.companies).toHaveLength(1);
      expect(result.companies[0].state).toBe('archived');
    });
  });

  describe('Paginación', () => {
    it('should apply page and limit correctly', async () => {
      const userId = 1;
      const page = 2;
      const limit = 5;

      const companiesWithCount = mockCompanies.map((c) => ({
        ...c,
        totalCount: 20,
      }));

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(companiesWithCount),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId, { page, limit });

      expect(result.page).toBe(page);
      expect(result.limit).toBe(limit);
      expect(result.totalPages).toBe(4);
    });

    it('should enforce max limit of 100', async () => {
      const userId = 1;

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId, { limit: 500 });

      expect(result.limit).toBe(100);
    });

    it('should default to page 1 and limit 10', async () => {
      const userId = 1;

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getAllCompaniesService(userId);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('Validaciones', () => {
    it('should throw error if user ID is invalid', async () => {
      await expect(getAllCompaniesService(0)).rejects.toThrow('Invalid user ID');
      await expect(getAllCompaniesService(-1)).rejects.toThrow('Invalid user ID');
      await expect(getAllCompaniesService(NaN)).rejects.toThrow('Invalid user ID');
    });

    it('should throw error if page is invalid', async () => {
      await expect(getAllCompaniesService(1, { page: 0 })).rejects.toThrow(
        'Page must be a positive number'
      );
      await expect(getAllCompaniesService(1, { page: -1 })).rejects.toThrow(
        'Page must be a positive number'
      );
    });

    it('should throw error if limit is invalid', async () => {
      await expect(getAllCompaniesService(1, { limit: 0 })).rejects.toThrow(
        'Limit must be a positive number'
      );
      await expect(getAllCompaniesService(1, { limit: -5 })).rejects.toThrow(
        'Limit must be a positive number'
      );
    });

    it('should throw error if state is invalid', async () => {
      await expect(getAllCompaniesService(1, { state: 'invalid' as any })).rejects.toThrow(
        'Invalid state value'
      );
    });
  });
});
