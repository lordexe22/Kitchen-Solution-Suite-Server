/**
 * Tests para createCompanyService
 *
 * Cubre los casos principales: creación exitosa, validaciones,
 * manejo de nombres duplicados mediante unique constraint de BD, y errores.
 */

import { createCompanyService } from './createCompany.service';
import { db } from '../../../db/init';
import { DatabaseError } from 'pg';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('createCompanyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Creación Exitosa', () => {
    it('should create a company successfully with all fields', async () => {
      const userId = 1;
      const input = {
        name: 'Tech Solutions Inc',
        description: 'A leading tech company',
        logo: 'https://example.com/logo.png',
      };

      // Mock countUserCompanies
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      } as any);

      // Mock insert
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 1,
              name: 'tech solutions inc',
              description: 'A leading tech company',
              ownerId: userId,
              logoUrl: 'https://example.com/logo.png',
              state: 'active',
              archivedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      } as any);

      const result = await createCompanyService(input, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('tech solutions inc');
      expect(result.ownerId).toBe(userId);
      expect(result.state).toBe('active');
    });

    it('should create a company with minimal fields', async () => {
      const userId = 2;
      const input = {
        name: 'Simple Company',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      } as any);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 2,
              name: 'simple company',
              description: null,
              ownerId: userId,
              logoUrl: null,
              state: 'active',
              archivedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      } as any);

      const result = await createCompanyService(input, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe('simple company');
      expect(result.description).toBeNull();
      expect(result.logoUrl).toBeNull();
    });
  });

  describe('Validaciones de Entrada', () => {
    it('should throw error if name is missing', async () => {
      const userId = 1;
      const input = { description: 'No name provided' } as any;

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Company name is required and must be a string'
      );
    });

    it('should throw error if name is empty string', async () => {
      const userId = 1;
      const input = { name: '   ' };

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Company name cannot be empty'
      );
    });

    it('should throw error if name exceeds max length', async () => {
      const userId = 1;
      const input = { name: 'a'.repeat(256) };

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Company name must be 255 characters or less'
      );
    });

    it('should throw error if description exceeds max length', async () => {
      const userId = 1;
      const input = {
        name: 'Valid Name',
        description: 'x'.repeat(1001),
      };

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Company description must be 1000 characters or less'
      );
    });

    it('should throw error if input is null', async () => {
      const userId = 1;

      await expect(createCompanyService(null as any, userId)).rejects.toThrow(
        'Invalid request body'
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should throw error if user has reached max companies limit', async () => {
      const userId = 1;
      const input = {
        name: 'New Company',
      };

      // Mock countUserCompanies returning max limit
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]), // MAX_COMPANIES_PER_USER
        }),
      } as any);

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Maximum companies limit reached'
      );
    });
  });

  describe('Nombre Duplicado - Unique Constraint de BD', () => {
    it('should throw error if company name already exists (unique constraint violation)', async () => {
      const userId = 1;
      const input = {
        name: 'Existing Company',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      } as any);

      // Simular violación de unique constraint (PostgreSQL código 23505)
      const dbError = new DatabaseError('duplicate key value violates unique constraint', 0, 'error');
      (dbError as any).code = '23505';
      (dbError as any).constraint = 'companies_name_unique';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(dbError),
        }),
      } as any);

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Nombre no disponible'
      );
    });
  });

  describe('Sanitización de Nombre', () => {
    it('should sanitize company name preserving original case', async () => {
      const userId = 1;
      const input = {
        name: '  TeCh   SoLuTiOnS  ',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      } as any);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 1,
              name: 'TeCh SoLuTiOnS',
              description: null,
              ownerId: userId,
              logoUrl: null,
              state: 'active',
              archivedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      } as any);

      const result = await createCompanyService(input, userId);

      expect(result.name).toBe('TeCh SoLuTiOnS');
    });
  });

  describe('Errores de Base de Datos', () => {
    it('should throw error if insert fails', async () => {
      const userId = 1;
      const input = {
        name: 'New Company',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      } as any);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      await expect(createCompanyService(input, userId)).rejects.toThrow(
        'Failed to create company'
      );
    });
  });
});
