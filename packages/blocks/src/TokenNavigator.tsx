import type { CSSProperties, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { useColorFormat } from '#/contexts.ts';
import { DimensionBar } from '#/dimension-scale/DimensionBar.tsx';
import { formatColor } from '#/format-color.ts';
import { BORDER_DEFAULT, MONO_STACK, surfaceStyle } from '#/internal/styles.ts';
import { themeAttrs } from '#/internal/data-attr.ts';
import { formatValue, makeCssVar, useProject } from '#/internal/use-project.ts';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';
import { TokenDetail } from '#/TokenDetail.tsx';
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

const styles = {
  wrapper: surfaceStyle,
  caption: {
    padding: '4px 0 12px',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontSize: 12,
  } satisfies CSSProperties,
  tree: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  } satisfies CSSProperties,
  nested: {
    listStyle: 'none',
    margin: 0,
    paddingLeft: 18,
    borderLeft: BORDER_DEFAULT,
  } satisfies CSSProperties,
  groupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 6px',
    borderRadius: 4,
    cursor: 'pointer',
    userSelect: 'none',
    fontFamily: MONO_STACK,
    fontSize: 12,
  } satisfies CSSProperties,
  leafRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 6px',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: MONO_STACK,
    fontSize: 12,
  } satisfies CSSProperties,
  caret: {
    display: 'inline-block',
    width: 12,
    textAlign: 'center',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  tail: {
    fontFamily: MONO_STACK,
    fontSize: 12,
  } satisfies CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  value: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    marginLeft: 'auto',
    wordBreak: 'break-all',
    maxWidth: '40%',
    textAlign: 'right',
  } satisfies CSSProperties,
  count: {
    marginLeft: 'auto',
    fontSize: 11,
    color: 'var(--sb-color-sys-text-default, CanvasText)',
  } satisfies CSSProperties,
  colorSwatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: 3,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
  } satisfies CSSProperties,
  previewBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  } satisfies CSSProperties,
  empty: {
    padding: '24px 12px',
    textAlign: 'center',
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
  } satisfies CSSProperties,
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  } satisfies CSSProperties,
  panel: {
    width: 'min(560px, 100%)',
    height: '100%',
    overflowY: 'auto',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    boxShadow: '-8px 0 24px rgba(0,0,0,0.2)',
    padding: 16,
    position: 'relative',
  } satisfies CSSProperties,
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 4,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.3))',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
  } satisfies CSSProperties,
};

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
      <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
        <div style={styles.empty}>
          {root ? `No tokens under "${root}".` : 'No tokens in the active theme.'}
        </div>
      </div>
    );
  }

  return (
    <div {...themeAttrs(cssVarPrefix, activeTheme)} style={styles.wrapper}>
      <div style={styles.caption}>
        {root ? `Tokens under ${root}` : 'Token graph'} · {activeTheme}
      </div>
      <ul style={styles.tree} role='tree'>
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
        <DetailOverlay path={selectedPath} onClose={() => setSelectedPath(null)} />
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
    <li role='treeitem' aria-expanded={isOpen}>
      <div
        role='button'
        tabIndex={0}
        style={styles.groupRow}
        onClick={() => onToggle(node.path)}
        onKeyDown={onKey}
        data-path={node.path}
        data-testid='token-navigator-group'
      >
        <span style={styles.caret} aria-hidden>
          {isOpen ? '▾' : '▸'}
        </span>
        <span>{node.segment}</span>
        <span style={styles.count}>{countLeaves(node)}</span>
      </div>
      {isOpen && (
        <ul style={styles.nested} role='group'>
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
    <li role='treeitem'>
      <div
        role='button'
        tabIndex={0}
        style={styles.leafRow}
        onClick={() => onLeafClick(node.path)}
        onKeyDown={onKey}
        data-path={node.path}
        data-testid='token-navigator-leaf'
      >
        <span style={styles.caret} aria-hidden>
          •
        </span>
        <span style={styles.tail}>{node.segment}</span>
        {type && <span style={styles.typePill}>{type}</span>}
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
    const formatted = formatColor(token.$value, colorFormat);
    return (
      <span style={styles.previewBox}>
        <span style={styles.value}>{formatted?.value ?? formatValue(token.$value)}</span>
        <span style={{ ...styles.colorSwatch, background: cssVar, marginLeft: 8 }} aria-hidden />
      </span>
    );
  }
  if (type === 'dimension') {
    return (
      <span style={styles.previewBox}>
        <span style={styles.value}>{formatValue(token.$value)}</span>
        <span style={{ marginLeft: 8, display: 'inline-block', minWidth: 40, maxWidth: 120 }}>
          <DimensionBar path={path} kind='length' />
        </span>
      </span>
    );
  }
  if (type === 'shadow') {
    return (
      <span style={styles.previewBox}>
        <span
          style={{
            marginLeft: 8,
            display: 'inline-block',
            transform: 'scale(0.5)',
            transformOrigin: 'right center',
          }}
        >
          <ShadowSample path={path} />
        </span>
      </span>
    );
  }
  if (type === 'border') {
    return (
      <span style={styles.previewBox}>
        <span
          style={{
            marginLeft: 8,
            display: 'inline-block',
            transform: 'scale(0.5)',
            transformOrigin: 'right center',
          }}
        >
          <BorderSample path={path} />
        </span>
      </span>
    );
  }
  if (type === 'transition' || type === 'duration' || type === 'cubicBezier') {
    return (
      <span style={styles.previewBox}>
        <span style={{ marginLeft: 8, display: 'inline-block', width: 80 }}>
          <MotionSample path={path} />
        </span>
      </span>
    );
  }

  return (
    <span style={styles.previewBox}>
      <span style={styles.value}>{formatValue(token.$value)}</span>
    </span>
  );
}

interface DetailOverlayProps {
  path: string;
  onClose(): void;
}

function DetailOverlay({ path, onClose }: DetailOverlayProps): ReactElement {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={styles.backdrop}
      onClick={onClose}
      role='presentation'
      data-testid='token-navigator-overlay'
    >
      <div
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-label={`Token detail for ${path}`}
      >
        <button
          type='button'
          style={styles.closeButton}
          onClick={onClose}
          aria-label='Close'
          data-testid='token-navigator-close'
        >
          ×
        </button>
        <TokenDetail path={path} />
      </div>
    </div>
  );
}
