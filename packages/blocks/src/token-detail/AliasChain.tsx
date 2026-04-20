import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface AliasChainProps {
  /** Full dot-path of the token. */
  path: string;
}

export function AliasChain({ path }: AliasChainProps): ReactElement | null {
  const { token } = useTokenDetailData(path);

  const chain = useMemo<string[]>(() => {
    if (!token) return [];
    if (Array.isArray(token.aliasChain) && token.aliasChain.length > 0) {
      return [path, ...token.aliasChain];
    }
    if (typeof token.aliasOf === 'string') return [path, token.aliasOf];
    return [path];
  }, [token, path]);

  if (chain.length <= 1) return null;

  return (
    <>
      <div className="sb-token-detail__section-header">Alias chain</div>
      <div className="sb-token-detail__chain">
        {chain.map((step, i) => (
          <span key={step} className="sb-token-detail__chain">
            <span className="sb-token-detail__chain-node">{step}</span>
            {i < chain.length - 1 && <span className="sb-token-detail__arrow">→</span>}
          </span>
        ))}
      </div>
    </>
  );
}
