import {
  cssVarPrefix as virtualCssVarPrefix,
  defaultTuple as virtualDefaultTuple,
  tokenGraph as virtualTokenGraph,
} from 'virtual:swatchbook/tokens';
import { resolveAllWithProvenanceAt } from '@unpunnyfuns/swatchbook-core/graph';
import { cssVarRef } from '@unpunnyfuns/swatchbook-core/css-var';
import {
  useActiveAxes,
  useChannelGlobals,
  useOptionalSwatchbookData,
} from '@unpunnyfuns/swatchbook-blocks';

// Module-scope `resolveAt` for the no-provider fallback path. Built
// once from the stable virtual-module exports — mirrors what the
// preview decorator does for its `previewResolveAt` but lives in this
// file so the hook can be called outside the addon's preview wrapper
// (autodocs / MDX renders).
const fallbackResolveAt = (tuple: Record<string, string>) =>
  resolveAllWithProvenanceAt(virtualTokenGraph, tuple);

/**
 * Consumers augment this interface (via the addon's generated
 * `.swatchbook/tokens.d.ts`) to narrow {@link useToken}'s first parameter
 * to their project's actual token paths. Without augmentation it's empty
 * and {@link TokenPath} falls back to `string`.
 */
export interface SwatchbookTokenMap {}

type KnownPath = keyof SwatchbookTokenMap;

/** Union of known token paths, or `string` when the addon codegen hasn't run. */
export type TokenPath = [KnownPath] extends [never] ? string : KnownPath;

export interface TokenInfo {
  /** The resolved DTCG `$value`. Shape varies by `$type`. */
  value: unknown;
  /** `var(--prefix-token-path)` reference, ready to drop into any CSS value. */
  cssVar: string;
  /** DTCG `$type` of the token, if known. */
  type?: string;
  /** Optional DTCG `$description`. */
  description?: string;
}

/**
 * Read a DTCG token for the currently active theme. Re-reads on theme
 * switch via the addon's `SwatchbookProvider`. Returns `{ value, cssVar,
 * type, description }`.
 *
 * Typed paths appear automatically once `.swatchbook/tokens.d.ts` is
 * generated (happens on first storybook start/build). Until then
 * `TokenPath` is `string`.
 *
 * Safe to call in autodocs / MDX renders — uses plain React context, not
 * Storybook's preview-only hooks. Reads from the addon-mounted
 * `SwatchbookProvider` when present (preferred — uses the lifted
 * `resolveAt` accessor and the live active tuple); falls back to the
 * module-scope `fallbackResolveAt` (`resolveAllWithProvenanceAt(virtualTokenGraph,
 * tuple)`) over the virtual module's default tuple when no provider is
 * mounted.
 */
export function useToken(path: TokenPath): TokenInfo {
  const snapshot = useOptionalSwatchbookData();
  const contextAxes = useActiveAxes();
  const channelGlobals = useChannelGlobals();
  const hasContextAxes = Object.keys(contextAxes).length > 0;

  const prefix = snapshot?.cssVarPrefix ?? virtualCssVarPrefix;
  const resolver = snapshot?.resolveAt ?? fallbackResolveAt;
  // Match the active-tuple resolution blocks use (see use-project's
  // virtual-module fallback): decorator context first, then the live
  // toolbar globals over the channel (the only signal in MDX / autodocs
  // where no decorator runs), then the static default tuple. Without the
  // channel-globals step, useToken stayed pinned to the default in MDX and
  // disagreed with the rendered CSS after a toolbar axis flip.
  const tuple = hasContextAxes
    ? (contextAxes as Record<string, string>)
    : (channelGlobals.axes ?? snapshot?.defaultTuple ?? virtualDefaultTuple);
  const token = resolver(tuple)[path] as
    | { $value?: unknown; $type?: string; $description?: string }
    | undefined;

  const info: TokenInfo = {
    value: token?.$value,
    cssVar: cssVarRef(path, prefix),
  };
  if (token?.$type) info.type = token.$type;
  if (token?.$description) info.description = token.$description;
  return info;
}
