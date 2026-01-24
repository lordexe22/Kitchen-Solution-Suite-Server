/**
 * Tests para reactivateCompanyService
 */

import { reactivateCompanyService } from './reactivateCompany.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('reactivateCompanyService', () => {
  const mockArchivedCompany = {
    id: 1,
    name: 'archived company',
    description: 'An archived company',
    ownerId: 1,
    logoUrl: null,
    state: 'archived',
    archivedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reactivate archived company', async () => {
    (mockDb.transaction as any).mockImplementation(async (callback: any) => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              for: jest.fn().mockResolvedValue([mockArchivedCompany]),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                { ...mockArchivedCompany, state: 'active', archivedAt: null, updatedAt: new Date() },
              ]),
            }),
          }),
        }),
      };
      return await callback(mockTx);
    });

    const result = await reactivateCompanyService(1, 1);

    expect(result.state).toBe('active');
    expect(result.archivedAt).toBeNull();
  });

  it('should throw error if not archived', async () => {
    (mockDb.transaction as any).mockImplementation(async (callback: any) => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              for: jest.fn().mockResolvedValue([{ ...mockArchivedCompany, state: 'active' }]),
            }),
          }),
        }),
      };
      return await callback(mockTx);
    });

    await expect(reactivateCompanyService(1, 1)).rejects.toThrow('Company is not archived');
  });

  it('should throw error if not owner', async () => {
    (mockDb.transaction as any).mockImplementation(async (callback: any) => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              for: jest.fn().mockResolvedValue([{ ...mockArchivedCompany, ownerId: 2 }]),
            }),
          }),
        }),
      };
      return await callback(mockTx);
    });

    await expect(reactivateCompanyService(1, 999)).rejects.toThrow('Access denied');
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

    await expect(reactivateCompanyService(999, 1)).rejects.toThrow('Company not found');
  });
});
