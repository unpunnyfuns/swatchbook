/** The individually-toggleable indicators in the row strip. `alias` covers the whole alias unit (forward chain + reverse count). */
export type IndicatorName = 'alias' | 'variance' | 'gamut' | 'deprecation' | 'description';

/**
 * Consumer-facing indicator config for the strip-hosting blocks:
 * - `true` — every indicator on (including the opt-in `description`)
 * - `false` — every indicator off
 * - object — per-key override layered over the defaults
 * - omitted — the defaults
 */
export type IndicatorsProp = boolean | Partial<Record<IndicatorName, boolean>>;

/** Established-on set; `description` is opt-in. */
const DEFAULT_INDICATORS: Record<IndicatorName, boolean> = {
  alias: true,
  variance: true,
  gamut: true,
  deprecation: true,
  description: false,
};

/**
 * Normalize an `IndicatorsProp` into a full enabled-map. Precedence
 * (lowest→highest): `DEFAULT_INDICATORS` → `baseline` (the project-wide
 * `config.indicators` default) → per-block `prop`. An explicit boolean
 * `prop` (`true`/`false`) forces every key on/off and wins over the
 * baseline; an object `prop` overlays on top of defaults+baseline; an
 * absent `prop` leaves the result at defaults overlaid with baseline.
 */
export function resolveIndicators(
  prop?: IndicatorsProp,
  baseline?: Partial<Record<IndicatorName, boolean>>,
): Record<IndicatorName, boolean> {
  if (prop === true) {
    return { alias: true, variance: true, gamut: true, deprecation: true, description: true };
  }
  if (prop === false) {
    return { alias: false, variance: false, gamut: false, deprecation: false, description: false };
  }
  return { ...DEFAULT_INDICATORS, ...baseline, ...prop };
}
