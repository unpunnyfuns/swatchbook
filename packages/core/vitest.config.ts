import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    // DTCG parse + Terrazzo normalize + CSS emit take ~800ms per
    // loadProject locally; in the GH Actions Playwright container they
    // can creep past vitest's 5s default. 30s gives ample headroom
    // without masking real regressions.
    testTimeout: 30_000,
  },
});
