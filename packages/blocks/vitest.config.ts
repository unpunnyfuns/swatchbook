import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Two projects, discriminated by an explicit `.browser.` infix in the
 * filename (matching the convention in `packages/addon/vitest.config.ts`):
 *
 * - **node** — every `*.test.{ts,tsx}` file WITHOUT the `.browser.`
 *   infix. Runs in Node, no DOM, no browser harness. Today this is the
 *   three pure-function suites (`format-color`, `format-token-value`,
 *   `sort-tokens`); ~40× faster than the browser provider (157 ms vs
 *   ~6 s).
 * - **browser** — every `*.browser.test.{ts,tsx}` file. Runs in real
 *   Chromium + Firefox via vitest-browser; this is where component
 *   tests calling `render(<X />)` live.
 *
 * The infix is the contract — `.ts` vs `.tsx` is just compilation
 * shape, not a runner signal. A `.test.ts` that reaches for `document`
 * or `window` belongs in the browser project; rename it to
 * `.browser.test.{ts,tsx}` to move it across. jsdom is intentionally
 * absent from both projects — project convention, partial browser
 * simulation hides real regressions.
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
          include: ['test/**/*.test.{ts,tsx}'],
          exclude: ['test/**/*.browser.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['test/**/*.browser.test.{ts,tsx}'],
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
