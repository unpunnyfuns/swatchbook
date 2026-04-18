/**
 * Shared data shapes re-exported from `@unpunnyfuns/swatchbook-addon`.
 * The addon owns the canonical declarations (adjacent to the Vite plugin
 * that emits the matching runtime payload); blocks re-exposes them under
 * friendlier names so consumers importing from
 * `@unpunnyfuns/swatchbook-blocks` don't also have to pull from addon.
 */
export {
  type ProjectSnapshot,
  type VirtualAxisShape as VirtualAxis,
  type VirtualDiagnosticShape as VirtualDiagnostic,
  type VirtualPresetShape as VirtualPreset,
  type VirtualThemeShape as VirtualTheme,
  type VirtualTokenShape as VirtualToken,
} from '@unpunnyfuns/swatchbook-addon';
