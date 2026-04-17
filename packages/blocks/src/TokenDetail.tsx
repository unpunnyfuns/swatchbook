import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';
import { formatValue, makeCssVar, useProject } from '#/internal/use-project.ts';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

interface DetailToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
}

const ALIASED_BY_DEPTH_CAP = 6;

interface AliasedByNode {
  path: string;
  children: AliasedByNode[];
  truncated?: boolean;
}

const styles = {
  wrapper: {
    fontFamily: 'var(--sb-typography-sys-body-font-family, system-ui)',
    fontSize: 'var(--sb-typography-sys-body-font-size, 14px)',
    color: 'var(--sb-color-sys-text-default, CanvasText)',
    background: 'var(--sb-color-sys-surface-default, Canvas)',
    padding: 16,
    borderRadius: 6,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  heading: {
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 16,
  } satisfies CSSProperties,
  subline: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '4px 0 12px',
    fontSize: 12,
    opacity: 0.8,
  } satisfies CSSProperties,
  typePill: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  description: {
    margin: '0 0 12px',
    opacity: 0.85,
  } satisfies CSSProperties,
  sectionHeader: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    margin: '12px 0 6px',
  } satisfies CSSProperties,
  chain: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  chainNode: {
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.2))',
  } satisfies CSSProperties,
  arrow: {
    opacity: 0.5,
  } satisfies CSSProperties,
  themeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    fontSize: 12,
  } satisfies CSSProperties,
  themeRow: {
    borderBottom: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
  } satisfies CSSProperties,
  themeCell: {
    padding: '6px 8px',
    verticalAlign: 'middle',
  } satisfies CSSProperties,
  swatch: {
    display: 'inline-block',
    width: 14,
    height: 14,
    verticalAlign: 'middle',
    marginRight: 6,
    borderRadius: 3,
    border: '1px solid var(--sb-color-sys-border-default, rgba(0,0,0,0.1))',
  } satisfies CSSProperties,
  snippet: {
    display: 'block',
    padding: '8px 10px',
    borderRadius: 4,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.1))',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    whiteSpace: 'pre',
    overflow: 'auto',
  } satisfies CSSProperties,
  missing: {
    padding: 12,
    opacity: 0.7,
  } satisfies CSSProperties,
  typographySample: {
    padding: '8px 0',
  } satisfies CSSProperties,
  shadowSample: {
    width: 140,
    height: 56,
    background: 'var(--sb-color-sys-surface-raised, #fff)',
    border: '1px solid var(--sb-color-sys-border-default, rgba(128,128,128,0.15))',
    borderRadius: 6,
  } satisfies CSSProperties,
  borderSample: {
    width: 140,
    height: 56,
    background: 'var(--sb-color-sys-surface-raised, transparent)',
    borderRadius: 6,
  } satisfies CSSProperties,
  fontFamilySample: {
    padding: '4px 0',
    fontSize: 22,
    lineHeight: 1.2,
  } satisfies CSSProperties,
  fontWeightSample: {
    padding: '4px 0',
    fontSize: 32,
    lineHeight: 1,
  } satisfies CSSProperties,
  dimensionTrack: {
    display: 'flex',
    alignItems: 'center',
    height: 32,
    maxWidth: '100%',
    overflow: 'hidden',
  } satisfies CSSProperties,
  dimensionBar: {
    height: 16,
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
    borderRadius: 3,
    maxWidth: '100%',
  } satisfies CSSProperties,
  motionTrack: {
    position: 'relative',
    height: 32,
    width: '100%',
    maxWidth: 320,
    background: 'var(--sb-color-sys-surface-muted, rgba(128,128,128,0.08))',
    borderRadius: 16,
    overflow: 'hidden',
  } satisfies CSSProperties,
  motionBall: {
    position: 'absolute',
    top: '50%',
    width: 24,
    height: 24,
    marginTop: -12,
    borderRadius: '50%',
    background: 'var(--sb-color-sys-accent-bg, #3b82f6)',
  } satisfies CSSProperties,
  aliasedByList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  } satisfies CSSProperties,
  aliasedByRow: {
    padding: '2px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } satisfies CSSProperties,
  aliasedByTruncated: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  } satisfies CSSProperties,
  reducedMotion: {
    fontSize: 11,
    color: 'var(--sb-color-sys-text-muted, CanvasText)',
    fontStyle: 'italic',
  } satisfies CSSProperties,
};

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { activeTheme, themesResolved, resolved, cssVarPrefix } = useProject();

  const token = resolved[path] as DetailToken | undefined;
  const cssVar = makeCssVar(path, cssVarPrefix);

  const aliasedByTree = useMemo<AliasedByNode[]>(
    () => buildAliasedByTree(path, resolved),
    [path, resolved],
  );
  const aliasedByTruncated = useMemo(() => treeHasTruncation(aliasedByTree), [aliasedByTree]);

  const chain = useMemo<string[]>(() => {
    if (!token) return [];
    if (Array.isArray(token.aliasChain) && token.aliasChain.length > 0) {
      return [path, ...token.aliasChain];
    }
    if (typeof token.aliasOf === 'string') return [path, token.aliasOf];
    return [path];
  }, [token, path]);

  if (!token) {
    return (
      <div data-theme={activeTheme} style={styles.wrapper}>
        <div style={styles.missing}>
          Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
        </div>
      </div>
    );
  }

  const isColor = token.$type === 'color';
  const value = formatValue(token.$value);

  return (
    <div data-theme={activeTheme} style={styles.wrapper}>
      <h3 style={styles.heading}>{heading ?? path}</h3>
      <div style={styles.subline}>
        {token.$type && <span style={styles.typePill}>{token.$type}</span>}
        <span>{cssVar}</span>
      </div>
      {token.$description && <p style={styles.description}>{token.$description}</p>}

      <div style={styles.sectionHeader}>Resolved value · {activeTheme}</div>
      <CompositePreview type={token.$type} cssVar={cssVar} />
      <div style={styles.chain}>
        {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
        <span>{value}</span>
      </div>

      {chain.length > 1 && (
        <>
          <div style={styles.sectionHeader}>Alias chain</div>
          <div style={styles.chain}>
            {chain.map((step, i) => (
              <span key={step} style={styles.chain}>
                <span style={styles.chainNode}>{step}</span>
                {i < chain.length - 1 && <span style={styles.arrow}>→</span>}
              </span>
            ))}
          </div>
        </>
      )}

      {aliasedByTree.length > 0 && (
        <>
          <div style={styles.sectionHeader}>Aliased by</div>
          <ul style={styles.aliasedByList}>
            {aliasedByTree.map((node) => (
              <AliasedByRow key={node.path} node={node} depth={0} />
            ))}
          </ul>
          {aliasedByTruncated && (
            <div style={styles.aliasedByTruncated}>
              Further descendants truncated at depth {ALIASED_BY_DEPTH_CAP}.
            </div>
          )}
        </>
      )}

      <div style={styles.sectionHeader}>Per-theme values</div>
      <table style={styles.themeTable}>
        <tbody>
          {Object.entries(themesResolved).map(([themeName, tokens]) => {
            const t = tokens[path] as DetailToken | undefined;
            const themeValue = t ? formatValue(t.$value) : '—';
            return (
              <tr key={themeName} style={styles.themeRow}>
                <td style={{ ...styles.themeCell, width: '30%' }}>{themeName}</td>
                <td style={styles.themeCell}>
                  {isColor && t && (
                    <span
                      style={{
                        ...styles.swatch,
                        background: cssVar,
                      }}
                      data-theme={themeName}
                      aria-hidden
                    />
                  )}
                  {themeValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={styles.sectionHeader}>Usage</div>
      <code style={styles.snippet}>{`color: ${cssVar};`}</code>
    </div>
  );
}

const PANGRAM = 'Sphinx of black quartz, judge my vow.';

function CompositePreview({
  type,
  cssVar,
}: {
  type: string | undefined;
  cssVar: string;
}): ReactElement | null {
  if (type === 'typography') {
    // cssVar for a composite looks like `var(--…-<path>)`; the emitter also
    // emits sub-vars named `--…-<path>-font-family`, `-font-size`, etc.
    // Peel the `var(--…)` wrapping to reuse the base name.
    const base = cssVar.replace(/^var\(/, '').replace(/\)$/, '');
    return (
      <div
        style={{
          ...styles.typographySample,
          fontFamily: `var(${base}-font-family)`,
          fontSize: `var(${base}-font-size)`,
          fontWeight: `var(${base}-font-weight)` as unknown as number,
          lineHeight: `var(${base}-line-height)` as unknown as number,
          letterSpacing: `var(${base}-letter-spacing)`,
        }}
      >
        {PANGRAM}
      </div>
    );
  }
  if (type === 'shadow') {
    return <div style={{ ...styles.shadowSample, boxShadow: cssVar }} aria-hidden />;
  }
  if (type === 'border') {
    return <div style={{ ...styles.borderSample, border: cssVar }} aria-hidden />;
  }
  if (type === 'transition') {
    return <TransitionSample transition={cssVar} />;
  }
  if (type === 'dimension') {
    return (
      <div style={styles.dimensionTrack}>
        <div style={{ ...styles.dimensionBar, width: cssVar }} aria-hidden />
      </div>
    );
  }
  if (type === 'duration') {
    // Synthesize a transition with a neutral easing so the duration is
    // perceptible on its own.
    return <TransitionSample transition={`left ${cssVar} ease`} />;
  }
  if (type === 'fontFamily') {
    return <div style={{ ...styles.fontFamilySample, fontFamily: cssVar }}>{PANGRAM}</div>;
  }
  if (type === 'fontWeight') {
    return (
      <div
        style={{
          ...styles.fontWeightSample,
          fontWeight: cssVar as unknown as number,
        }}
      >
        Aa
      </div>
    );
  }
  if (type === 'cubicBezier') {
    // Synthesize a transition at a fixed duration so the easing curve is
    // perceptible on its own.
    return <TransitionSample transition={`left 800ms ${cssVar}`} />;
  }
  return null;
}

function TransitionSample({ transition }: { transition: string }): ReactElement {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    if (reduced) return;
    // Loop between 0 and 1 at a fixed cadence a bit slower than the token's
    // own duration so the easing curve is perceptible.
    const id = requestAnimationFrame(() => setPhase(1));
    const loop = window.setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, 1200);
    return () => {
      cancelAnimationFrame(id);
      window.clearInterval(loop);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div style={styles.reducedMotion}>
        Animation suppressed by `prefers-reduced-motion: reduce`.
      </div>
    );
  }

  return (
    <div style={styles.motionTrack}>
      <div
        style={{
          ...styles.motionBall,
          left: phase === 1 ? 'calc(100% - 28px)' : '4px',
          transition,
        }}
        aria-hidden
      />
    </div>
  );
}

function buildAliasedByTree(rootPath: string, resolved: Record<string, unknown>): AliasedByNode[] {
  const root = resolved[rootPath] as DetailToken | undefined;
  const direct = root?.aliasedBy;
  if (!direct || direct.length === 0) return [];

  const visited = new Set<string>([rootPath]);
  return sortPaths(direct).map((p) => walk(p, resolved, visited, 1));
}

function walk(
  path: string,
  resolved: Record<string, unknown>,
  visited: Set<string>,
  depth: number,
): AliasedByNode {
  if (visited.has(path)) return { path, children: [] };
  visited.add(path);
  const token = resolved[path] as DetailToken | undefined;
  const parents = token?.aliasedBy;
  if (!parents || parents.length === 0) return { path, children: [] };
  if (depth >= ALIASED_BY_DEPTH_CAP) {
    return { path, children: [], truncated: true };
  }
  const children = sortPaths(parents).map((p) => walk(p, resolved, visited, depth + 1));
  return { path, children };
}

const GROUP_RANK: Record<string, number> = { ref: 0, sys: 1, cmp: 2 };

function sortPaths(paths: readonly string[]): string[] {
  return paths.toSorted((a, b) => {
    const ra = GROUP_RANK[a.split('.')[0] ?? ''] ?? 3;
    const rb = GROUP_RANK[b.split('.')[0] ?? ''] ?? 3;
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
