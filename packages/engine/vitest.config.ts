import { defineConfig } from 'vitest/config';

// Scoped to this package so 'npm test -w packages/engine' finds its tests from the package root.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
