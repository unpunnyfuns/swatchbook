import { describe, expect, it } from 'vitest';
import { resolveColorValue, resolveCssVar } from '#/internal/use-project.ts';

describe('resolveCssVar', () => {
  it('prefers the listing name over the derived fallback (distinct names prove the branch)', () => {
    const project = {
      cssVarPrefix: 'sb',
      // A name that could NOT come from the fallback derivation of this path,
      // so a passing test can only mean the listing-first branch ran.
      listing: { 'color.brand': { names: { css: '--authoritative-from-plugin-css' } } },
    } as unknown as Parameters<typeof resolveCssVar>[1];
    expect(resolveCssVar('color.brand', project)).toBe('var(--authoritative-from-plugin-css)');
  });

  it('falls back to the derived var when the listing has no entry for the path', () => {
    const project = { cssVarPrefix: 'sb', listing: {} } as unknown as Parameters<
      typeof resolveCssVar
    >[1];
    // The fallback derivation (makeCssVar) is covered in core; here we only
    // assert it's used (kebab-cased, prefixed) and not the listing.
    expect(resolveCssVar('color.brand', project)).toBe('var(--sb-color-brand)');
  });
});

describe('resolveColorValue', () => {
  const project = {
    listing: { 'color.brand': { previewValue: '#abcdef' } },
  } as unknown as Parameters<typeof resolveColorValue>[3];
  const raw = { colorSpace: 'srgb', components: [0, 0, 0] };

  it('uses the listing previewValue for hex format on a keyed path', () => {
    expect(resolveColorValue('color.brand', raw, 'hex', project)).toEqual({
      value: '#abcdef',
      outOfGamut: false,
    });
  });

  it('falls back to formatColor for non-hex formats (listing has only the canonical form)', () => {
    const out = resolveColorValue('color.brand', raw, 'rgb', project);
    expect(out.value).toMatch(/^rgb\(/);
  });

  it('falls back to formatColor when the path has no listing previewValue', () => {
    const out = resolveColorValue('color.unlisted', raw, 'hex', project);
    expect(out.value).toBe('#000000');
  });

  it('falls back to formatColor for composite sub-colors (path undefined)', () => {
    const out = resolveColorValue(undefined, raw, 'hex', project);
    expect(out.value).toBe('#000000');
  });
});
