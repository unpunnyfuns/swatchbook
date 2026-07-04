import cx from 'clsx';
import type { ReactElement } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import type { ColorFormat } from '#/format-color.ts';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { blockWrapperAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { AliasChain } from '#/token-detail/AliasChain.tsx';
import { AliasedBy } from '#/token-detail/AliasedBy.tsx';
import { AxisVariance } from '#/token-detail/AxisVariance.tsx';
import { CompositeBreakdown } from '#/token-detail/CompositeBreakdown.tsx';
import { CompositePreview } from '#/token-detail/CompositePreview.tsx';
import { ConsumerOutput } from '#/token-detail/ConsumerOutput.tsx';
import { TokenHeader } from '#/token-detail/TokenHeader.tsx';
import { TokenUsageSnippet } from '#/token-detail/TokenUsageSnippet.tsx';
import { useTokenDetailData } from '#/token-detail/internal.ts';
import type { DetailToken } from '#/token-detail/internal.ts';
import '#/token-detail/styles.css';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

export interface TokenDetailDerived {
  /** Single-line display string, also what `<CopyButton>` copies. */
  value: string;
  outOfGamut: boolean;
  isColor: boolean;
  isDeprecated: boolean;
  /** `undefined` for a boolean `$deprecated: true` with no message. */
  deprecationMessage: string | undefined;
}

const EMPTY_DERIVED: TokenDetailDerived = {
  value: '',
  outOfGamut: false,
  isColor: false,
  isDeprecated: false,
  deprecationMessage: undefined,
};

/**
 * Pure derivation of the token's display value and status flags. Mirrors
 * `formatTokenValue` + `formatColor`'s gamut check, both of which need the
 * resolved token's raw `$value`/`$type` — the listing alone (no `$value`)
 * can't drive this. Extracted so it is unit-testable without React or a
 * store; the View renders purely from this shape plus the token's presence.
 */
export function deriveTokenDetail(
  path: string,
  token: DetailToken | undefined,
  listing: ProjectData['listing'],
  colorFormat: ColorFormat,
): TokenDetailDerived {
  if (!token) return EMPTY_DERIVED;

  const isColor = token.$type === 'color';
  const gamut = isColor ? formatColor(token.$value, colorFormat) : null;
  const value = formatTokenValue(token.$value, token.$type, colorFormat, listing[path]);
  const outOfGamut = gamut?.outOfGamut ?? false;
  const dep = token.$deprecated;
  const isDeprecated = dep === true || (typeof dep === 'string' && dep.length > 0);
  const deprecationMessage = typeof dep === 'string' ? dep : undefined;

  return { value, outOfGamut, isColor, isDeprecated, deprecationMessage };
}

export interface TokenDetailViewProps extends TokenDetailDerived {
  path: string;
  heading?: string | undefined;
  token: DetailToken | undefined;
  cssVar: string;
  activeTheme: string;
  activeAxes: Record<string, string>;
  cssVarPrefix: string;
}

/**
 * Pure presentation for the token detail panel. Renders from plain props;
 * composes the connected `TokenHeader` / `CompositePreview` /
 * `CompositeBreakdown` / `AliasChain` / `AliasedBy` / `TokenUsageSnippet` /
 * `ConsumerOutput` / `AxisVariance` as children (each reads the project
 * itself for `path`).
 */
export function TokenDetailView({
  path,
  heading,
  token,
  cssVar,
  activeTheme,
  activeAxes,
  cssVarPrefix,
  value,
  outOfGamut,
  isColor,
  isDeprecated,
  deprecationMessage,
}: TokenDetailViewProps): ReactElement {
  const wrapperAttrs = blockWrapperAttrs(cssVarPrefix, activeAxes);

  if (!token) {
    return (
      <div {...wrapperAttrs} className={cx(wrapperAttrs['className'], 'sb-token-detail')}>
        <div className="sb-token-detail__missing">
          Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
        </div>
      </div>
    );
  }

  return (
    <div {...wrapperAttrs} className={cx(wrapperAttrs['className'], 'sb-token-detail')}>
      <TokenHeader path={path} {...(heading !== undefined && { heading })} />
      {isDeprecated && (
        <div
          className="sb-token-detail__deprecated"
          data-testid="token-detail-deprecated"
          role="note"
        >
          <span aria-hidden>⚠ </span>
          Deprecated{deprecationMessage ? `: ${deprecationMessage}` : ''}
        </div>
      )}

      <div className="sb-token-detail__section-header">Resolved value · {activeTheme}</div>
      <CompositePreview path={path} />
      <CompositeBreakdown path={path} />
      <div className="sb-token-detail__chain">
        {isColor && (
          <span className="sb-token-detail__swatch" style={{ background: cssVar }} aria-hidden />
        )}
        <span>{value}</span>
        {outOfGamut && (
          <span
            title="Out of sRGB gamut for this format"
            aria-label="out of gamut"
            className="sb-token-detail__out-of-gamut-icon"
          >
            ⚠
          </span>
        )}
        <CopyButton value={value} label={`Copy value ${value}`} />
      </div>

      <AliasChain path={path} />
      <AliasedBy path={path} />
      <TokenUsageSnippet path={path} />
      <ConsumerOutput path={path} />
      <AxisVariance path={path} />
    </div>
  );
}

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { token, cssVar, activeTheme, activeAxes, cssVarPrefix } = useTokenDetailData(path);
  const colorFormat = useColorFormat();
  const { listing } = useProject();
  const derived = deriveTokenDetail(path, token, listing, colorFormat);

  return (
    <TokenDetailView
      path={path}
      {...(heading !== undefined && { heading })}
      token={token}
      cssVar={cssVar}
      activeTheme={activeTheme}
      activeAxes={activeAxes}
      cssVarPrefix={cssVarPrefix}
      {...derived}
    />
  );
}
