import type { CSSProperties, ReactElement } from 'react';
import { MAX_RENDER_PX, toPixels } from '#/dimension-scale/dimension-px.ts';
import { useRootFontSize } from '#/internal/use-root-font-size.ts';
import { BORDER_STRONG } from '#/internal/styles.tsx';
import { resolveCssVar, useProject } from '#/internal/use-project.ts';

export type DimensionVisual = 'length' | 'radius' | 'size';

export interface DimensionBarProps {
  /** Full dot-path of the dimension token to preview. */
  path: string;
  /**
   * Visualization kind:
   * - `'length'` (default): horizontal bar whose width equals the token's dimension.
   * - `'radius'`: 56×56 square with the token applied as `border-radius`.
   * - `'size'`: a square sized to the token's dimension.
   */
  visual?: DimensionVisual;
}

const styles = {
  cappedWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--swatchbook-space-3xs)',
    maxWidth: '100%',
    minWidth: 0,
  } satisfies CSSProperties,
  cap: {
    color: 'var(--swatchbook-text-muted)',
    fontSize: 'var(--swatchbook-type-micro)',
    lineHeight: 'var(--swatchbook-leading-none)',
    userSelect: 'none',
  } satisfies CSSProperties,
  bar: {
    height: 14,
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    borderRadius: 2,
    minWidth: 1,
    // Never exceed the host cell: the px width conveys magnitude in the wide
    // DimensionScale rows, but the bar also renders in TokenNavigator's narrow
    // preview cell, where a 480px-capped bar would otherwise overflow.
    maxWidth: '100%',
  } satisfies CSSProperties,
  radiusSample: {
    width: 56,
    height: 56,
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
  } satisfies CSSProperties,
  sizeSample: {
    background: 'var(--swatchbook-accent-bg, #3b82f6)',
    border: BORDER_STRONG,
    minWidth: 1,
    minHeight: 1,
  } satisfies CSSProperties,
};

// Wrap a clamped visual with the cap affordance so every consumer (the scale
// block and TokenNavigator) surfaces truncation identically. The visual itself
// is decorative — the token's real value is shown as adjacent text — so the
// marker is `aria-hidden` and the title carries the hint for sighted hover.
function withCap(visual: ReactElement): ReactElement {
  return (
    <span
      className="sb-dimension-bar sb-dimension-bar--capped"
      style={styles.cappedWrap}
      title={`capped at ${MAX_RENDER_PX}px`}
    >
      {visual}
      <span className="sb-dimension-bar__cap" aria-hidden>
        …
      </span>
    </span>
  );
}

export function DimensionBar({ path, visual = 'length' }: DimensionBarProps): ReactElement {
  const project = useProject();
  const { resolved } = project;
  const rootFontSize = useRootFontSize();
  const cssVar = resolveCssVar(path, project);
  const token = resolved[path];
  const pxValue = toPixels(token?.$value, rootFontSize);
  const capped = Number.isFinite(pxValue) && pxValue > MAX_RENDER_PX;
  const cappedValue = capped ? `${MAX_RENDER_PX}px` : cssVar;

  switch (visual) {
    // A fixed 56×56 box: border-radius can't overflow it, so the cap never
    // applies to the radius sample.
    case 'radius':
      return <div style={{ ...styles.radiusSample, borderRadius: cssVar }} aria-hidden />;
    case 'size': {
      const sample = (
        <div
          style={{ ...styles.sizeSample, width: cappedValue, height: cappedValue }}
          aria-hidden
        />
      );
      return capped ? withCap(sample) : sample;
    }
    case 'length':
    default: {
      const bar = <div style={{ ...styles.bar, width: cappedValue }} aria-hidden />;
      return capped ? withCap(bar) : bar;
    }
  }
}
