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
    const originalSecret = process.env.CRON_SECRET;
    
    // Simulate missing API key and NO CRON_SECRET
    delete process.env.SCRAPER_API_KEY;
    delete process.env.CRON_SECRET;

    // Call the GET handler directly with a mock request
    const mockRequest = new Request('http://localhost/api/cron/scrape');
    const response = await scrapeHandler({ request: mockRequest });
    
    // Verify response
    expect(response.status).toBe(500);
    
    const body = await response.json();
    expect(body.error).toBe('Missing SCRAPER_API_KEY environment variable.');

    // Restore env
    process.env.SCRAPER_API_KEY = originalEnv;
    process.env.CRON_SECRET = originalSecret;
  });

  it('should return 401 when CRON_SECRET does not match Authorization header', async () => {
    process.env.CRON_SECRET = 'my_super_secret';
    
    const mockRequest = new Request('http://localhost/api/cron/scrape', {
      headers: {
        'Authorization': 'Bearer wrong_secret'
      }
    });

    const response = await scrapeHandler({ request: mockRequest });
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should pass security check when CRON_SECRET matches', async () => {
    process.env.CRON_SECRET = 'my_super_secret';
    // Remove SCRAPER API KEY to hit the 500 block instead of executing DB
    delete process.env.SCRAPER_API_KEY;

    const mockRequest = new Request('http://localhost/api/cron/scrape', {
      headers: {
        'Authorization': 'Bearer my_super_secret'
      }
    });

    const response = await scrapeHandler({ request: mockRequest });
    // It should pass the 401 check and hit the 500 check
    expect(response.status).toBe(500);
  });
});
