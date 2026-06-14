import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { Suspense } from 'react';
import { TARGET_SUBREDDITS } from '../../src/data/subreddits';
import { Category } from '../../src/types';

// Mock DB to prevent postgres from connecting during imports
vi.mock('../../src/db/index', () => ({
  db: { select: vi.fn() }
}));

// Mock dependencies
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createFileRoute: () => (options: any) => {
      return {
        options,
        useLoaderData: () => [] // Start with empty real data
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
    expect(screen.getByText('Investor Performance Dashboard')).toBeInTheDocument();
    
    // Verify KPI Cards are rendered (with new ARPU Titles)
    expect(screen.getByText('High ARPU')).toBeInTheDocument();
    expect(screen.getByText('Medium ARPU')).toBeInTheDocument();
    expect(screen.getByText('Low ARPU')).toBeInTheDocument();
  });

  it('toggles Mock Data correctly and opens accordion', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });

    const mockDataToggle = screen.getByLabelText(/use mock data/i);
    expect(mockDataToggle).not.toBeChecked();

    await act(async () => {
      fireEvent.click(mockDataToggle);
    });

    expect(mockDataToggle).toBeChecked();

    const firstLowGeoGroup = TARGET_SUBREDDITS.find(g => g.category === Category.GEOGRAPHY && g.arpuExpectation === 'low');
    const dynamicSub = firstLowGeoGroup ? firstLowGeoGroup.subreddits[0] : 'Unknown';
    const groupName = firstLowGeoGroup ? firstLowGeoGroup.subCategory : 'Unknown';

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
});
