import type { ReactElement } from 'react';
import { styles } from '#/token-detail/styles.ts';
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
      <div style={styles.sectionHeader}>Usage</div>
      <code style={styles.snippet}>{`color: ${cssVar};`}</code>
    </>
  );
}
