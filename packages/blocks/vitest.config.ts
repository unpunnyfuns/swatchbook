import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Two projects, split by file extension:
 *
 * - **node** — pure-function tests (`*.test.ts`): `format-color`,
 *   `format-token-value`, `sort-tokens`. No DOM, no React rendering;
 *   running these under the browser harness would add ~5× wall-clock
 *   per file for no semantic gain.
 * - **browser** — component tests (`*.test.tsx`): everything that calls
 *   `render(<X />)`. Runs in real Chromium + Firefox via vitest-browser.
 *
 * The `.ts` vs `.tsx` discriminator is load-bearing: every `.test.tsx`
 * file in this package renders a React component (asserted via grep);
 * every `.test.ts` file is pure-function. Don't add a `.test.ts` that
 * needs a DOM — promote to `.tsx` if it does. jsdom is intentionally
 * absent from both projects (project convention; partial browser
 * simulation hides real regressions).
 */
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
    reporters: ['default'],
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.test.tsx'],
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
      },
    ],
  },
});
