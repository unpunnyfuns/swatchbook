import { describe, expect, it } from 'vitest';
import { defineSwatchbookConfig } from '#/config.ts';

describe('defineSwatchbookConfig', () => {
  it('returns the config unchanged (identity helper)', () => {
    const input = { tokens: ['t/**'], resolver: 't/resolver.json' };
    expect(defineSwatchbookConfig(input)).toBe(input);
  });
});
