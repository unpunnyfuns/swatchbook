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
      expect(write.baseValue.$value).toEqual([{ position: 0 }, { position: 1 }]);
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
});
