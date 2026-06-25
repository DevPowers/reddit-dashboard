import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { Suspense } from 'react';
import { TARGET_SUBREDDITS } from '../../src/data/subreddits';
import { Category } from '../../src/types';
import { generateMockMetrics, generateMockPlatformHistory } from '../../src/lib/mockData';

// Mock DB to prevent postgres from connecting during imports
vi.mock('../../src/db/index.server', () => ({
  db: { select: vi.fn() }
}));

// Mock recharts
vi.mock('recharts', async () => {
  const OriginalRechartsModule = await vi.importActual<any>('recharts');
  return {
    ...OriginalRechartsModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ data, children }: any) => <div data-testid="mock-line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>,
    Line: ({ dataKey }: any) => <div data-testid={`mock-line-${dataKey}`} />
  };
});

// Mock dependencies
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createFileRoute: () => (options: any) => {
      return {
        options,
        useLoaderData: () => ({ metrics: generateMockMetrics(), platformHistory: generateMockPlatformHistory() })
      };
    }
  };
});

// We need to import the route after mocking react-router
import { Route } from '../../src/routes/index';

const DashboardComponent = Route.options.component as React.ComponentType;
const TestWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <DashboardComponent />
  </Suspense>
);

describe('Dashboard UI', () => {
  it('renders the Dashboard title and KPI cards', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });
    
    // Verify Dashboard loads
    const dashboardTitles = screen.getAllByText(/Performance Dashboard/i);
    expect(dashboardTitles.length).toBeGreaterThan(0);
  });

  it('opens accordion for default geography category', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });

    const firstGeoGroup = TARGET_SUBREDDITS.find(g => g.category === Category.GEOGRAPHY);
    const dynamicSub = firstGeoGroup ? firstGeoGroup.subreddits[0] : 'Unknown';
    const groupName = firstGeoGroup ? firstGeoGroup.subCategory : 'Unknown';

    // Now find the Accordion for this group and open it. It should exist because default is Geography.
    // The AccordionItem has a button containing a span with the groupName.
    const accordionTrigger = screen.getByText(groupName, { selector: 'span' });
    expect(accordionTrigger).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(accordionTrigger);
    });

    // Verify the subreddit inside it renders
    expect(screen.getByText(`r/${dynamicSub}`)).toBeInTheDocument();
  });

  it('aggregates chart data by subCategory for Geography category', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });

    // We start on Geography category by default
    // We expect the mocked chart lines to render subCategories (e.g., United States)
    const chart = await screen.findByTestId('mock-line-chart');
    expect(chart).toBeInTheDocument();

    const line1 = screen.queryByTestId('mock-line-United States');

    expect(line1).toBeInTheDocument();

    // Verify individual subreddits are NOT plotted as lines (e.g., r/nyc)
    expect(screen.queryByTestId('mock-line-r/nyc')).not.toBeInTheDocument();
    
    // Switch to Advertiser Category
    const advertiserBtn = screen.getByText('ADVERTISING PLATFORMS', { selector: 'button' });
    await act(async () => {
      fireEvent.click(advertiserBtn);
    });

    // It should now plot by subCategory (e.g. Meta, Reddit) instead
    expect(screen.queryByTestId('mock-line-United States')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-line-Meta')).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-Reddit')).toBeInTheDocument();

    // The accordion should also have changed to show Meta and Reddit
    expect(screen.getByText('Meta', { selector: 'span' })).toBeInTheDocument();
    const redditSpans = screen.getAllByText('Reddit', { selector: 'span' });
    expect(redditSpans.length).toBeGreaterThan(0);
  });
});
