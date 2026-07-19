import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.ts'],
      // The default tsconfig.json excludes test/, so vitest's typechecker
      // (which invokes bare `tsc` and only adds `-p` when this is set) would
      // otherwise never load the .test-d.ts file into a program at all.
      // It would silently pass regardless of what the assertions say.
      tsconfig: './tsconfig.typecheck.json',
    },
  },
  benchmark: {
    include: ['bench/**/*.bench.ts'],
    reporters: ['default'],
  },
});
