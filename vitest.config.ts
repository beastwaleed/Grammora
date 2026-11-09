import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
    testTimeout: 15000,
  },
});

