import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:swatchbook/tokens': fileURLToPath(
        new URL('./test/virtual-stub.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    reporters: ['default'],
    // Component tests run in real Chromium via vitest's browser mode.
    // jsdom is intentionally absent — its keyboard / focus / pointer
    // simulation is partial enough that tests depending on those
    // semantics end up testing the test author's model of the browser
    // instead of the browser itself. Real-browser execution is the
    // default for `render(<X />)` here.
    browser: {
      enabled: true,
      provider: playwright(),
      // Cross-engine matrix — Blink + Gecko + WebKit. WebKit needs
      // the CI container's `--ipc=host` so its multi-process helpers
      // get a real shared-memory region; without that it crashes on
      // `newPage` with "Target page, context or browser has been
      // closed". See `.github/workflows/ci.yml` for the container
      // options.
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
      headless: true,
      // `isolate: false` reuses one browser/context across test files.
      // CI diagnostic (PR #762 run 25944927450) proved WebKit itself
      // launches + newPage + cleanup correctly, but vitest-browser-
      // playwright's per-file isolation cycle trips it. Reusing context
      // sidesteps the churn. Chromium + Firefox tolerate either mode.
      isolate: false,
    },
  },
});
