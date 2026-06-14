import { describe, it, expect, vi } from 'vitest';
import { getAdminStats } from '../../src/services/admin.service';

// Mock DB
vi.mock('../../src/db/index', () => ({
  db: { 
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{}]),
    where: vi.fn().mockResolvedValue([{ avg: 1500 }]),
    execute: vi.fn().mockResolvedValue([
      { id: 1, name: 'react', category: 'framework', data_points: 10, last_updated: new Date() }
    ])
  }
}));

describe('Admin Functions', () => {
  it('should fetch all admin stats successfully', async () => {
    // TanStack createServerFn must be executed carefully if not in full request context,
    // but the handler itself handles DB logic. We mock the handler's internal db logic directly.
    
    // Instead of executing it fully which might require a request context, 
    // we'll mock the internals of DB since we already did that.
    
    await import('../../src/db/index');
    
    const result = await getAdminStats();
    
    expect(result).toBeDefined();
    expect(result.dbHealth).toBe('Healthy');
    expect(result.subreddits).toHaveLength(1);
    expect(result.cronStats).toBeDefined();
  });
});
