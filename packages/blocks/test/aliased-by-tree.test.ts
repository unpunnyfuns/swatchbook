import { expect, it } from 'vitest';
import { buildAliasedByTree } from '#/token-detail/AliasedBy.tsx';
import type { DetailToken } from '#/token-detail/internal.ts';

it('shows a shared descendant under every sibling branch of a diamond alias graph', () => {
  // root is aliased-by A and B; both A and B are aliased-by C. A shared
  // `visited` set let the first branch claim C and truncate the second;
  // a per-path ancestor set shows C's subtree under both.
  const resolved: Record<string, DetailToken> = {
    root: { aliasedBy: ['a', 'b'] },
    a: { aliasedBy: ['c'] },
    b: { aliasedBy: ['c'] },
    c: { aliasedBy: ['leaf'] },
    leaf: { aliasedBy: [] },
  };
  const tree = buildAliasedByTree('root', resolved);
  expect(tree.map((n) => n.path)).toEqual(['a', 'b']);
  // Both branches reach c -> leaf, not just the first.
  for (const branch of tree) {
    expect(branch.children.map((n) => n.path)).toEqual(['c']);
    expect(branch.children[0]?.children.map((n) => n.path)).toEqual(['leaf']);
  }
});

it('still guards genuine cycles (a node in its own ancestry stops)', () => {
  const resolved: Record<string, DetailToken> = {
    root: { aliasedBy: ['a'] },
    a: { aliasedBy: ['b'] },
    b: { aliasedBy: ['a'] },
  };
  const tree = buildAliasedByTree('root', resolved);
  // a -> b -> a is cut at the repeat rather than recursing forever.
  const a = tree[0];
  expect(a?.path).toBe('a');
  const b = a?.children[0];
  expect(b?.path).toBe('b');
  expect(b?.children).toEqual([{ path: 'a', children: [] }]);
});
