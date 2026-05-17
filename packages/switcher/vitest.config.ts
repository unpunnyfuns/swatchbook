import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      // Match the package's classic-JSX tsconfig so tests exercise the same
      // compile output that consumers see (Storybook manager bundle).
      jsxRuntime: 'classic',
    }),
  ],
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    reporters: ['default'],
    // Component tests run in real Chromium / Firefox via vitest's browser
    // mode. jsdom is intentionally absent — its keyboard / focus / pointer
    // simulation is partial enough that tests depending on those semantics
    // end up testing the test author's model of the browser instead of the
    // browser itself. Mirrors `packages/blocks/vitest.config.ts`; WebKit
    // deferred to #754.
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
      headless: true,
    },
  },
});
