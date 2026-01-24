/**
 * Tests para deleteCompanyService
 */

import { deleteCompanyService } from './deleteCompany.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('deleteCompanyService', () => {
  const mockCompany = {
    id: 1,
    name: 'company to delete',
    description: 'Will be deleted',
    ownerId: 1,
    logoUrl: null,
    state: 'active',
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete company successfully', async () => {
    (mockDb.transaction as any).mockImplementation(async (callback: any) => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              for: jest.fn().mockResolvedValue([mockCompany]),
            }),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({ changes: 1 }),
        }),
      };
      return await callback(mockTx);
    });

    await expect(deleteCompanyService(1, 1)).resolves.toBeUndefined();
  });

  it('should throw error if not owner', async () => {
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

    await expect(deleteCompanyService(1, 999)).rejects.toThrow('Access denied');
  });

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

    await expect(deleteCompanyService(999, 1)).rejects.toThrow('Company not found');
  });

  it('should throw error if user ID is invalid', async () => {
    await expect(deleteCompanyService(1, 0)).rejects.toThrow('Invalid user ID');
  });

  it('should throw error if company ID is invalid', async () => {
    await expect(deleteCompanyService(0, 1)).rejects.toThrow('Invalid company ID');
  });
});
