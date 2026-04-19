import { describe, expect, it } from 'vitest';
import { buildTree } from '#/TokenNavigator.tsx';
import type { VirtualToken } from '#/types.ts';

const tokens = {
  'color.sys.bg': { $type: 'color', $value: { colorSpace: 'srgb' } },
  'color.sys.fg': { $type: 'color', $value: { colorSpace: 'srgb' } },
  'color.ref.blue.500': { $type: 'color', $value: { colorSpace: 'srgb' } },
  'radius.sm': { $type: 'dimension', $value: { value: 4, unit: 'px' } },
} as Record<string, VirtualToken>;

describe('buildTree', () => {
  it('nests leaves under their dot-separated ancestors', () => {
    const tree = buildTree(tokens, undefined);
    const topNames = tree.map((n) => n.segment).toSorted();
    expect(topNames).toEqual(['color', 'radius']);
  });

  it('sorts groups before leaves at the same level', () => {
    const tree = buildTree(tokens, undefined);
    const color = tree.find((n) => n.segment === 'color');
    expect(color).toBeDefined();
    if (color?.kind !== 'group') throw new Error('expected color to be a group');
    const kinds = color.children.map((c) => c.kind);
    const groupIdx = kinds.indexOf('group');
    const leafIdx = kinds.indexOf('leaf');
    if (groupIdx !== -1 && leafIdx !== -1) expect(groupIdx).toBeLessThan(leafIdx);
  });

  it('scopes the tree when a root is given', () => {
    const tree = buildTree(tokens, 'color.sys');
    expect(tree.length).toBe(2);
    const leaves = tree.filter((n) => n.kind === 'leaf').map((n) => n.segment);
    expect(leaves.toSorted()).toEqual(['bg', 'fg']);
  });

  it('returns an empty tree when the root matches no tokens', () => {
    const tree = buildTree(tokens, 'nope');
    expect(tree).toEqual([]);
  });

  it('carries the token payload on leaves', () => {
    const tree = buildTree({ 'a.b': { $type: 'color', $value: 'x' } }, undefined);
    const a = tree[0];
    if (a?.kind !== 'group') throw new Error('expected a group');
    const leaf = a.children[0];
    if (leaf?.kind !== 'leaf') throw new Error('expected a leaf');
    expect(leaf.token.$type).toBe('color');
  });
});
