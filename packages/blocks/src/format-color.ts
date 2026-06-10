/**
 * Color display formatting for blocks. The rendering kernel and the format
 * list live in core ([[@unpunnyfuns/swatchbook-core/format-color]],
 * [[@unpunnyfuns/swatchbook-core/color-formats]]) so the MCP server and the
 * addon toolbar share one implementation; blocks re-exports the display
 * surface it has always offered.
 */
export { COLOR_FORMATS, type ColorFormat } from '@unpunnyfuns/swatchbook-core/color-formats';
export {
  formatColor,
  type FormatColorResult,
  type NormalizedColor,
} from '@unpunnyfuns/swatchbook-core/format-color';
