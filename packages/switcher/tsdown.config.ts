import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  css: {
    inject: true,
  },
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
});
