import { expect, it } from 'vitest';
import { assertKnownTuple, buildAxisInput, resolvePreset } from '#/axis-variant.ts';
import type { ResolvePreset } from '#/axis-variant.ts';
import type { ResolveAxis } from '#/tuple-resolve.ts';

const AXES: readonly ResolveAxis[] = [
  { name: 'mode', default: 'Light', contexts: ['Light', 'Dark'] },
  { name: 'brand', default: 'Default', contexts: ['Default', 'Brand A'] },
  { name: 'contrast', default: 'Normal', contexts: ['Normal', 'High'] },
];

const PRESETS: readonly ResolvePreset[] = [
  { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
  { name: 'A11y High Contrast', axes: { mode: 'Light', contrast: 'High' } },
];

const PROJECT = { axes: AXES, presets: PRESETS };

it('resolvePreset returns the named preset axes', () => {
  expect(resolvePreset('Brand A Dark', PRESETS)).toEqual({ mode: 'Dark', brand: 'Brand A' });
});

it('resolvePreset throws on an unknown preset name and lists known ones', () => {
  expect(() => resolvePreset('Nope', PRESETS)).toThrow(/unknown preset "Nope".*Brand A Dark/s);
});

it('assertKnownTuple accepts a valid partial tuple', () => {
  expect(() => assertKnownTuple({ mode: 'Dark' }, AXES)).not.toThrow();
});

it('assertKnownTuple throws on an unknown axis key', () => {
  expect(() => assertKnownTuple({ mdoe: 'Dark' }, AXES)).toThrow(/unknown axis "mdoe"/);
});

it('assertKnownTuple throws on an out-of-context axis value', () => {
  expect(() => assertKnownTuple({ brand: 'Brnd A' }, AXES)).toThrow(
    /"Brnd A" is not a context of axis "brand"/,
  );
});

it('assertKnownTuple throws on an explicitly undefined axis value', () => {
  // Typed callers can't express this under exactOptionalPropertyTypes, but an
  // untyped JS caller or a malformed preset can pass an explicit `undefined`.
  // It must fail loud rather than silently resolve the axis to its default.
  const tuple = { mode: undefined } as unknown as Record<string, string>;
  expect(() => assertKnownTuple(tuple, AXES)).toThrow(
    /"undefined" is not a context of axis "mode"/,
  );
});

it('buildAxisInput stores a raw partial tuple as-authored on swatchbook.axes', () => {
  expect(buildAxisInput({ mode: 'Dark', brand: 'Brand A' }, PROJECT)).toEqual({
    parameters: { swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } } },
  });
});

it('buildAxisInput resolves a preset name to its tuple', () => {
  expect(buildAxisInput('A11y High Contrast', PROJECT)).toEqual({
    parameters: { swatchbook: { axes: { mode: 'Light', contrast: 'High' } } },
  });
});

it('buildAxisInput throws before returning on an invalid tuple', () => {
  expect(() => buildAxisInput({ mode: 'Sepia' }, PROJECT)).toThrow(
    /"Sepia" is not a context of axis "mode"/,
  );
});
