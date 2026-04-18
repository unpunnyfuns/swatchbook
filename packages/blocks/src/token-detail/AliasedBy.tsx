import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { styles } from '#/token-detail/styles.ts';
import { type DetailToken, useTokenDetailData } from '#/token-detail/internal.ts';

export interface AliasedByProps {
  /** Full dot-path of the token. */
  path: string;
}

const ALIASED_BY_DEPTH_CAP = 6;

interface AliasedByNode {
  path: string;
  children: AliasedByNode[];
  truncated?: boolean;
}

const GROUP_RANK: Record<string, number> = { ref: 0, sys: 1 };

export function AliasedBy({ path }: AliasedByProps): ReactElement | null {
  const { resolved } = useTokenDetailData(path);
  const tree = useMemo<AliasedByNode[]>(() => buildAliasedByTree(path, resolved), [path, resolved]);
  const truncated = useMemo(() => treeHasTruncation(tree), [tree]);

  if (tree.length === 0) return null;

  return (
    <>
      <div style={styles.sectionHeader}>Aliased by</div>
      <ul style={styles.aliasedByList}>
        {tree.map((node) => (
          <AliasedByRow key={node.path} node={node} depth={0} />
        ))}
      </ul>
      {truncated && (
        <div style={styles.aliasedByTruncated}>
          Further descendants truncated at depth {ALIASED_BY_DEPTH_CAP}.
        </div>
      )}
    </>
  );
}

function AliasedByRow({ node, depth }: { node: AliasedByNode; depth: number }): ReactElement {
  return (
    <li>
      <div style={{ ...styles.aliasedByRow, paddingLeft: depth * 16 }}>
        <span style={styles.chainNode}>{node.path}</span>
      </div>
      {node.children.length > 0 && (
        <ul style={styles.aliasedByList}>
          {node.children.map((child) => (
            <AliasedByRow key={child.path} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function buildAliasedByTree(
  rootPath: string,
  resolved: Record<string, DetailToken>,
): AliasedByNode[] {
  const root = resolved[rootPath];
  const direct = root?.aliasedBy;
  if (!direct || direct.length === 0) return [];
  const visited = new Set<string>([rootPath]);
  return sortPaths(direct).map((p) => walk(p, resolved, visited, 1));
}

function walk(
  path: string,
  resolved: Record<string, DetailToken>,
  visited: Set<string>,
  depth: number,
): AliasedByNode {
  if (visited.has(path)) return { path, children: [] };
  visited.add(path);
  const token = resolved[path];
  const parents = token?.aliasedBy;
  if (!parents || parents.length === 0) return { path, children: [] };
  if (depth >= ALIASED_BY_DEPTH_CAP) {
    return { path, children: [], truncated: true };
  }
  const children = sortPaths(parents).map((p) => walk(p, resolved, visited, depth + 1));
  return { path, children };
}

function sortPaths(paths: readonly string[]): string[] {
  return paths.toSorted((a, b) => {
    const ra = GROUP_RANK[a.split('.')[0] ?? ''] ?? 2;
    const rb = GROUP_RANK[b.split('.')[0] ?? ''] ?? 2;
    return ra !== rb ? ra - rb : a.localeCompare(b);
  });
}

function treeHasTruncation(nodes: AliasedByNode[]): boolean {
  for (const n of nodes) {
    if (n.truncated) return true;
    if (treeHasTruncation(n.children)) return true;
  }
  return false;
}
