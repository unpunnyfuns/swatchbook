import { describe, expect, it } from 'vitest';
import { buildTokenGraph, buildTokenGraphFromLayered } from '#/token-graph/build.ts';
import type { Axis } from '#/types.ts';
import { loadReferenceFixtureParserInput } from '../_helpers.ts';

describe('diagnostic emission', () => {
  it('reference fixture emits no diagnostics', async () => {
    const { parserInput, axes, defaultTuple } = await loadReferenceFixtureParserInput();
    const { diagnostics } = buildTokenGraph(parserInput, axes, defaultTuple);
    expect(diagnostics).toHaveLength(0);
  });

  it('emits unresolvableAliasDiagnostic for a write that aliases a nonexistent path', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const baseline = {
      'color.fg': { $value: '#000', $type: 'color' },
    };
    // permutationID({ mode: 'Dark' }) = 'Dark'
    const perSingletonResolved = {
      Dark: {
        'color.fg': { $value: '#fff', $type: 'color', aliasOf: 'does.not.exist' },
      },
    };
    const defaultTuple = { mode: 'Light' };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, perSingletonResolved, defaultTuple);
    expect(
      diagnostics.some(
        (d) => d.group === 'swatchbook/token-graph' && d.message.includes('does.not.exist'),
      ),
    ).toBe(true);
  });

  it('emits aliasCycleDiagnostic for a baseline cycle (A aliases B aliases A)', () => {
    const axes: Axis[] = [];
    const baseline = {
      A: { $value: '#000', $type: 'color', aliasOf: 'B' },
      B: { $value: '#000', $type: 'color', aliasOf: 'A' },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    expect(
      diagnostics.some(
        (d) =>
          d.group === 'swatchbook/token-graph' &&
          d.severity === 'warn' &&
          (d.message.includes('A') || d.message.includes('B')),
      ),
    ).toBe(true);
  });

  it('does not emit unresolvableAliasDiagnostic when the target exists in the graph', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
    ];
    const baseline = {
      'color.fg': { $value: '#000', $type: 'color' },
      'color.palette.white': { $value: '#fff', $type: 'color' },
    };
    // permutationID({ mode: 'Dark' }) = 'Dark'
    const perSingletonResolved = {
      Dark: {
        'color.fg': { $value: '#fff', $type: 'color', aliasOf: 'color.palette.white' },
        'color.palette.white': { $value: '#fff', $type: 'color' },
      },
    };
    const defaultTuple = { mode: 'Light' };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, perSingletonResolved, defaultTuple);
    expect(diagnostics).toHaveLength(0);
  });

  it('emits malformedColorShapeDiagnostic when a color token has object $value with no components', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.broken': {
        $type: 'color',
        $value: { colorSpace: 'srgb', alpha: 0.5 },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.severity === 'warn' &&
        d.message.includes('color.broken') &&
        d.message.includes('components'),
    );
    expect(match).toBeDefined();
  });

  it('emits malformedColorShapeDiagnostic for object components on a color token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.broken': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: { r: 1, g: 0, b: 0 } as unknown as number[] },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('color.broken') &&
        d.message.includes('must be an array'),
    );
    expect(match).toBeDefined();
  });

  it('emits malformedColorShapeDiagnostic for a malformed color sub-field in a border token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'border.thin': {
        $type: 'border',
        $value: {
          color: { colorSpace: 'srgb', alpha: 1 },
          style: 'solid',
          width: '1px',
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('border.thin') &&
        d.message.includes('color') &&
        d.message.includes('components'),
    );
    expect(match).toBeDefined();
  });

  it('does not emit malformedColorShapeDiagnostic for a well-formed color token', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.ok': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      },
      'color.string-form': {
        $type: 'color',
        $value: '#ff0000',
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const colorShapeDiags = diagnostics.filter((d) => d.message.includes('structurally invalid'));
    expect(colorShapeDiags).toHaveLength(0);
  });

  it('emits unresolvedRefDiagnostic when color components carry an unresolved $ref object', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.via-ref': {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: { $ref: '#/primitives/color/gray/12/$value/components' } as unknown as number[],
          alpha: 1,
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.severity === 'warn' &&
        d.message.includes('Unresolved `$ref`') &&
        d.message.includes('color.via-ref') &&
        d.message.includes('#/primitives/color/gray/12/$value/components'),
    );
    expect(match).toBeDefined();

    // The generic "must be an array" diagnostic should NOT also fire — the
    // $ref-specific message replaces it.
    const generic = diagnostics.filter((d) => d.message.includes('must be an array of numbers'));
    expect(generic).toHaveLength(0);
  });

  it('still emits generic malformedColorShapeDiagnostic for non-$ref non-array components', () => {
    const axes: Axis[] = [];
    const baseline = {
      'color.bad-shape': {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: { r: 1, g: 0, b: 0 } as unknown as number[],
          alpha: 1,
        },
      },
    };
    const { diagnostics } = buildTokenGraphFromLayered(axes, baseline, {}, {});
    const match = diagnostics.find(
      (d) =>
        d.group === 'swatchbook/token-graph' &&
        d.message.includes('color.bad-shape') &&
        d.message.includes('must be an array of numbers'),
    );
    expect(match).toBeDefined();
  });
});
