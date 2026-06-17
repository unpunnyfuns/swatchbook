import type { AxisVarianceResult } from '@unpunnyfuns/swatchbook-core';
import type { ReactElement } from 'react';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import type { VirtualTokenShape } from '#/contexts.ts';

export interface RowIndicatorsProps {
  path: string;
  token: VirtualTokenShape;
  /** Active navigator root prefix, for relative chain-node labels. */
  root: string | undefined;
  /** Per-path variance result for the variance badge. */
  variance: AxisVarianceResult | undefined;
  /** Active color format, for the gamut check (color rows only). */
  colorFormat: ColorFormat;
  /** True when a path can be selected in the current tree (structural filters). */
  resolveInView: (path: string) => boolean;
  /** Navigate the tree to a path (expand ancestors, select, scroll). */
  onNavigate: (path: string) => void;
}

// Strip the navigator's `root` prefix from a path for a compact chain label.
function relativeLabel(path: string, root: string | undefined): string {
  if (root && path.startsWith(`${root}.`)) return path.slice(root.length + 1);
  return path;
}

interface ForwardChainProps {
  chain: readonly string[];
  root: string | undefined;
  resolveInView: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

/**
 * The forward alias chain for one row. Full chain in `aria-label`; visually
 * capped to first … last beyond two hops (no width measurement). Each shown
 * node navigates when in view, else renders as plain text.
 */
function ForwardChain({ chain, root, resolveInView, onNavigate }: ForwardChainProps): ReactElement {
  const full = chain.map((p) => relativeLabel(p, root)).join(' → ');
  const capped = chain.length > 2;
  const shown = capped ? [chain[0] as string, chain[chain.length - 1] as string] : [...chain];

  return (
    <span
      className="sb-token-navigator__alias-forward"
      data-testid="row-indicator-alias-forward"
      aria-label={`aliases ${full}`}
    >
      <span className="sb-token-navigator__alias-arrow" aria-hidden>
        →
      </span>
      {shown.map((target, i) => {
        const label = relativeLabel(target, root);
        const node = resolveInView(target) ? (
          <button
            type="button"
            className="sb-token-navigator__alias-node"
            data-testid="alias-node"
            aria-label={target}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(target);
            }}
          >
            {label}
          </button>
        ) : (
          <span
            className="sb-token-navigator__alias-node sb-token-navigator__alias-node--offview"
            data-testid="alias-node"
            title="outside current view"
          >
            {label}
          </span>
        );
        const sep =
          capped && i === 0 ? (
            <span className="sb-token-navigator__alias-arrow" aria-hidden>
              {' '}
              → … →{' '}
            </span>
          ) : i < shown.length - 1 ? (
            <span className="sb-token-navigator__alias-arrow" aria-hidden>
              {' '}
              →{' '}
            </span>
          ) : null;
        return (
          <span key={target}>
            {node}
            {sep}
          </span>
        );
      })}
    </span>
  );
}

interface DeprecatedBadgeProps {
  deprecated: string | boolean;
}

function DeprecatedBadge({ deprecated }: DeprecatedBadgeProps): ReactElement {
  const label = typeof deprecated === 'string' ? `deprecated: ${deprecated}` : 'deprecated';
  return (
    <span
      className="sb-token-navigator__deprecated"
      data-testid="row-indicator-deprecated"
      title={label}
      aria-label={label}
    >
      deprecated
    </span>
  );
}

interface VarianceBadgeProps {
  variance: AxisVarianceResult;
}

function VarianceBadge({ variance }: VarianceBadgeProps): ReactElement | null {
  if (variance.kind === 'constant') return null;
  const axes = variance.varyingAxes;
  const label = variance.kind === 'single' ? variance.axis : `${axes.length} axes`;
  return (
    <span
      className="sb-token-navigator__variance"
      data-testid="row-indicator-variance"
      aria-label={`varies by ${axes.join(', ')}`}
    >
      <span className="sb-token-navigator__variance-glyph" aria-hidden>
        ⊹
      </span>
      {label}
    </span>
  );
}

interface ReverseCountProps {
  count: number;
}

function ReverseCount({ count }: ReverseCountProps): ReactElement {
  return (
    <span
      className="sb-token-navigator__alias-reverse"
      data-testid="row-indicator-alias-reverse"
      aria-label={`referenced by ${count} ${count === 1 ? 'token' : 'tokens'}`}
    >
      <span className="sb-token-navigator__alias-arrow" aria-hidden>
        ←
      </span>
      {count}
    </span>
  );
}

/** Per-row indicator strip: alias references, variance, gamut, deprecation. */
export function RowIndicators(props: RowIndicatorsProps): ReactElement | null {
  const { token, root, variance, colorFormat, resolveInView, onNavigate } = props;
  const aliasChain =
    Array.isArray(token.aliasChain) && token.aliasChain.length > 0 ? token.aliasChain : undefined;
  const reverseCount =
    Array.isArray(token.aliasedBy) && token.aliasedBy.length > 0 ? token.aliasedBy.length : 0;
  const isVarying = variance !== undefined && variance.kind !== 'constant';
  const outOfGamut =
    token.$type === 'color' && (formatColor(token.$value, colorFormat)?.outOfGamut ?? false);
  const deprecated = token.$deprecated;
  const isDeprecated =
    deprecated === true || (typeof deprecated === 'string' && deprecated.length > 0);

  if (!aliasChain && reverseCount === 0 && !isVarying && !outOfGamut && !isDeprecated) return null;

  return (
    <span className="sb-token-navigator__indicators">
      {isDeprecated && deprecated !== undefined && <DeprecatedBadge deprecated={deprecated} />}
      {aliasChain && (
        <ForwardChain
          chain={aliasChain}
          root={root}
          resolveInView={resolveInView}
          onNavigate={onNavigate}
        />
      )}
      {reverseCount > 0 && <ReverseCount count={reverseCount} />}
      {variance && <VarianceBadge variance={variance} />}
      {outOfGamut && (
        <span
          className="sb-token-navigator__gamut"
          title="Out of sRGB gamut for this format"
          aria-label="out of gamut"
        >
          ⚠
        </span>
      )}
    </span>
  );
}
