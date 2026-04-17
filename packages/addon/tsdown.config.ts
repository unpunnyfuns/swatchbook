import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/preset.ts',
    'src/preview.tsx',
    'src/manager.tsx',
    'src/hooks/index.ts',
  ],
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  deps: {
    neverBundle: [
      /^vite($|\/)/,
      /^@storybook\//,
      /^virtual:/,
      'storybook',
      'react',
      'react-dom',
    ],
  },
});
