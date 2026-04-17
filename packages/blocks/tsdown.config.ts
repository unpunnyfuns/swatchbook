import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  deps: {
    neverBundle: [
      /^@storybook\//,
      /^virtual:/,
      /^storybook($|\/)/,
      'react',
      'react-dom',
    ],
  },
});
