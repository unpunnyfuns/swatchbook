export type { TokenGraph, TokenGraphNode, WriteValue } from '#/token-graph/types.ts';

export {
  resolveAt,
  resolveAllAt,
  resolveAliasAt,
  resolveAliasAllAt,
  aliasChainAt,
  resolveAllWithProvenanceAt,
} from '#/token-graph/walk.ts';

export { getAffectedBy, getVariance, listPaths } from '#/token-graph/queries.ts';
