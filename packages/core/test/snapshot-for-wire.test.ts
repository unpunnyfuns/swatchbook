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
});
