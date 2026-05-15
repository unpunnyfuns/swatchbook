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
      // Cross-engine matrix — Blink + Gecko. WebKit deferred (see #754):
      // the binary launches cleanly in this container (CI diagnostic in
      // PR #762 run 25944927450 confirmed bare `webkit.launch().newPage()`
      // works), but `@vitest/browser-playwright` 4.1.4's per-file harness
      // setup hits "Target page, context or browser has been closed"
      // regardless of `--ipc=host` or `isolate: false`. Library-side
      // integration issue rather than anything we own.
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
      headless: true,
    },
  },
});
