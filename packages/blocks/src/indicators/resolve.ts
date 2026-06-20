/** The individually-toggleable indicators in the row strip. `alias` covers the whole alias unit (forward chain + reverse count). */
export type IndicatorName =
  | 'alias'
  | 'variance'
  | 'gamut'
  | 'deprecation'
  | 'description'
  | 'composes';

/**
 * Consumer-facing indicator config for the strip-hosting blocks:
 * - `true` — every indicator on (including the opt-in `description`)
 * - `false` — every indicator off
 * - object — per-key override layered over the defaults
 * - omitted — the defaults
 */
export type IndicatorsProp = boolean | Partial<Record<IndicatorName, boolean>>;

/** Established-on set; `description` and `composes` are opt-in. */
const DEFAULT_INDICATORS: Record<IndicatorName, boolean> = {
  alias: true,
  variance: true,
  gamut: true,
  deprecation: true,
  description: false,
  composes: false,
};

/** Normalize an `IndicatorsProp` into a full enabled-map by layering over the defaults. */
export function resolveIndicators(prop?: IndicatorsProp): Record<IndicatorName, boolean> {
  if (prop === undefined) return { ...DEFAULT_INDICATORS };
  if (prop === true) {
    return {
      alias: true,
      variance: true,
      gamut: true,
      deprecation: true,
      description: true,
      composes: true,
    };
  }
  if (prop === false) {
    return {
      alias: false,
      variance: false,
      gamut: false,
      deprecation: false,
      description: false,
      composes: false,
    };
  }
  return { ...DEFAULT_INDICATORS, ...prop };
}
