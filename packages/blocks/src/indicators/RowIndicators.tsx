import type { AxisVarianceResult } from '@unpunnyfuns/swatchbook-core';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { ColorFormat } from '#/format-color.ts';
import { formatColor } from '#/format-color.ts';
import type { VirtualToken } from '#/types.ts';
import { resolveIndicators } from '#/indicators/resolve.ts';
import type { IndicatorName } from '#/indicators/resolve.ts';
import './indicators.css';

export interface RowIndicatorsProps {
  path: string;
  token: VirtualToken;
  /** Active navigator root prefix, for relative chain-node labels. */
  root: string | undefined;
  /** Per-path variance result for the variance badge. */
  variance: AxisVarianceResult | undefined;
  /** Active color format, for the gamut check (color rows only). */
  colorFormat: ColorFormat;
  /** True when a referenced path can be acted on. */
  canReference: (path: string) => boolean;
  /** Act on a referenced path — the host decides what that means: the navigator moves the tree, the table opens detail. */
  onReferenceClick: (path: string) => void;
  /** Resolved enabled-map (from `resolveIndicators`). Defaults to the established four-on set. */
  enabled?: Record<IndicatorName, boolean>;
}

// Strip the navigator's `root` prefix from a path for a compact chain label.
function relativeLabel(path: string, root: string | undefined): string {
  if (root && path.startsWith(`${root}.`)) return path.slice(root.length + 1);
  return path;
}

// DTCG composite `$type`s — the same set core's token-graph build keys on
// (build.ts COMPOSITE_TYPES). Only these carry a meaningful sub-part count;
// other object-valued tokens (a 2025-spec color, say) must not be badged.
const COMPOSITE_TYPES = new Set(['border', 'typography', 'transition', 'gradient', 'shadow']);

// Number of constituent parts a composite token bundles: object fields for
// typography / border / transition / object-form shadow, stops/layers for an
// array-form gradient or shadow. `undefined` for non-composites and for an
// aliased composite (string `$value`), which compose nothing locally.
function compositeFieldCount(token: VirtualToken): number | undefined {
  if (!token.$type || !COMPOSITE_TYPES.has(token.$type)) return undefined;
  const v = token.$value;
  if (Array.isArray(v)) return v.length > 0 ? v.length : undefined;
  if (v !== null && typeof v === 'object') {
    const n = Object.keys(v).length;
    return n > 0 ? n : undefined;
  }
  return undefined;
}

interface ForwardChainProps {
  chain: readonly string[];
  root: string | undefined;
  canReference: (path: string) => boolean;
  onReferenceClick: (path: string) => void;
}

/**
 * The forward alias chain for one row. Full chain in `aria-label`; visually
 * capped to first … last beyond two hops (no width measurement). Each shown
 * node navigates when in view, else renders as plain text.
 */
function ForwardChain({
  chain,
  root,
  canReference,
  onReferenceClick,
}: ForwardChainProps): ReactElement {
  const full = chain.map((p) => relativeLabel(p, root)).join(' → ');
  const capped = chain.length > 2;
  const shown = capped ? [chain[0] as string, chain[chain.length - 1] as string] : [...chain];

  return (
    <span
      className="sb-indicator__alias-forward"
      data-testid="row-indicator-alias-forward"
      aria-label={`aliases ${full}`}
    >
      <span className="sb-indicator__alias-arrow" aria-hidden>
        →
      </span>
      {shown.map((target, i) => {
        const label = relativeLabel(target, root);
        const node = canReference(target) ? (
          <button
            type="button"
            className="sb-indicator__alias-node"
            data-testid="alias-node"
            aria-label={target}
            onClick={(e) => {
              e.stopPropagation();
              onReferenceClick(target);
            }}
          >
            {label}
          </button>
        ) : (
          <span
            className="sb-indicator__alias-node sb-indicator__alias-node--offview"
            data-testid="alias-node"
            title="outside current view"
          >
            {label}
          </span>
        );
        const sep =
          capped && i === 0 ? (
            <span className="sb-indicator__alias-arrow" aria-hidden>
              {' '}
              → … →{' '}
            </span>
          ) : i < shown.length - 1 ? (
            <span className="sb-indicator__alias-arrow" aria-hidden>
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
      className="sb-indicator__deprecated"
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
      className="sb-indicator__variance"
      data-testid="row-indicator-variance"
      aria-label={`varies by ${axes.join(', ')}`}
    >
      <span className="sb-indicator__variance-glyph" aria-hidden>
        ⊹
      </span>
      {label}
    </span>
  );
}

interface ReverseCountProps {
  referents: readonly string[];
  canReference: (path: string) => boolean;
  onReferenceClick: (path: string) => void;
}

function ReverseCount({
  referents,
  canReference,
  onReferenceClick,
}: ReverseCountProps): ReactElement {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const count = referents.length;
  const single = count === 1;

  // Move focus to the first enabled menu item on open; close on outside pointerdown.
  useEffect(() => {
    if (single || !open) return;
    const first = wrapRef.current?.querySelector<HTMLElement>(
      'button[role="menuitem"]:not(:disabled)',
    );
    first?.focus();

    const handlePointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, single]);

  return (
    <span
      ref={wrapRef}
      className="sb-indicator__reverse-wrap"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        className="sb-indicator__alias-reverse"
        data-testid="row-indicator-alias-reverse"
        aria-label={`referenced by ${count} ${count === 1 ? 'token' : 'tokens'}`}
        aria-haspopup={single ? undefined : 'menu'}
        aria-expanded={single ? undefined : open}
        onClick={(e) => {
          e.stopPropagation();
          if (single) onReferenceClick(referents[0] as string);
          else setOpen((v) => !v);
        }}
      >
        <span className="sb-indicator__alias-arrow" aria-hidden>
          ←
        </span>
        {count}
      </button>
      {!single && open && (
        <ul className="sb-indicator__reverse-menu" role="menu">
          {referents.map((ref) => (
            <li key={ref} role="none">
              <button
                type="button"
                role="menuitem"
                className="sb-indicator__reverse-item"
                disabled={!canReference(ref)}
                title={canReference(ref) ? undefined : 'outside current view'}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onReferenceClick(ref);
                }}
              >
                {ref}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

/** Per-row indicator strip: alias references, variance, gamut, deprecation. */
export function RowIndicators(props: RowIndicatorsProps): ReactElement | null {
  const { token, root, variance, colorFormat, canReference, onReferenceClick } = props;
  const en = props.enabled ?? resolveIndicators(undefined);

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
  const description =
    typeof token.$description === 'string' && token.$description.length > 0
      ? token.$description
      : undefined;
  const composesCount = en.composes ? compositeFieldCount(token) : undefined;

  const showDeprecated = en.deprecation && isDeprecated;
  const showForward = en.alias && aliasChain !== undefined;
  const showReverse = en.alias && reverseCount > 0;
  const showVariance = en.variance && isVarying;
  const showGamut = en.gamut && outOfGamut;
  const showDescription = en.description && description !== undefined;
  const showComposes = composesCount !== undefined;

  if (
    !showDeprecated &&
    !showForward &&
    !showReverse &&
    !showVariance &&
    !showGamut &&
    !showDescription &&
    !showComposes
  ) {
    return null;
  }

  return (
    <span className="sb-indicator__indicators">
      {showDeprecated && deprecated !== undefined && <DeprecatedBadge deprecated={deprecated} />}
      {showForward && aliasChain && (
        <ForwardChain
          chain={aliasChain}
          root={root}
          canReference={canReference}
          onReferenceClick={onReferenceClick}
        />
      )}
      {showReverse && token.aliasedBy && (
        <ReverseCount
          referents={token.aliasedBy}
          canReference={canReference}
          onReferenceClick={onReferenceClick}
        />
      )}
      {showComposes && composesCount !== undefined && (
        <span
          className="sb-indicator__composes"
          data-testid="row-indicator-composes"
          title={`composes ${composesCount} parts`}
          aria-label={`composes ${composesCount} parts`}
        >
          <span className="sb-indicator__composes-glyph" aria-hidden>
            ⊞
          </span>
          {composesCount}
        </span>
      )}
      {showVariance && variance && <VarianceBadge variance={variance} />}
      {showGamut && (
        <span
          className="sb-indicator__gamut"
          title="Out of sRGB gamut for this format"
          aria-label="out of gamut"
        >
          ⚠
        </span>
      )}
      {showDescription && description !== undefined && (
        <span
          className="sb-indicator__description"
          data-testid="row-indicator-description"
          title={description}
          aria-label={`description: ${description}`}
        >
          ⓘ
        </span>
      )}
    </span>
  );
}
