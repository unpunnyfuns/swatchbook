import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      // Match the package's classic-JSX tsconfig so tests exercise the same
      // compile output that consumers see.
      jsxRuntime: 'classic',
    }),
  ],
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    reporters: ['default'],
  },
});
