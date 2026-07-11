import { expect, it } from 'vitest';
import { buildTree, flattenVisible } from '#/TokenNavigator.tsx';
import type { VirtualToken } from '#/types.ts';

// Hand-built resolved map: two nested color groups plus one top-level
// dimension leaf, enough to exercise nesting, sibling ordering, and the
// group-vs-leaf split without a real project.
const resolved: Record<string, VirtualToken> = {
  'color.palette.blue.600': { $type: 'color', $value: { hex: '#006' } },
  'color.palette.blue.500': { $type: 'color', $value: { hex: '#005' } },
  'color.brand.primary': { $type: 'color', $value: { hex: '#00f' } },
  'space.md': { $type: 'dimension', $value: '8px' },
};

it('groups paths into a nested tree, sorted with groups before leaves', () => {
  const tree = buildTree(resolved, undefined, undefined);

  expect(tree.map((n) => n.segment)).toEqual(['color', 'space']);
  const color = tree[0];
  if (color?.kind !== 'group') throw new Error('expected color to be a group');
  expect(color.children.map((n) => n.segment)).toEqual(['brand', 'palette']);

  const palette = color.children.find((n) => n.segment === 'palette');
  if (palette?.kind !== 'group') throw new Error('expected palette to be a group');
  expect(palette.path).toBe('color.palette');

  const blue = palette.children[0];
  if (blue?.kind !== 'group') throw new Error('expected blue to be a group');
  expect(blue.path).toBe('color.palette.blue');
  // Numeric sort keeps 500 before 600, not lexicographic '500' > '600'-adjacent oddities.
  expect(blue.children.map((n) => n.segment)).toEqual(['500', '600']);
  expect(blue.children.every((n) => n.kind === 'leaf')).toBe(true);
});

it('scopes the tree to a root subtree and rewrites paths relative to it', () => {
  const tree = buildTree(resolved, 'color.palette', undefined);

  expect(tree.map((n) => n.segment)).toEqual(['blue']);
  const blue = tree[0];
  if (blue?.kind !== 'group') throw new Error('expected blue to be a group');
  expect(blue.path).toBe('color.palette.blue');
  expect(blue.children.map((n) => (n.kind === 'leaf' ? n.path : null))).toEqual([
    'color.palette.blue.500',
    'color.palette.blue.600',
  ]);
});

it('drops leaves outside the type filter and prunes groups left empty', () => {
  const tree = buildTree(resolved, undefined, new Set(['dimension']));

  expect(tree.map((n) => n.segment)).toEqual(['space']);
  const space = tree[0];
  if (space?.kind !== 'group') throw new Error('expected space to be a group');
  expect(space.children).toEqual([
    { kind: 'leaf', segment: 'md', path: 'space.md', token: resolved['space.md'] },
  ]);
});

it('flattens only expanded groups, depth-first, in tree order', () => {
  const tree = buildTree(resolved, undefined, undefined);
  const out: Parameters<typeof flattenVisible>[3] = [];
  flattenVisible(tree, new Set(['color', 'color.brand', 'space']), null, out);

  // 'palette' stays collapsed since it isn't in the expanded set, so its
  // 'blue' child never appears — but its sibling 'brand' and the top-level
  // 'space' group, both expanded, reveal their leaves.
  expect(out).toEqual([
    { path: 'color', kind: 'group', parentPath: null },
    { path: 'color.brand', kind: 'group', parentPath: 'color' },
    { path: 'color.brand.primary', kind: 'leaf', parentPath: 'color.brand' },
    { path: 'color.palette', kind: 'group', parentPath: 'color' },
    { path: 'space', kind: 'group', parentPath: null },
    { path: 'space.md', kind: 'leaf', parentPath: 'space' },
  ]);
});
