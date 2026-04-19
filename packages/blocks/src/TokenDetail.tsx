import type { ReactElement } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import { chromeAliases, themeAttrs } from '#/internal/data-attr.ts';
import { formatTokenValue } from '#/internal/format-token-value.ts';
import { AliasChain } from '#/token-detail/AliasChain.tsx';
import { AliasedBy } from '#/token-detail/AliasedBy.tsx';
import { AxisVariance } from '#/token-detail/AxisVariance.tsx';
import { CompositeBreakdown } from '#/token-detail/CompositeBreakdown.tsx';
import { CompositePreview } from '#/token-detail/CompositePreview.tsx';
import { ConsumerOutput } from '#/token-detail/ConsumerOutput.tsx';
import { styles } from '#/token-detail/styles.ts';
import { TokenHeader } from '#/token-detail/TokenHeader.tsx';
import { TokenUsageSnippet } from '#/token-detail/TokenUsageSnippet.tsx';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenDetailProps {
  /** Full dot-path of the token to inspect. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

export function TokenDetail({ path, heading }: TokenDetailProps): ReactElement {
  const { token, cssVar, activeTheme, cssVarPrefix } = useTokenDetailData(path);
  const colorFormat = useColorFormat();

  if (!token) {
    return (
      <div
        {...themeAttrs(cssVarPrefix, activeTheme)}
        style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
      >
        <div style={styles.missing}>
          Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
        </div>
      </div>
    );
  }

  const isColor = token.$type === 'color';
  const gamut = isColor ? formatColor(token.$value, colorFormat) : null;
  const value = formatTokenValue(token.$value, token.$type, colorFormat);
  const outOfGamut = gamut?.outOfGamut ?? false;

  return (
    <div
      {...themeAttrs(cssVarPrefix, activeTheme)}
      style={{ ...chromeAliases(cssVarPrefix), ...styles.wrapper }}
    >
      <TokenHeader path={path} {...(heading !== undefined && { heading })} />

      <div style={styles.sectionHeader}>Resolved value · {activeTheme}</div>
      <CompositePreview path={path} />
      <CompositeBreakdown path={path} />
      <div style={styles.chain}>
        {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
        <span>{value}</span>
        {outOfGamut && (
          <span
            title='Out of sRGB gamut for this format'
            aria-label='out of gamut'
            style={{ marginLeft: 6 }}
          >
            ⚠
          </span>
        )}
      </div>

      <AliasChain path={path} />
      <AliasedBy path={path} />
      <TokenUsageSnippet path={path} />
      <ConsumerOutput path={path} />
      <AxisVariance path={path} />
    </div>
  );
}
