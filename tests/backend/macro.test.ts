import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateAndSaveMacroMetrics } from '../../src/functions/macro';
import { db } from '../../src/db/index.server';

// Mock DB
vi.mock('../../src/db/index.server', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
}));

describe('calculateAndSaveMacroMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate metrics and insert them', async () => {
    // Mock the initial select for metrics history
    const mockData = [
      { id: 1, subredditId: 1, weeklyVisitors: 100, recordedAt: new Date('2026-08-01') },
      { id: 2, subredditId: 1, weeklyVisitors: 150, recordedAt: new Date('2026-08-10') },
    ];
    
    // Setup chaining for the complex db.select().from().innerJoin().where()
    const mockWhere = vi.fn().mockResolvedValue(mockData);
    const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    (db.select as any).mockReturnValue({ from: mockFrom });

    // Mock existing today check
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere2 = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
    
    // Override the 2nd select call for platformHistoricalMetrics
    (db.select as any).mockImplementation(() => {
      // Very naive implementation just to pass execution
      let callCount = (db.select as any).mock.calls.length;
      if (callCount === 1) {
        return { from: mockFrom };
      }
      return { from: mockFrom2 };
    });

    const mockReturning = vi.fn().mockResolvedValue([{ id: 1, totalWeeklyVisitors: 150 }]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as any).mockReturnValue({ values: mockValues });

    const result = await calculateAndSaveMacroMetrics();

    expect(db.select).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, totalWeeklyVisitors: 150 });
  });
});
