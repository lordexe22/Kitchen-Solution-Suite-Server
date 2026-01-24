/**
 * Tests para checkCompanyPermissionService
 */

import { checkCompanyPermissionService } from './checkCompanyPermission.service';
import { db } from '../../../db/init';

jest.mock('../../../db/init');

const mockDb = db as jest.Mocked<typeof db>;

describe('checkCompanyPermissionService', () => {
  const mockCompany = {
    id: 1,
    name: 'company',
    description: 'A company',
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

  it('should return true if user is owner', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCompany]),
        }),
      }),
    } as any);

    const result = await checkCompanyPermissionService(1, 1);

    expect(result.hasPermission).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should return false with reason if user is not owner', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockCompany]),
        }),
      }),
    } as any);

    const result = await checkCompanyPermissionService(1, 999);

    expect(result.hasPermission).toBe(false);
    expect(result.reason).toBe('User is not the owner');
  });

  it('should return false with reason if company not found', async () => {
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const result = await checkCompanyPermissionService(999, 1);

    expect(result.hasPermission).toBe(false);
    expect(result.reason).toBe('Company not found');
  });

  it('should throw error if user ID is invalid', async () => {
    await expect(checkCompanyPermissionService(1, 0)).rejects.toThrow('Invalid user ID');
  });

  it('should throw error if company ID is invalid', async () => {
    await expect(checkCompanyPermissionService(0, 1)).rejects.toThrow('Invalid company ID');
  });
});
