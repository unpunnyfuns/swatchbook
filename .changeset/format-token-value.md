---
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-core': patch
---

Fix value display across every block: TokenTable, TokenDetail, TokenNavigator, AxisVariance, CompositeBreakdown, DimensionScale, StrokeStyleSample now route one-line value strings through a single `formatTokenValue` helper that honors the active color-format dropdown for color tokens and known composites (border, shadow, gradient). Typography / transition / cubicBezier / dimension / fontFamily get dedicated stringifications instead of raw JSON dumps; only truly-foreign shapes fall through to truncated JSON now.
