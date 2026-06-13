import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Recharts to avoid layout measuring errors in JSDOM
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual<any>('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 600 }}>{children}</div>
    ),
  };
});
