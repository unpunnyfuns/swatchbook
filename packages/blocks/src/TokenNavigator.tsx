import { fuzzyFilter } from '@unpunnyfuns/swatchbook-core/fuzzy';
import type { KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './TokenNavigator.css';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { useColorFormat } from '#/contexts.ts';
import { DimensionBar } from '#/dimension-scale/DimensionBar.tsx';
import { themeAttrs } from '#/internal/data-attr.ts';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { EmptyState } from '#/internal/styles.tsx';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';
import type { VirtualToken } from '#/types.ts';

export interface TokenNavigatorProps {
  /** If provided, mount at this dot-path subtree and hide everything outside it. */
  root?: string;
  /**
   * Restrict the tree to tokens with the given DTCG `$type`(s). Pass a single
   * string to scope to one type (`type="color"`), or an array for a narrow
   * small-multiples view (`type={['duration', 'cubicBezier', 'transition']}`).
   * Composes with `root` — both constraints must hold. Group nodes that end
   * up with no surviving leaves collapse out.
   */
  type?: string | readonly string[];
  /**
   * Depth (from the mounted root) that is expanded on first render.
   * `0` = everything collapsed, `1` = top-level groups open (default),
   * `2` = one level deeper, etc.
   */
  initiallyExpanded?: number;
  /**
   * Render a runtime search input above the tree. Matches are fuzzy
   * (case-insensitive, out-of-order terms, single-character typo
   * tolerance) against a leaf's token path; groups that contain no
   * matching leaves collapse out, and every group on the path to a
   * match auto-expands so hits are visible without clicking. Defaults
   * to `true`.
   */
  searchable?: boolean;
  /**
   * Called with a leaf's full dot-path when it is clicked. When set, the
   * inline `<TokenDetail>` slide-over is suppressed — the consumer owns
   * the follow-up UI.
   */
  onSelect?(path: string): void;
}

interface LeafNode {
  kind: 'leaf';
  segment: string;
  path: string;
  token: VirtualToken;
}

interface GroupNode {
  kind: 'group';
  segment: string;
  path: string;
  children: TreeNode[];
}

type TreeNode = LeafNode | GroupNode;

function buildTree(
  resolved: Record<string, VirtualToken>,
  root: string | undefined,
  typeFilter: ReadonlySet<string> | undefined,
): TreeNode[] {
  const rootPrefix = root && root.length > 0 ? `${root}.` : '';
  const rootSegments = root ? root.split('.') : [];

  const entries = Object.entries(resolved).filter(([path, token]) => {
    if (root && !(path === root || path.startsWith(rootPrefix))) return false;
    if (typeFilter && !(token.$type && typeFilter.has(token.$type))) return false;
    return true;
  });

  const rootNode: GroupNode = { kind: 'group', segment: '', path: '', children: [] };

  for (const [path, token] of entries) {
    const remainder = root ? (path === root ? '' : path.slice(rootPrefix.length)) : path;
    const segments = remainder.length > 0 ? remainder.split('.') : [];

    let node: GroupNode = rootNode;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i] as string;
      const prefix = [...rootSegments, ...segments.slice(0, i + 1)].join('.');
      let child = node.children.find(
        (c): c is GroupNode => c.kind === 'group' && c.segment === seg,
      );
      if (!child) {
        child = { kind: 'group', segment: seg, path: prefix, children: [] };
        node.children.push(child);
      }
      node = child;
    }

    const leafSegment = segments[segments.length - 1];
    if (leafSegment === undefined) {
      node.children.push({
        kind: 'leaf',
        segment: root ? (rootSegments[rootSegments.length - 1] ?? path) : path,
        path,
        token,
      });
    } else {
      node.children.push({ kind: 'leaf', segment: leafSegment, path, token });
    }
  }

  sortTree(rootNode);

  return rootNode.children;
}

function sortTree(node: GroupNode): void {
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'group' ? -1 : 1;
    return a.segment.localeCompare(b.segment, undefined, { numeric: true });
  });
  for (const c of node.children) {
    if (c.kind === 'group') sortTree(c);
  }
}

function collectInitialExpanded(nodes: TreeNode[], remainingDepth: number, out: Set<string>): void {
  if (remainingDepth <= 0) return;
  for (const node of nodes) {
    if (node.kind !== 'group') continue;
    out.add(node.path);
    collectInitialExpanded(node.children, remainingDepth - 1, out);
  }
}

function countLeaves(node: TreeNode): number {
  if (node.kind === 'leaf') return 1;
  let n = 0;
  for (const c of node.children) n += countLeaves(c);
  return n;
}

function collectLeafPaths(nodes: TreeNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.kind === 'leaf') out.push(node.path);
    else collectLeafPaths(node.children, out);
  }
}

/**
 * Return a pruned copy of the tree keeping only leaves whose path is in
 * `matches`, plus the groups on the way to them. Every surviving group's
 * path is added to `expandOut` so callers can force those groups open.
 */
function pruneTreeForMatches(
  nodes: TreeNode[],
  matches: ReadonlySet<string>,
  expandOut: Set<string>,
): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === 'leaf') {
      if (matches.has(node.path)) out.push(node);
    } else {
      const children = pruneTreeForMatches(node.children, matches, expandOut);
      if (children.length > 0) {
        expandOut.add(node.path);
        out.push({ ...node, children });
      }
    }
  }
  return out;
}

export function TokenNavigator({
  root,
  type,
  initiallyExpanded = 1,
  searchable = true,
  onSelect,
}: TokenNavigatorProps): ReactElement {
  const { resolved, activePermutation, cssVarPrefix } = useProject();

  const typeFilter = useMemo<ReadonlySet<string> | undefined>(() => {
    if (type === undefined) return undefined;
    return new Set(Array.isArray(type) ? type : [type]);
  }, [type]);

  const tree = useMemo(() => buildTree(resolved, root, typeFilter), [resolved, root, typeFilter]);

  const initialExpanded = useMemo(() => {
    const out = new Set<string>();
    collectInitialExpanded(tree, initiallyExpanded, out);
    return out;
  }, [tree, initiallyExpanded]);

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  useEffect(() => {
    setExpanded(initialExpanded);
  }, [initialExpanded]);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const { visibleTree, searchExpanded } = useMemo(() => {
    if (!searchable || query.trim() === '') {
      return { visibleTree: tree, searchExpanded: null as Set<string> | null };
    }
    const leafPaths: string[] = [];
    collectLeafPaths(tree, leafPaths);
    const matches = new Set(fuzzyFilter(leafPaths, query, (p) => p));
    const expandOut = new Set<string>();
    const pruned = matches.size === 0 ? [] : pruneTreeForMatches(tree, matches, expandOut);
    return { visibleTree: pruned, searchExpanded: expandOut };
  }, [tree, query, searchable]);

  const effectiveExpanded = useMemo(() => {
    if (!searchExpanded) return expanded;
    const merged = new Set(expanded);
    for (const p of searchExpanded) merged.add(p);
    return merged;
  }, [expanded, searchExpanded]);

  const toggle = useCallback((path: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleLeafClick = useCallback(
    (path: string) => {
      if (onSelect) onSelect(path);
      else setSelectedPath(path);
    },
    [onSelect],
  );

  const typeLabel = typeFilter ? ` · ${[...typeFilter].map((t) => `$type=${t}`).join(', ')}` : '';
  const trimmedQuery = query.trim();
  // Must run every render — React's rules of hooks forbid the earlier empty-state
  // early return from skipping it, or the next non-empty render throws
  // "Rendered fewer hooks than expected".
  const matchCount = useMemo(() => {
    if (!searchExpanded) return 0;
    let n = 0;
    for (const node of visibleTree) n += countLeaves(node);
    return n;
  }, [visibleTree, searchExpanded]);

  if (tree.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activePermutation)}>
        <EmptyState>
          {root
            ? `No tokens under "${root}"${typeFilter ? ` matching ${typeLabel.slice(3)}` : ''}.`
            : typeFilter
              ? `No tokens matching ${typeLabel.slice(3)} in the active theme.`
              : 'No tokens in the active theme.'}
        </EmptyState>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activePermutation)}>
      {searchable && (
        <div className="sb-token-navigator__search">
          <input
            type="search"
            className="sb-token-navigator__search-input"
            placeholder="Search tokens…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tokens by path"
            data-testid="token-navigator-search"
          />
        </div>
      )}
      <div className="sb-token-navigator__caption">
        {root ? `Tokens under ${root}` : 'Token graph'}
        {typeLabel}
        {trimmedQuery !== '' ? ` · ${matchCount} matching "${trimmedQuery}"` : ''} ·{' '}
        {activePermutation}
      </div>
      {visibleTree.length === 0 ? (
        <div className="sb-block__empty">No tokens match "{trimmedQuery}".</div>
      ) : (
        <ul className="sb-token-navigator__tree" role="tree">
          {visibleTree.map((node) => (
            <TreeNodeRow
              key={node.path || node.segment}
              node={node}
              expanded={effectiveExpanded}
              onToggle={toggle}
              onLeafClick={handleLeafClick}
            />
          ))}
        </ul>
      )}

      {selectedPath !== null && (
        <DetailOverlay
          path={selectedPath}
          onClose={() => setSelectedPath(null)}
          testId="token-navigator-overlay"
        />
      )}
    </div>
  );
}

interface TreeNodeRowProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle(path: string): void;
  onLeafClick(path: string): void;
}

function TreeNodeRow({ node, expanded, onToggle, onLeafClick }: TreeNodeRowProps): ReactElement {
  if (node.kind === 'leaf') {
    return <LeafRow node={node} onLeafClick={onLeafClick} />;
  }
  const isOpen = expanded.has(node.path);
  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(node.path);
    }
  };
  return (
    <li role="treeitem" aria-expanded={isOpen}>
      <div
        role="button"
        tabIndex={0}
        className="sb-token-navigator__group-row"
        onClick={() => onToggle(node.path)}
        onKeyDown={onKey}
        data-path={node.path}
        data-testid="token-navigator-group"
      >
        <span className="sb-token-navigator__caret" aria-hidden>
          {isOpen ? '▾' : '▸'}
        </span>
        <span>{node.segment}</span>
        <span className="sb-token-navigator__count">{countLeaves(node)}</span>
      </div>
      {isOpen && (
        <ul className="sb-token-navigator__nested" role="group">
          {node.children.map((c) => (
            <TreeNodeRow
              key={c.path || c.segment}
              node={c}
              expanded={expanded}
              onToggle={onToggle}
              onLeafClick={onLeafClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface LeafRowProps {
  node: LeafNode;
  onLeafClick(path: string): void;
}

function LeafRow({ node, onLeafClick }: LeafRowProps): ReactElement {
  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLeafClick(node.path);
    }
  };
  const type = node.token.$type ?? '';
  return (
    <li role="treeitem">
      <div
        role="button"
        tabIndex={0}
        className="sb-token-navigator__leaf-row"
        onClick={() => onLeafClick(node.path)}
        onKeyDown={onKey}
        data-path={node.path}
        data-testid="token-navigator-leaf"
      >
        <span className="sb-token-navigator__caret" aria-hidden>
          •
        </span>
        <span className="sb-token-navigator__tail">{node.segment}</span>
        {type && <span className="sb-token-navigator__type-pill">{type}</span>}
        <LeafPreview path={node.path} token={node.token} />
      </div>
    </li>
  );
}

interface LeafPreviewProps {
  path: string;
  token: VirtualToken;
}

function LeafPreview({ path, token }: LeafPreviewProps): ReactElement {
  const project = useProject();
  const colorFormat = useColorFormat();
  const type = token.$type;

  if (type === 'color') {
    const cssVar = resolveCssVar(path, project);
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__value">
          {formatTokenValue(token.$value, type, colorFormat, project.listing[path])}
        </span>
        <span
          className="sb-token-navigator__color-swatch"
          style={{ background: cssVar }}
          aria-hidden
        />
      </span>
    );
  }
  if (type === 'dimension') {
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__value">
          {formatTokenValue(token.$value, type, colorFormat, project.listing[path])}
        </span>
        <span className="sb-token-navigator__preview-dimension">
          <DimensionBar path={path} kind="length" />
        </span>
      </span>
    );
  }
  if (type === 'shadow') {
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__preview-scaled">
          <ShadowSample path={path} />
        </span>
      </span>
    );
  }
  if (type === 'border') {
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__preview-scaled">
          <BorderSample path={path} />
        </span>
      </span>
    );
  }
  if (type === 'transition' || type === 'duration' || type === 'cubicBezier') {
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__preview-motion">
          <MotionSample path={path} />
        </span>
      </span>
    );
  }

  return (
    <span className="sb-token-navigator__preview-box">
      <span className="sb-token-navigator__value">
        {formatTokenValue(token.$value, type, colorFormat, project.listing[path])}
      </span>
    </span>
  );
}
