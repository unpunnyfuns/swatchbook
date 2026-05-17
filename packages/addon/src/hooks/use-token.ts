import {
  axes as virtualAxes,
  cells as virtualCells,
  cssVarPrefix as virtualCssVarPrefix,
  defaultTuple as virtualDefaultTuple,
  jointOverrides as virtualJointOverrides,
} from 'virtual:swatchbook/tokens';
import { buildResolveAt } from '@unpunnyfuns/swatchbook-core/resolve-at';
import { makeCssVar } from '@unpunnyfuns/swatchbook-core/css-var';
import type {
  Axis as CoreAxis,
  Cells as CoreCells,
  JointOverrides,
} from '@unpunnyfuns/swatchbook-core';
import { useActiveAxes, useOptionalSwatchbookData } from '@unpunnyfuns/swatchbook-blocks';

/**
 * Module-scope `resolveAt` for the no-provider fallback path. Built
 * once from the stable virtual-module exports — mirrors what the
 * preview decorator does for its `previewResolveAt` but lives in this
 * file so the hook can be called outside the addon's preview wrapper
 * (autodocs / MDX renders).
 */
const fallbackResolveAt = buildResolveAt(
  virtualAxes as readonly CoreAxis[],
  virtualCells as CoreCells,
  virtualJointOverrides as JointOverrides,
  virtualDefaultTuple,
);

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
 * switch via the addon's `SwatchbookContext`. Returns `{ value, cssVar,
 * type, description }`.
 *
 * Typed paths appear automatically once `.swatchbook/tokens.d.ts` is
 * generated (happens on first storybook start/build). Until then
 * `TokenPath` is `string`.
 *
 * Safe to call in autodocs / MDX renders — uses plain React context, not
 * Storybook's preview-only hooks. Reads from the addon-provided
 * `SwatchbookContext` when present (preferred — uses the lifted
 * `resolveAt` accessor and the live active tuple); falls back to the
 * virtual module's eager `permutationsResolved` lookup keyed by the
 * default permutation name when no provider is mounted.
 */
export function useToken(path: TokenPath): TokenInfo {
  const snapshot = useOptionalSwatchbookData();
  const contextAxes = useActiveAxes();
  const hasContextAxes = Object.keys(contextAxes).length > 0;

  const prefix = snapshot?.cssVarPrefix ?? virtualCssVarPrefix;
  const resolver = snapshot?.resolveAt ?? fallbackResolveAt;
  const tuple = hasContextAxes
    ? (contextAxes as Record<string, string>)
    : (snapshot?.defaultTuple ?? virtualDefaultTuple);
  const token = resolver(tuple)[path] as
    | { $value?: unknown; $type?: string; $description?: string }
    | undefined;

  const info: TokenInfo = {
    value: token?.$value,
    cssVar: makeCssVar(path, prefix),
  };
  if (token?.$type) info.type = token.$type;
  if (token?.$description) info.description = token.$description;
  return info;
}
