
import { describe, it, expect, vi } from 'vitest';
// We need to test the component, but it's not exported from admin.tsx by default, it's inside the Route.
// Since it's a file route, it's often easiest to mock the router and render the component if it were exported.
// Let's modify admin.tsx to export the component or we can just mock it here.
// We will mock the entire module to simulate how TanStack Router renders it, or just assert it's a valid route definition.
vi.mock('../../src/db/index.server', () => ({
  db: { select: vi.fn() }
}));

import { Route } from '../../src/routes/admin';

describe('Admin Route', () => {
  it('should be a valid TanStack route', () => {
    expect(Route).toBeDefined();
    expect(typeof Route.options.loader).toBe('function');
    expect(Route.options.component).toBeDefined();
  });
});
