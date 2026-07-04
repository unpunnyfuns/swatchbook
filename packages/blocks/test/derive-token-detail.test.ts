import { expect, it } from 'vitest';
import { deriveTokenDetail } from '#/TokenDetail.tsx';
import type { ProjectData } from '#/internal/use-project.ts';
import type { DetailToken } from '#/token-detail/internal.ts';

const colorToken: DetailToken = {
  $type: 'color',
  $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
};

const deprecatedDimension: DetailToken = {
  $type: 'dimension',
  $value: { value: 16, unit: 'px' },
  $deprecated: 'use space.4',
};

it('prefers the listing preview value for hex format', () => {
  const listing = {
    'color.brand': { previewValue: '#0066ff' },
  } as unknown as ProjectData['listing'];
  const derived = deriveTokenDetail('color.brand', colorToken, listing, 'hex');
  expect(derived.value).toBe('#0066ff');
  expect(derived.isColor).toBe(true);
  expect(derived.outOfGamut).toBe(false);
});

it('falls back to formatColor when the listing lacks the path', () => {
  const listing = {} as ProjectData['listing'];
  const derived = deriveTokenDetail('color.brand', colorToken, listing, 'hex');
  expect(derived.value).toBe('#0066ff');
});

it('falls back to formatColor for a non-hex format even when the listing has a preview', () => {
  // formatTokenValue only trusts the listing preview for hex — plugin-css's
  // previewValue has no other-format equivalent, so oklch/rgb/hsl must
  // recompute from the raw $value via colorjs.io.
  const listing = {
    'color.brand': { previewValue: '#0066ff' },
  } as unknown as ProjectData['listing'];
  const derived = deriveTokenDetail('color.brand', colorToken, listing, 'oklch');
  expect(derived.value).not.toBe('#0066ff');
  expect(derived.value.startsWith('oklch(')).toBe(true);
});

it('flags a deprecated token with its message', () => {
  const listing = {} as ProjectData['listing'];
  const derived = deriveTokenDetail('space.md', deprecatedDimension, listing, 'hex');
  expect(derived.isColor).toBe(false);
  expect(derived.isDeprecated).toBe(true);
  expect(derived.deprecationMessage).toBe('use space.4');
  expect(derived.value).toBe('16px');
});

it('returns empty defaults when the token is missing', () => {
  const listing = {} as ProjectData['listing'];
  const derived = deriveTokenDetail('color.missing', undefined, listing, 'hex');
  expect(derived).toEqual({
    value: '',
    outOfGamut: false,
    isColor: false,
    isDeprecated: false,
    deprecationMessage: undefined,
  });
});
