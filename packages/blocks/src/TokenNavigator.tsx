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
import { makeCssVar, useProject } from '#/internal/use-project.ts';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';
import type { VirtualToken } from '#/types.ts';

export interface TokenNavigatorProps {
  /** If provided, mount at this dot-path subtree and hide everything outside it. */
  root?: string;
  /**
   * Depth (from the mounted root) that is expanded on first render.
   * `0` = everything collapsed, `1` = top-level groups open (default),
   * `2` = one level deeper, etc.
   */
  initiallyExpanded?: number;
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

function buildTree(resolved: Record<string, VirtualToken>, root: string | undefined): TreeNode[] {
  const rootPrefix = root && root.length > 0 ? `${root}.` : '';
  const rootSegments = root ? root.split('.') : [];

  const entries = Object.entries(resolved).filter(([path]) => {
    if (!root) return true;
    return path === root || path.startsWith(rootPrefix);
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

export function TokenNavigator({
  root,
  initiallyExpanded = 1,
  onSelect,
}: TokenNavigatorProps): ReactElement {
  const { resolved, activeTheme, cssVarPrefix } = useProject();

  const tree = useMemo(() => buildTree(resolved, root), [resolved, root]);

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

  if (tree.length === 0) {
    return (
      <div {...themeAttrs(cssVarPrefix, activeTheme)}>
        <EmptyState>
          {root ? `No tokens under "${root}".` : 'No tokens in the active theme.'}
        </EmptyState>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)}>
      <div className="sb-token-navigator__caption">
        {root ? `Tokens under ${root}` : 'Token graph'} · {activeTheme}
      </div>
      <ul className="sb-token-navigator__tree" role="tree">
        {tree.map((node) => (
          <TreeNodeRow
            key={node.path || node.segment}
            node={node}
            expanded={expanded}
            onToggle={toggle}
            onLeafClick={handleLeafClick}
          />
        ))}
      </ul>

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
  const { cssVarPrefix } = useProject();
  const colorFormat = useColorFormat();
  const type = token.$type;

  if (type === 'color') {
    const cssVar = makeCssVar(path, cssVarPrefix);
    return (
      <span className="sb-token-navigator__preview-box">
        <span className="sb-token-navigator__value">
          {formatTokenValue(token.$value, type, colorFormat)}
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
          {formatTokenValue(token.$value, type, colorFormat)}
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
        {formatTokenValue(token.$value, type, colorFormat)}
      </span>
    </span>
  );
}
