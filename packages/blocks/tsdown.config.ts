import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/host.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  css: {
    inject: true,
  },
  deps: {
    neverBundle: [/^@storybook\//, /^virtual:/, /^storybook($|\/)/, 'react', 'react-dom'],
  },
});
