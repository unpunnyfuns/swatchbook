import type { ReactElement } from 'react';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenUsageSnippetProps {
  /** Full dot-path of the token. */
  path: string;
}

/**
 * DTCG `$type`s with a single canonical CSS property. Types whose value is
 * applied across many properties (`dimension`, `number`, `strokeStyle`,
 * `typography`) are intentionally absent — they fall back to a commented hint.
 */
const CSS_PROPERTY_BY_TYPE: Record<string, string> = {
  color: 'color',
  shadow: 'box-shadow',
  border: 'border',
  fontFamily: 'font-family',
  fontWeight: 'font-weight',
  duration: 'transition-duration',
  cubicBezier: 'transition-timing-function',
  gradient: 'background',
  transition: 'transition',
};

function usageSnippet(cssVar: string, type: string | undefined): string {
  const property = type ? CSS_PROPERTY_BY_TYPE[type] : undefined;
  if (property) return `${property}: ${cssVar};`;
  if (type) return `/* ${type} */ ${cssVar};`;
  return `${cssVar};`;
}

export function TokenUsageSnippet({ path }: TokenUsageSnippetProps): ReactElement | null {
  const { token, cssVar } = useTokenDetailData(path);
  if (!token) return null;
  const snippet = usageSnippet(cssVar, token.$type);
  return (
    <>
      <div className="sb-token-detail__section-header">Usage</div>
      <div className="sb-token-detail__snippet-row">
        <code className="sb-token-detail__snippet">{snippet}</code>
        <CopyButton value={snippet} label={`Copy usage snippet ${snippet}`} />
      </div>
    </>
  );
}
