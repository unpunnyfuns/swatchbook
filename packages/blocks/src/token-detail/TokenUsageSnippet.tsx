import type { ReactElement } from 'react';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenUsageSnippetProps {
  /** Full dot-path of the token. */
  path: string;
}

export function TokenUsageSnippet({ path }: TokenUsageSnippetProps): ReactElement | null {
  const { token, cssVar } = useTokenDetailData(path);
  if (!token) return null;
  return (
    <>
      <div className="sb-token-detail__section-header">Usage</div>
      <code className="sb-token-detail__snippet">{`color: ${cssVar};`}</code>
    </>
  );
}
