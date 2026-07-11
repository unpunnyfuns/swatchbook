/**
 * Browser-safe wire-format helper. Exported through the
 * `@unpunnyfuns/swatchbook-core/snapshot-for-wire` subpath so the
 * addon's virtual-module emitter and HMR re-broadcast share one
 * implementation — the field list and the Map-to-Object conversions
 * live in one place rather than three.
 *
 * Builds a JSON-friendly subset of `Project` plus the emitter's CSS
 * string. Drops fields that don't survive `JSON.stringify` (the
 * resolver function on `parserInput`, the `resolveAt` closure). Slims
 * `listing` entries down to the three fields blocks actually read
 * (`names`, `previewValue`, `source`).
 *
 * Consumers:
 * - addon's Vite plugin emits the virtual ESM module body from this
 * - addon's Vite plugin sends it as the HMR custom event payload
 * - blocks' channel-tokens listener reads the same shape from
 *   `TOKENS_UPDATED_EVENT`
 *
 * The `InitPayload` shape in `packages/addon/src/channel-types.ts` is
 * a subset of this (manager-side doesn't need CSS or listing); kept
 * separately for now because the manager bundle has its own
 * import-resolution constraints.
 */
import type { ListedToken } from '@terrazzo/plugin-token-listing';
import type { TokenGraph } from '#/token-graph/types.ts';
import type { Project } from '#/types.ts';

/**
 * Slimmed `ListedToken` — the three fields blocks actually consume.
 * Drops `originalValue` (large; not needed for display), the wrapping
 * `$extensions` envelope, and per-platform listings the blocks don't
 * render yet.
 */
export interface SlimListedToken {
  names: Record<string, string>;
  previewValue?: ListedToken['$extensions']['app.terrazzo.listing']['previewValue'];
  source?: ListedToken['$extensions']['app.terrazzo.listing']['source'];
}

/**
 * JSON-friendly snapshot of `Project` for wire transport (virtual
 * module body, HMR custom event, Storybook channel TOKENS_UPDATED_EVENT).
 * Field set is the union every blocks-side consumer reads; the
 * manager-side INIT_EVENT shape is a subset (no `css` / `listing`).
 */
export interface SnapshotForWire {
  axes: Project['axes'];
  disabledAxes: Project['disabledAxes'];
  presets: Project['presets'];
  diagnostics: Project['diagnostics'];
  cssVarPrefix: string;
  /** Project-wide baseline for the block row-indicator strip; `config.indicators` passed through verbatim. */
  indicators: Readonly<Record<string, boolean>>;
  css: string;
  listing: Readonly<Record<string, SlimListedToken>>;
  defaultTuple: Project['defaultTuple'];
  tokenGraph: TokenGraph;
}

/**
 * Build the wire snapshot from a `Project` plus the emitter's CSS
 * string. The CSS isn't on `Project` itself — it's the
 * `emitAxisProjectedCss(project)` output that the addon's plugin
 * computes alongside the project load.
 */
export function snapshotForWire(project: Project, css: string): SnapshotForWire {
  return {
    axes: project.axes,
    disabledAxes: project.disabledAxes,
    presets: project.presets,
    diagnostics: project.diagnostics,
    cssVarPrefix: project.config.cssVarPrefix ?? '',
    indicators: project.config.indicators ?? {},
    css,
    listing: slimListing(project.listing),
    defaultTuple: project.defaultTuple,
    tokenGraph: project.tokenGraph,
  };
}

function slimListing(listing: Project['listing']): Record<string, SlimListedToken> {
  const out: Record<string, SlimListedToken> = {};
  for (const [path, entry] of Object.entries(listing)) {
    const ext = entry.$extensions['app.terrazzo.listing'];
    const slim: SlimListedToken = { names: ext.names };
    if (ext.previewValue !== undefined) slim.previewValue = ext.previewValue;
    if (ext.source !== undefined) slim.source = ext.source;
    out[path] = slim;
  }
  return out;
}
