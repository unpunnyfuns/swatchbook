import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { styles } from '#/token-detail/styles.ts';
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
      <div style={styles.sectionHeader}>Alias chain</div>
      <div style={styles.chain}>
        {chain.map((step, i) => (
          <span key={step} style={styles.chain}>
            <span style={styles.chainNode}>{step}</span>
            {i < chain.length - 1 && <span style={styles.arrow}>→</span>}
          </span>
        ))}
      </div>
    </>
  );
}
