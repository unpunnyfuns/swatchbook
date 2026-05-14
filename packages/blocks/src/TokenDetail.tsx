import cx from 'clsx';
import type { ReactElement } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { useProject } from '#/internal/use-project.ts';
import { AliasChain } from '#/token-detail/AliasChain.tsx';
import { AliasedBy } from '#/token-detail/AliasedBy.tsx';
import { AxisVariance } from '#/token-detail/AxisVariance.tsx';
import { CompositeBreakdown } from '#/token-detail/CompositeBreakdown.tsx';
import { CompositePreview } from '#/token-detail/CompositePreview.tsx';
import { ConsumerOutput } from '#/token-detail/ConsumerOutput.tsx';
import { TokenHeader } from '#/token-detail/TokenHeader.tsx';
import { TokenUsageSnippet } from '#/token-detail/TokenUsageSnippet.tsx';
import { useTokenDetailData } from '#/token-detail/internal.ts';
import '#/token-detail/styles.css';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { token, cssVar, activePermutation, cssVarPrefix } = useTokenDetailData(path);
  const colorFormat = useColorFormat();
  const theme = themeAttrs(cssVarPrefix, activePermutation);

  if (!token) {
    return (
      <div {...theme} className={cx(theme['className'], 'sb-token-detail')}>
        <div className="sb-token-detail__missing">
          Token <code>{path}</code> not found in theme <strong>{activePermutation}</strong>.
        </div>
      </div>
    );
  }

  const { listing } = useProject();
  const isColor = token.$type === 'color';
  const gamut = isColor ? formatColor(token.$value, colorFormat) : null;
  const value = formatTokenValue(token.$value, token.$type, colorFormat, listing[path]);
  const outOfGamut = gamut?.outOfGamut ?? false;

  return (
    <div {...theme} className={cx(theme['className'], 'sb-token-detail')}>
      <TokenHeader path={path} {...(heading !== undefined && { heading })} />

      <div className="sb-token-detail__section-header">Resolved value · {activePermutation}</div>
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
            style={{ marginLeft: 6 }}
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
