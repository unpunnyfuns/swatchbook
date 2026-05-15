import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

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
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    reporters: ['default'],
  },
});
