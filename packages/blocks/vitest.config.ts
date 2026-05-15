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
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
});
