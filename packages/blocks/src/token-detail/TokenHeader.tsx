import type { ReactElement } from 'react';
import { styles } from '#/token-detail/styles.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenHeaderProps {
  /** Full dot-path of the token. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

export function TokenHeader({ path, heading }: TokenHeaderProps): ReactElement {
  const { token, cssVar, activeTheme } = useTokenDetailData(path);

  if (!token) {
    return (
      <div style={styles.missing}>
        Token <code>{path}</code> not found in theme <strong>{activeTheme}</strong>.
      </div>
    );
  }

  return (
    <>
      <h3 style={styles.heading}>{heading ?? path}</h3>
      <div style={styles.subline}>
        {token.$type && <span style={styles.typePill}>{token.$type}</span>}
        <span>{cssVar}</span>
      </div>
      {token.$description && <p style={styles.description}>{token.$description}</p>}
    </>
  );
}
