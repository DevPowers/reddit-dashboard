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
    
    // Verify KPI Cards are rendered
    expect(screen.getByText('High ARPU Tier (US, UK, CA, DE, FR)')).toBeInTheDocument();
    expect(screen.getByText('Medium ARPU Tier (BR, MX)')).toBeInTheDocument();
    expect(screen.getByText('Low ARPU Tier (IN)')).toBeInTheDocument();
  });

  it('toggles Mock Data correctly', async () => {
    await act(async () => {
      render(<TestWrapper />);
    });

    const mockDataToggle = screen.getByLabelText(/use mock data/i);
    expect(mockDataToggle).not.toBeChecked();

    await act(async () => {
      fireEvent.click(mockDataToggle);
    });

    expect(mockDataToggle).toBeChecked();

    // After toggling, mock data should populate the table and chart.
    // "r/india" is one of the subreddits, let's verify it renders in the table.
    expect(screen.getByText('r/india')).toBeInTheDocument();
  });
});
