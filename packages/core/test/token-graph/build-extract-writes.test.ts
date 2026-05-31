import { describe, expect, it } from 'vitest';
import { extractWritesFromModifiers } from '#/token-graph/build.ts';
import type { Axis } from '#/types.ts';

describe('extractWritesFromModifiers', () => {
  it('extracts literal writes', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [{ color: { fg: { $value: '#fff', $type: 'color' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['color.fg']?.mode?.Dark).toEqual({
      kind: 'literal',
      value: { $value: '#fff', $type: 'color' },
    });
  });

  it('extracts alias writes', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [{ color: { fg: { $value: '{color.palette.gray.0}' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['color.fg']?.mode?.Dark).toEqual({
      kind: 'alias',
      target: 'color.palette.gray.0',
    });
  });

  it('extracts partial-alias writes for composite types', () => {
    const modifiers = {
      brand: {
        contexts: {
          BrandA: [
            {
              border: {
                default: {
                  $type: 'border',
                  $value: { width: '2px', style: 'solid', color: '{color.brand.a}' },
                },
              },
            },
          ],
        },
        default: 'Default',
      },
    };
    const axes: Axis[] = [
      { name: 'brand', contexts: ['Default', 'BrandA'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['border.default']?.brand?.BrandA).toMatchObject({
      kind: 'partial-alias',
      aliasFields: { color: 'color.brand.a' },
    });
  });

  it('skips default contexts', () => {
    const modifiers = {
      mode: {
        contexts: {
          Light: [{ color: { fg: { $value: '#000' } } }],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes).toEqual({});
  });

  it('returns empty object for modifiers with no contexts', () => {
    const modifiers = {
      mode: { default: 'Light' },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes).toEqual({});
  });

  it('extracts partial-alias writes for gradient composites with array stops', () => {
    const modifiers = {
      brand: {
        contexts: {
          BrandA: [
            {
              gradient: {
                hero: {
                  $type: 'gradient',
                  $value: [
                    { color: '{color.brand.a}', position: 0 },
                    { color: '{color.brand.b}', position: 1 },
                  ],
                },
              },
            },
          ],
        },
        default: 'Default',
      },
    };
    const axes: Axis[] = [
      { name: 'brand', contexts: ['Default', 'BrandA'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    const write = writes['gradient.hero']?.brand?.BrandA;
    expect(write?.kind).toBe('partial-alias');
    if (write?.kind === 'partial-alias') {
      expect(write.aliasFields).toEqual({
        '0.color': 'color.brand.a',
        '1.color': 'color.brand.b',
      });
      expect(write.baseValue.$value).toEqual([
        { color: '{color.brand.a}', position: 0 },
        { color: '{color.brand.b}', position: 1 },
      ]);
    }
  });

  it('handles axes missing from modifiers (no contribution)', () => {
    const modifiers = {
      mode: {
        contexts: { Dark: [{ a: { $value: '#000' } }] },
        default: 'Light',
      },
    };
    // axes includes 'brand' which has no modifier — should not crash
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
      { name: 'brand', contexts: ['Default'], default: 'Default', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['a']?.mode?.Dark).toEqual({ kind: 'literal', value: { $value: '#000' } });
    expect(writes['a']?.brand).toBeUndefined();
  });

  it('substitutes $ref objects in modifier values against the refLookup token map', () => {
    // The consumer-reported failure mode: a modifier writes a color with
    // `components: { $ref: '#/primitives/.../components' }`. Without
    // substitution, the raw $ref object reaches the walker and crashes
    // colorjs.io at emit. With refLookup, the substituted array is what
    // gets stored as the write's value.
    const refLookup = {
      'primitives.color.gray.12': {
        $type: 'color' as const,
        $value: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], alpha: 1 },
      },
    };
    const modifiers = {
      'color-mode': {
        contexts: {
          dark: [
            {
              semantics: {
                color: {
                  emphasis: {
                    accent: {
                      base: {
                        active: {
                          $type: 'color',
                          $value: {
                            colorSpace: 'oklch',
                            alpha: 0.6,
                            components: { $ref: '#/primitives/color/gray/12/$value/components' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        default: 'light',
      },
    };
    const axes: Axis[] = [
      {
        name: 'color-mode',
        contexts: ['light', 'dark'],
        default: 'light',
        source: 'resolver',
      },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes, refLookup);
    const write = writes['semantics.color.emphasis.accent.base.active']?.['color-mode']?.dark;
    expect(write?.kind).toBe('literal');
    if (write?.kind === 'literal') {
      const $value = write.value.$value as { components: unknown };
      expect($value.components).toEqual([0.5, 0.5, 0.5]);
    }
  });

  it('leaves $ref objects intact when the target is missing from refLookup', () => {
    const modifiers = {
      mode: {
        contexts: {
          Dark: [
            {
              c: {
                $type: 'color',
                $value: {
                  colorSpace: 'srgb',
                  alpha: 1,
                  components: { $ref: '#/nonexistent/path' },
                },
              },
            },
          ],
        },
        default: 'Light',
      },
    };
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes, {});
    const write = writes['c']?.mode?.Dark;
    expect(write?.kind).toBe('literal');
    if (write?.kind === 'literal') {
      const $value = write.value.$value as { components: unknown };
      expect($value.components).toEqual({ $ref: '#/nonexistent/path' });
    }
  });

  it('inherits $type from a parent group node when the leaf lacks its own', () => {
    // Modifier source where `border` group declares $type, and child leaves
    // (`default`) carry only $value. Without inheritance, toWriteValue can't
    // detect alias sub-fields and would classify as 'literal'.
    const modifiers = {
      contrast: {
        contexts: {
          High: [
            {
              border: {
                $type: 'border',
                default: {
                  $value: { color: '{color.border.default}', width: '2px', style: 'solid' },
                },
              },
            },
          ],
        },
        default: 'Normal',
      },
    };
    const axes: Axis[] = [
      { name: 'contrast', contexts: ['Normal', 'High'], default: 'Normal', source: 'resolver' },
    ];
    const writes = extractWritesFromModifiers(modifiers, axes);
    expect(writes['border.default']?.contrast?.High?.kind).toBe('partial-alias');
  });
});
