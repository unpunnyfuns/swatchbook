import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
  },
  benchmark: {
    include: ['bench/**/*.bench.ts'],
    reporters: ['default'],
  },
});
