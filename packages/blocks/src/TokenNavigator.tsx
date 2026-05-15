import { fuzzyFilter } from '@unpunnyfuns/swatchbook-core/fuzzy';
import type { KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * Flatten the currently-visible treeitems into the order screen-reader
 * users + arrow-key users navigate them: depth-first, only descending
 * into expanded groups. Each entry carries enough metadata for the
 * keyboard handler to compute parent / first-child / next / prev.
 */
interface FlatTreeItem {
  path: string;
  kind: 'group' | 'leaf';
  /** Dot-path of the parent group, or `null` for top-level entries. */
  parentPath: string | null;
}

function flattenVisible(
  nodes: TreeNode[],
  expanded: Set<string>,
  parentPath: string | null,
  out: FlatTreeItem[],
): void {
  for (const node of nodes) {
    out.push({ path: node.path, kind: node.kind, parentPath });
    if (node.kind === 'group' && expanded.has(node.path)) {
      flattenVisible(node.children, expanded, node.path, out);
    }
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

  // WAI-ARIA tree pattern's roving tabindex — exactly one treeitem at a
  // time has tabIndex={0}; the rest are -1. Tab into / out of the tree
  // hits that one item; arrow keys move focus between items inside.
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const treeItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const registerTreeItem = useCallback(
    (path: string) =>
      (el: HTMLLIElement | null): void => {
        if (el) treeItemRefs.current.set(path, el);
        else treeItemRefs.current.delete(path);
      },
    [],
  );

  const flatVisible = useMemo<FlatTreeItem[]>(() => {
    const out: FlatTreeItem[] = [];
    flattenVisible(visibleTree, effectiveExpanded, null, out);
    return out;
  }, [visibleTree, effectiveExpanded]);

  // Reset / repair focused path whenever the visible set changes. Keep
  // the existing focus if it's still visible; otherwise fall back to
  // the first item.
  useEffect(() => {
    if (flatVisible.length === 0) {
      setFocusedPath(null);
      return;
    }
    setFocusedPath((prev) => {
      if (prev && flatVisible.some((entry) => entry.path === prev)) return prev;
      return flatVisible[0]?.path ?? null;
    });
  }, [flatVisible]);

  const focusByPath = useCallback((path: string): void => {
    const node = treeItemRefs.current.get(path);
    if (node) {
      node.focus();
      setFocusedPath(path);
    } else {
      // Ref will register on the next render; flag the path so the
      // focus-repair effect can move focus once the node mounts.
      setFocusedPath(path);
    }
  }, []);

  // After expanding a group via Right-arrow, the new children mount on
  // the following render. If a path was queued via setFocusedPath but
  // the corresponding ref didn't exist at the time, repair focus now
  // that the children are live.
  useEffect(() => {
    if (focusedPath === null) return;
    const node = treeItemRefs.current.get(focusedPath);
    if (node && document.activeElement !== node) {
      // Only steal focus if it currently sits on a different treeitem
      // inside our tree — don't yank it away from the search input or
      // anything outside.
      const active = document.activeElement;
      const insideTree = active instanceof HTMLElement && active.closest('[role="tree"]');
      if (insideTree) node.focus();
    }
  }, [focusedPath]);

  const handleTreeKeyDown = useCallback(
    (e: KeyboardEvent<HTMLUListElement>): void => {
      // Derive the active treeitem from `document.activeElement` rather
      // than the `focusedPath` state. State updates from `onFocus` may
      // not have flushed by the time a subsequent keydown fires (e.g.
      // tests that programmatically `.focus()` then immediately dispatch
      // keys), and the handler must always operate on the row the user
      // is currently on.
      if (flatVisible.length === 0) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLLIElement)) return;
      const activePath = active.getAttribute('data-path');
      if (activePath === null) return;
      const currentIndex = flatVisible.findIndex((entry) => entry.path === activePath);
      if (currentIndex < 0) return;
      const current = flatVisible[currentIndex];
      if (!current) return;

      switch (e.key) {
        case 'ArrowDown': {
          const next = flatVisible[currentIndex + 1];
          if (next) {
            e.preventDefault();
            focusByPath(next.path);
          }
          return;
        }
        case 'ArrowUp': {
          const prev = flatVisible[currentIndex - 1];
          if (prev) {
            e.preventDefault();
            focusByPath(prev.path);
          }
          return;
        }
        case 'Home': {
          const first = flatVisible[0];
          if (first) {
            e.preventDefault();
            focusByPath(first.path);
          }
          return;
        }
        case 'End': {
          const last = flatVisible[flatVisible.length - 1];
          if (last) {
            e.preventDefault();
            focusByPath(last.path);
          }
          return;
        }
        case 'ArrowRight': {
          if (current.kind === 'group') {
            if (!effectiveExpanded.has(current.path)) {
              e.preventDefault();
              toggle(current.path);
              // Focus stays on the group — user can press Right again
              // to step into the first child on the next render.
              return;
            }
            // Already expanded: step into first child (which is the
            // next entry in the flattened list).
            const firstChild = flatVisible[currentIndex + 1];
            if (firstChild && firstChild.parentPath === current.path) {
              e.preventDefault();
              focusByPath(firstChild.path);
            }
          }
          return;
        }
        case 'ArrowLeft': {
          if (current.kind === 'group' && effectiveExpanded.has(current.path)) {
            e.preventDefault();
            toggle(current.path);
            return;
          }
          // Collapsed group or leaf: step to parent.
          if (current.parentPath !== null) {
            e.preventDefault();
            focusByPath(current.parentPath);
          }
          return;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (current.kind === 'group') toggle(current.path);
          else handleLeafClick(current.path);
          return;
        }
        default:
          return;
      }
    },
    [flatVisible, effectiveExpanded, toggle, focusByPath, handleLeafClick],
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
        <ul
          className="sb-token-navigator__tree"
          role="tree"
          aria-label="Token graph"
          onKeyDown={handleTreeKeyDown}
        >
          {visibleTree.map((node) => (
            <TreeNodeRow
              key={node.path || node.segment}
              node={node}
              expanded={effectiveExpanded}
              focusedPath={focusedPath}
              registerTreeItem={registerTreeItem}
              onToggle={toggle}
              onFocusPath={setFocusedPath}
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
  focusedPath: string | null;
  registerTreeItem(path: string): (el: HTMLLIElement | null) => void;
  onToggle(path: string): void;
  onFocusPath(path: string): void;
  onLeafClick(path: string): void;
}

function TreeNodeRow({
  node,
  expanded,
  focusedPath,
  registerTreeItem,
  onToggle,
  onFocusPath,
  onLeafClick,
}: TreeNodeRowProps): ReactElement {
  if (node.kind === 'leaf') {
    return (
      <LeafRow
        node={node}
        focusedPath={focusedPath}
        registerTreeItem={registerTreeItem}
        onFocusPath={onFocusPath}
        onLeafClick={onLeafClick}
      />
    );
  }
  const isOpen = expanded.has(node.path);
  const isFocused = focusedPath === node.path;
  return (
    <li
      ref={registerTreeItem(node.path)}
      role="treeitem"
      aria-expanded={isOpen}
      tabIndex={isFocused ? 0 : -1}
      onFocus={() => onFocusPath(node.path)}
      // Click handler on the `<li>` itself — not the inner row div — so
      // synthetic clicks targeting the treeitem element (Storybook play
      // tests, `userEvent.click(li)`) still toggle. The inner div is
      // layout-only; clicks on its descendants bubble up here.
      onClick={() => {
        onFocusPath(node.path);
        onToggle(node.path);
      }}
      data-path={node.path}
      data-testid="token-navigator-group"
    >
      <div className="sb-token-navigator__group-row">
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
              focusedPath={focusedPath}
              registerTreeItem={registerTreeItem}
              onToggle={onToggle}
              onFocusPath={onFocusPath}
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
  focusedPath: string | null;
  registerTreeItem(path: string): (el: HTMLLIElement | null) => void;
  onFocusPath(path: string): void;
  onLeafClick(path: string): void;
}

function LeafRow({
  node,
  focusedPath,
  registerTreeItem,
  onFocusPath,
  onLeafClick,
}: LeafRowProps): ReactElement {
  const type = node.token.$type ?? '';
  const isFocused = focusedPath === node.path;
  return (
    <li
      ref={registerTreeItem(node.path)}
      role="treeitem"
      tabIndex={isFocused ? 0 : -1}
      onFocus={() => onFocusPath(node.path)}
      // Click on the `<li>` itself for the same reason as group rows —
      // see TreeNodeRow.
      onClick={() => {
        onFocusPath(node.path);
        onLeafClick(node.path);
      }}
      data-path={node.path}
      data-testid="token-navigator-leaf"
    >
      <div className="sb-token-navigator__leaf-row">
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
