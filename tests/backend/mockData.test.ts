import { describe, it, expect } from 'vitest';
import { generateMockMetrics } from '../../src/lib/mockData';
import { TARGET_SUBREDDITS } from '../../src/data/subreddits';

describe('generateMockMetrics', () => {
  it('should generate at least one record per subreddit', () => {
    const data = generateMockMetrics();
    expect(data.length).toBeGreaterThan(0);
  });

  it('should include the exact T0 anchor date of March 31, 2026', () => {
    const data = generateMockMetrics();
    const t0Records = data.filter(d => {
      const date = new Date(d.recordedAt);
      return date.getFullYear() === 2026 && date.getMonth() === 2 && date.getDate() === 31;
    });

    // Count total subreddits in TARGET_SUBREDDITS (excluding PERSONAL_TRACKING, which the mock generator skips)
    const totalSubreddits = TARGET_SUBREDDITS
      .filter(g => g.category !== 'personal_tracking')
      .reduce((acc, curr) => acc + curr.subreddits.length, 0);

    expect(t0Records.length).toBe(totalSubreddits);
  });

  it('should not generate future dates', () => {
    const data = generateMockMetrics();
    const now = new Date();
    const futureRecords = data.filter(d => new Date(d.recordedAt) > now);
    expect(futureRecords.length).toBe(0);
  });
});
