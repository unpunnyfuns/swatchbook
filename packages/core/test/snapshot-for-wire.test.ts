import { describe, expect, it } from 'vitest';
import { snapshotForWire } from '#/snapshot-for-wire.ts';
import { loadWithPrefix } from './_helpers.ts';

describe('snapshotForWire', () => {
  it('includes tokenGraph alongside legacy fields', async () => {
    const project = await loadWithPrefix(undefined);
    const wire = snapshotForWire(project, '');
    expect(wire.tokenGraph).toBeDefined();
    expect(wire.tokenGraph.nodes).toBeDefined();
    expect(wire.tokenGraph.axes).toEqual(project.tokenGraph.axes);
    expect(Object.keys(wire.tokenGraph.nodes).length).toBe(
      Object.keys(project.tokenGraph.nodes).length,
    );
  });

  it('tokenGraph in wire is JSON-roundtrip safe', async () => {
    const project = await loadWithPrefix(undefined);
    const wire = snapshotForWire(project, '');
    const roundtripped = JSON.parse(JSON.stringify(wire.tokenGraph));
    expect(roundtripped).toEqual(wire.tokenGraph);
  });

  it('slims each listing entry to names + previewValue + source, dropping other extension fields', () => {
    const project = {
      axes: [],
      disabledAxes: [],
      presets: [],
      diagnostics: [],
      config: {},
      defaultTuple: {},
      tokenGraph: { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
      listing: {
        'color.a': {
          $name: 'color.a',
          $type: 'color',
          $value: { colorSpace: 'srgb', components: [0, 0, 0] },
          $extensions: {
            'app.terrazzo.listing': {
              names: { css: '--color-a' },
              previewValue: '#000000',
              source: { resource: 'color.json' },
              originalValue: { colorSpace: 'srgb', components: [0, 0, 0] },
            },
          },
        },
      },
    } as unknown as Parameters<typeof snapshotForWire>[0];

    const wire = snapshotForWire(project, '');
    expect(wire.listing['color.a']).toEqual({
      names: { css: '--color-a' },
      previewValue: '#000000',
      source: { resource: 'color.json' },
    });
    // originalValue (the heavy field) is dropped by the slimmer.
    expect('originalValue' in wire.listing['color.a']!).toBe(false);
  });

  it('returns an empty listing for an empty input (a no-op slimmer would too — but the names are asserted above)', () => {
    const project = {
      axes: [],
      disabledAxes: [],
      presets: [],
      diagnostics: [],
      config: {},
      defaultTuple: {},
      tokenGraph: { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
      listing: {},
    } as unknown as Parameters<typeof snapshotForWire>[0];
    expect(snapshotForWire(project, '').listing).toEqual({});
  });
});
