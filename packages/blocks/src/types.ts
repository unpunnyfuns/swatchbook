/**
 * Shared data shapes for the swatchbook token snapshot. Canonical
 * declarations live in `#/contexts.ts` next to the React contexts that
 * carry them; this file re-exposes them under friendlier, consumer-facing
 * names.
 */
export {
  type ProjectSnapshot,
  type VirtualAxisShape as VirtualAxis,
  type VirtualDiagnosticShape as VirtualDiagnostic,
  type VirtualPresetShape as VirtualPreset,
  type VirtualTokenShape as VirtualToken,
} from '#/contexts.ts';
