/**
 * Structural types the switcher consumes. Mirror the shapes produced by
 * `@unpunnyfuns/swatchbook-core` and by the addon's preview INIT payload —
 * re-declared here so the switcher stays framework-agnostic and doesn't pull
 * core / addon as runtime deps.
 */

export interface SwitcherAxis {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source?: 'resolver' | 'layered' | 'synthetic';
}

export interface SwitcherPreset {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}
