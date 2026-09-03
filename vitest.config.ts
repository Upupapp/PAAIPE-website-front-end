import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'node',
    // This machine is shared with another agent and can run under heavy load;
    // a generous hook timeout stops load spikes from reading as test failures.
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
