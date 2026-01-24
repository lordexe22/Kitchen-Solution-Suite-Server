/**
 * Tests para archiveCompanyService
 */

import { archiveCompanyService } from './archiveCompany.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('archiveCompanyService', () => {
  const mockCompany = {
    id: 1,
    name: 'tech solutions',
    description: 'A tech company',
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

  it('should archive active company', async () => {
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
                { ...mockCompany, state: 'archived', archivedAt: new Date(), updatedAt: new Date() },
              ]),
            }),
          }),
        }),
      };
      return await callback(mockTx);
    });

    const result = await archiveCompanyService(1, 1);

    expect(result.state).toBe('archived');
    expect(result.archivedAt).toBeDefined();
  });

  it('should throw error if already archived', async () => {
    (mockDb.transaction as any).mockImplementation(async (callback: any) => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              for: jest.fn().mockResolvedValue([{ ...mockCompany, state: 'archived' }]),
            }),
          }),
        }),
      };
      return await callback(mockTx);
    });

    await expect(archiveCompanyService(1, 1)).rejects.toThrow('Company is already archived');
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

    await expect(archiveCompanyService(1, 999)).rejects.toThrow('Access denied');
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

    await expect(archiveCompanyService(999, 1)).rejects.toThrow('Company not found');
  });
});
