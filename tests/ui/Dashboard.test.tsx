import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { Suspense } from 'react';

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

    // After toggling, mock data should populate the accordion.
    // The "Low ARPU" accordion item should be present since it's the Geography Tab by default.
    // It appears twice (once in KPI card, once in Accordion). We want the Accordion one.
    const elements = screen.getAllByText(/Low ARPU/i, { selector: 'button *' });
    const lowArpuTrigger = elements[elements.length - 1]; // The accordion is rendered last
    expect(lowArpuTrigger).toBeInTheDocument();

    // Open the accordion
    await act(async () => {
      fireEvent.click(lowArpuTrigger);
    });

    // Verify a subreddit inside it renders
    expect(screen.getByText('r/india')).toBeInTheDocument();
  });
});
