/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          // Emulate reduced motion so animated stories (MotionSample /
          // MotionPreview / CompositePreview transition) render their static
          // fallback during tests. Without it the setInterval loops keep
          // mutating the DOM and the a11y (axe) pass never reaches a stable
          // state — the story test runner hangs. The components already honor
          // prefers-reduced-motion via usePrefersReducedMotion.
          provider: playwright({ contextOptions: { reducedMotion: 'reduce' } }),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});