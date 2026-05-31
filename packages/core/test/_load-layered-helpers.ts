import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Config } from '#/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const fixtureCwd = resolve(here, 'fixtures/layered');

export function layeredConfig(overrides: Partial<Config> = {}): Config {
  return {
    tokens: ['base/*.json'],
    axes: [
      {
        name: 'mode',
        contexts: {
          Light: [],
          Dark: ['modes/dark.json'],
        },
        default: 'Light',
      },
      {
        name: 'brand',
        contexts: {
          Default: [],
          'Brand A': ['brands/brand-a.json'],
        },
        default: 'Default',
      },
    ],
    ...overrides,
  };
}
