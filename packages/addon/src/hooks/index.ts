export {
  useToken,
  type SwatchbookTokenMap,
  type TokenInfo,
  type TokenPath,
} from '#/hooks/use-token.ts';
/**
 * `useActiveTheme` / `useActiveAxes` live canonically in
 * `@unpunnyfuns/swatchbook-blocks`. Re-exported here for back-compat with
 * consumers that imported from `@unpunnyfuns/swatchbook-addon/hooks`.
 */
export { useActiveAxes, useActiveTheme } from '@unpunnyfuns/swatchbook-blocks';
