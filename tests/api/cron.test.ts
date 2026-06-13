import { describe, it, expect, vi } from 'vitest';
import { scrapeHandler } from '../../src/routes/api/cron/scrape';

// Mock DB to prevent execution errors
vi.mock('../../src/db/index', () => ({
  db: { select: vi.fn() }
}));

describe('Cron Job API Route', () => {
  it('should return a 500 status code when SCRAPER_API_KEY is missing', async () => {
    // Save original env
    const originalEnv = process.env.SCRAPER_API_KEY;
    
    // Simulate missing API key
    delete process.env.SCRAPER_API_KEY;

    // Call the GET handler directly
    const response = await scrapeHandler();
    
    // Verify response
    expect(response.status).toBe(500);
    
    const body = await response.json();
    expect(body.error).toBe('Missing SCRAPER_API_KEY environment variable.');

    // Restore env
    process.env.SCRAPER_API_KEY = originalEnv;
  });
});
