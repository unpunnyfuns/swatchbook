import type { ReactElement } from 'react';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface TokenHeaderProps {
  /** Full dot-path of the token. */
  path: string;
  /** Override the heading. Defaults to the path. */
  heading?: string;
}

export function TokenHeader({ path, heading }: TokenHeaderProps): ReactElement {
  const { token, cssVar, activePermutation } = useTokenDetailData(path);

  if (!token) {
    return (
      <div className="sb-token-detail__missing">
        Token <code>{path}</code> not found in theme <strong>{activePermutation}</strong>.
      </div>
    );
  }

  return (
    <>
      <h3 className="sb-token-detail__heading">{heading ?? path}</h3>
      <div className="sb-token-detail__subline">
        {token.$type && <span className="sb-token-detail__type-pill">{token.$type}</span>}
        <span>{cssVar}</span>
      </div>
      {token.$description && <p className="sb-token-detail__description">{token.$description}</p>}
    </>
  );
}
