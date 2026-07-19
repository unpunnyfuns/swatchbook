import { expect, it } from 'vitest';
import { formatTokenValue } from '@unpunnyfuns/swatchbook-core/token-value-css';
import type { SlimListedToken } from '@unpunnyfuns/swatchbook-core/snapshot-for-wire';

// `value` must be a non-primitive so formatTokenValue falls through to the
// listing.previewValue branch that runs cleanFloatNoise.
const OBJECT_VALUE = {};

it('rounds real float noise from previewValue', () => {
  const listing: SlimListedToken = { names: {}, previewValue: '0.30000000000000004' };
  expect(formatTokenValue(OBJECT_VALUE, 'dimension', 'hex', listing)).toBe('0.3');
});

it('rounds a fractional part with exactly 9 digits', () => {
  const listing: SlimListedToken = { names: {}, previewValue: '1.123456789' };
  expect(formatTokenValue(OBJECT_VALUE, 'dimension', 'hex', listing)).toBe('1.123');
});

it('does not exhibit polynomial backtracking on a long dot-less digit run', () => {
  const pathological = '9'.repeat(100_000);
  const listing: SlimListedToken = { names: {}, previewValue: pathological };
  const start = performance.now();
  const result = formatTokenValue(OBJECT_VALUE, 'dimension', 'hex', listing);
  const elapsedMs = performance.now() - start;
  expect(result).toBe(pathological);
  expect(elapsedMs).toBeLessThan(1000);
});
