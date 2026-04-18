import type { ReactElement } from 'react';
import { formatValue } from '#/internal/use-project.ts';
import { AliasChain } from '#/token-detail/AliasChain.tsx';
import { AliasedBy } from '#/token-detail/AliasedBy.tsx';
import { AxisVariance } from '#/token-detail/AxisVariance.tsx';
import { CompositeBreakdown } from '#/token-detail/CompositeBreakdown.tsx';
import { CompositePreview } from '#/token-detail/CompositePreview.tsx';
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
  const { token, cssVar, activeTheme } = useTokenDetailData(path);

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
      <TokenHeader path={path} {...(heading !== undefined && { heading })} />

      <div style={styles.sectionHeader}>Resolved value · {activeTheme}</div>
      <CompositePreview path={path} />
      <CompositeBreakdown path={path} />
      <div style={styles.chain}>
        {isColor && <span style={{ ...styles.swatch, background: cssVar }} aria-hidden />}
        <span>{value}</span>
      </div>

      <AliasChain path={path} />
      <AliasedBy path={path} />
      <AxisVariance path={path} />
      <TokenUsageSnippet path={path} />
    </div>
  );
}
