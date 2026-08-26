import { describe, it, expect, vi } from "vitest";

// Mock the dependencies FIRST
vi.mock("../../src/db/index.server", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }])
  }
}));

import { calculateAndSaveMacroMetrics } from "../../src/functions/macro";
import { db } from "../../src/db/index.server";

describe("Macro Metrics Calculations", () => {
    it("should calculate statistical metrics perfectly", async () => {
        // We will mock the returned data
        const mockData = [
            { id: 1, subredditId: 1, weeklyVisitors: 100, recordedAt: new Date("2026-08-25T00:00:00Z") },
            { id: 2, subredditId: 2, weeklyVisitors: 200, recordedAt: new Date("2026-08-25T00:00:00Z") },
            { id: 3, subredditId: 3, weeklyVisitors: 300, recordedAt: new Date("2026-08-25T00:00:00Z") },
            { id: 4, subredditId: 4, weeklyVisitors: 400, recordedAt: new Date("2026-08-25T00:00:00Z") },
            { id: 5, subredditId: 5, weeklyVisitors: 500, recordedAt: new Date("2026-08-25T00:00:00Z") },
        ];
        
        const mockGenesis = [
            { totalWeeklyVisitors: 1000 }
        ];

        // Override db behavior for this test
        // @ts-ignore
        (db.where as any)
            .mockResolvedValueOnce(mockData) 
            .mockReturnThis(); 
            
        // @ts-ignore
        (db.limit as any)
            .mockResolvedValueOnce(mockGenesis) 
            .mockResolvedValueOnce([]) 
            .mockResolvedValue([{ id: 1 }]); 

        await calculateAndSaveMacroMetrics();
        expect(db.insert).toHaveBeenCalled();
        
        // @ts-ignore
        const valuesCall = (db.values as any).mock.calls[0][0];
        
        expect(valuesCall.totalWeeklyVisitors).toBe(1500);
        expect(valuesCall.minVisitors).toBe(100);
        expect(valuesCall.maxVisitors).toBe(500);
        expect(valuesCall.medianVisitors).toBe(300);
        expect(valuesCall.averageVisitors).toBe(300); // 1500 / 5
        expect(valuesCall.visitorGrowthPercent).toBe(50); // (1500 - 1000) / 1000 * 100
        expect(valuesCall.netNewWeeklyVisitors).toBe(500);
    });
});
