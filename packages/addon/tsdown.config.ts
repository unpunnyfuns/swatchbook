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
  external: [/^vite($|\/)/, /^@storybook\//, 'storybook', 'react', 'react-dom'],
});
