import { expect, it } from 'vitest';
import { assertKnownTuple, buildAxisVariant, resolvePreset } from '#/axis-variant.ts';
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

// A fake CSF-factory story: `extend` records its patch so we can assert it
// without Storybook. `input.name` drives the display-name branch.
function fakeStory(name?: string) {
  return {
    input: name === undefined ? {} : { name },
    extend(patch: Record<string, unknown>) {
      return { extended: patch };
    },
  };
}

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

it('buildAxisVariant stores a raw partial tuple as-authored on swatchbook.axes', () => {
  const out = buildAxisVariant(fakeStory(), { mode: 'Dark', brand: 'Brand A' }, {}, PROJECT) as {
    extended: Record<string, unknown>;
  };
  expect(out.extended.parameters).toEqual({
    swatchbook: { axes: { mode: 'Dark', brand: 'Brand A' } },
  });
});

it('buildAxisVariant resolves a preset name to its tuple', () => {
  const out = buildAxisVariant(fakeStory(), 'A11y High Contrast', {}, PROJECT) as {
    extended: Record<string, unknown>;
  };
  expect(out.extended.parameters).toEqual({
    swatchbook: { axes: { mode: 'Light', contrast: 'High' } },
  });
});

it('buildAxisVariant labels a preset variant with the preset name', () => {
  const out = buildAxisVariant(fakeStory(), 'Brand A Dark', {}, PROJECT) as {
    extended: { name: string };
  };
  expect(out.extended.name).toBe('Brand A Dark');
});

it('buildAxisVariant labels a raw-tuple variant with axis: context joined by a middle dot', () => {
  const out = buildAxisVariant(fakeStory(), { mode: 'Dark', brand: 'Brand A' }, {}, PROJECT) as {
    extended: { name: string };
  };
  expect(out.extended.name).toBe('mode: Dark · brand: Brand A');
});

it('buildAxisVariant prefixes the base name when the base story sets one', () => {
  const out = buildAxisVariant(fakeStory('Full table'), 'Brand A Dark', {}, PROJECT) as {
    extended: { name: string };
  };
  expect(out.extended.name).toBe('Full table (Brand A Dark)');
});

it('buildAxisVariant adds a !dev tag only when hidden is set', () => {
  const shown = buildAxisVariant(fakeStory(), 'Brand A Dark', {}, PROJECT) as {
    extended: Record<string, unknown>;
  };
  expect('tags' in shown.extended).toBe(false);

  const hidden = buildAxisVariant(fakeStory(), 'Brand A Dark', { hidden: true }, PROJECT) as {
    extended: { tags: string[] };
  };
  expect(hidden.extended.tags).toEqual(['!dev']);
});

it('buildAxisVariant throws before extending on an invalid tuple', () => {
  expect(() => buildAxisVariant(fakeStory(), { mode: 'Sepia' }, {}, PROJECT)).toThrow(
    /"Sepia" is not a context of axis "mode"/,
  );
});
