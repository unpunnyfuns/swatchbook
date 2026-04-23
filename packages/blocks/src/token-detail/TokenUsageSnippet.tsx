import type { ReactElement } from 'react';
import { CopyButton } from '#/internal/CopyButton.tsx';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenUsageSnippetProps {
  /** Full dot-path of the token. */
  path: string;
}

export function TokenUsageSnippet({ path }: TokenUsageSnippetProps): ReactElement | null {
  const { token, cssVar } = useTokenDetailData(path);
  if (!token) return null;
  const snippet = `color: ${cssVar};`;
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
