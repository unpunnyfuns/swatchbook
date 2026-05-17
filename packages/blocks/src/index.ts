import '#/internal/styles.css';

export {
  COLOR_FORMATS,
  type ColorFormat,
  type FormatColorResult,
  formatColor,
  type NormalizedColor,
} from '#/format-color.ts';
export { BorderPreview, type BorderPreviewProps } from '#/BorderPreview.tsx';
export { BorderSample, type BorderSampleProps } from '#/border-preview/BorderSample.tsx';
export { ColorPalette, type ColorPaletteProps } from '#/ColorPalette.tsx';
export { ColorTable, type ColorTableProps } from '#/ColorTable.tsx';
export { Diagnostics, type DiagnosticsProps } from '#/Diagnostics.tsx';
export { DimensionScale, type DimensionKind, type DimensionScaleProps } from '#/DimensionScale.tsx';
export { DimensionBar, type DimensionBarProps } from '#/dimension-scale/DimensionBar.tsx';
export { FontFamilySample, type FontFamilySampleProps } from '#/FontFamilySample.tsx';
export { FontWeightScale, type FontWeightScaleProps } from '#/FontWeightScale.tsx';
export { GradientPalette, type GradientPaletteProps } from '#/GradientPalette.tsx';
export { MotionPreview, type MotionPreviewProps, type MotionSpeed } from '#/MotionPreview.tsx';
export { OpacityScale, type OpacityScaleProps } from '#/OpacityScale.tsx';
export {
  AxesContext,
  ColorFormatContext,
  SwatchbookContext,
  PermutationContext,
  useActiveAxes,
  useActivePermutation,
  useColorFormat,
  useOptionalSwatchbookData,
  type VirtualAxisShape,
  type VirtualDiagnosticShape,
  type VirtualPresetShape,
  type VirtualTokenListingShape,
  type VirtualTokenShape,
} from '#/contexts.ts';
export {
  SwatchbookProvider,
  type SwatchbookProviderProps,
  useSwatchbookData,
} from '#/provider.tsx';
export type {
  ProjectSnapshot,
  VirtualAxis,
  VirtualDiagnostic,
  VirtualPreset,
  VirtualToken,
} from '#/types.ts';
export { MotionSample, type MotionSampleProps } from '#/motion-preview/MotionSample.tsx';
export { ShadowPreview, type ShadowPreviewProps } from '#/ShadowPreview.tsx';
export { ShadowSample, type ShadowSampleProps } from '#/shadow-preview/ShadowSample.tsx';
export { StrokeStyleSample, type StrokeStyleSampleProps } from '#/StrokeStyleSample.tsx';
export { TokenDetail, type TokenDetailProps } from '#/TokenDetail.tsx';
export { AliasChain, type AliasChainProps } from '#/token-detail/AliasChain.tsx';
export { AliasedBy, type AliasedByProps } from '#/token-detail/AliasedBy.tsx';
export { AxisVariance, type AxisVarianceProps } from '#/token-detail/AxisVariance.tsx';
export {
  CompositeBreakdown,
  type CompositeBreakdownProps,
} from '#/token-detail/CompositeBreakdown.tsx';
export { CompositePreview, type CompositePreviewProps } from '#/token-detail/CompositePreview.tsx';
export { ConsumerOutput, type ConsumerOutputProps } from '#/token-detail/ConsumerOutput.tsx';
export { TokenHeader, type TokenHeaderProps } from '#/token-detail/TokenHeader.tsx';
export {
  TokenUsageSnippet,
  type TokenUsageSnippetProps,
} from '#/token-detail/TokenUsageSnippet.tsx';
export { TokenNavigator, type TokenNavigatorProps } from '#/TokenNavigator.tsx';
export { TokenTable, type TokenTableProps } from '#/TokenTable.tsx';
export { TypographyScale, type TypographyScaleProps } from '#/TypographyScale.tsx';
