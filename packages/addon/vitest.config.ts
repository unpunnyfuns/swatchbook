import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Two projects: the addon's published surface splits cleanly into
 * browser-side runtime (preview decorator, hooks, manager UI — exercised
 * via real Chromium) and Node-side build-time (preset, Vite plugin,
 * codegen — never enters a browser, imports `node:module` / `node:fs`).
 *
 * Component tests live in `*-component.test.{ts,tsx}` and run under the
 * `browser` project. Node-side tests are everything else under `test/`.
 * jsdom is intentionally absent — neither project uses it.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:swatchbook/tokens': fileURLToPath(
        new URL('./test/virtual-stub.ts', import.meta.url),
      ),
      'virtual:swatchbook/integration-side-effects': fileURLToPath(
        new URL('./test/virtual-integration-side-effects-stub.ts', import.meta.url),
      ),
    },
  },
  test: {
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
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
        },
      },
    ],
  },
});
