import type { CSSProperties, ReactElement } from 'react';
// Importing the addon-served virtual module directly. The `color` /
// `space` / `radius` / `shadow` namespaces carry `var(--sb-*)` string
// leaves, so interpolating them into inline `style` (or any CSS-in-JS
// library's style prop) resolves through swatchbook's cascade — the
// toolbar flips mode/brand/contrast and the computed values follow.
import { color, radius, shadow, space } from 'virtual:swatchbook/theme';

export interface CssInJsCardProps {
  title: string;
  body: string;
}

/**
 * Dogfood of `@unpunnyfuns/swatchbook-integrations/css-in-js`. Uses
 * plain React inline styles rather than a ThemeProvider to keep the
 * surface narrow — the point is that the theme module's values are
 * already `var()` references, so *any* CSS-in-JS library (emotion,
 * styled-components, stitches, vanilla inline style) gets the same
 * runtime flip-on-toolbar behaviour for free.
 */
export function CssInJsCard({ title, body }: CssInJsCardProps): ReactElement {
  const surfaces = color.surface as Record<string, string>;
  const texts = color.text as Record<string, string>;
  const accents = color.accent as Record<string, string>;
  const borders = color.border as Record<string, string>;

  const cardStyle: CSSProperties = {
    background: surfaces.raised,
    color: texts.default,
    border: `1px solid ${borders.default}`,
    borderRadius: radius.lg,
    boxShadow: shadow.md,
    padding: space.lg,
    maxWidth: '28rem',
    width: '100%',
    fontFamily: 'inherit',
  };

  const headingStyle: CSSProperties = {
    margin: 0,
    marginBottom: space.sm,
    fontSize: '1.125rem',
    fontWeight: 600,
  };

  const bodyStyle: CSSProperties = {
    margin: 0,
    color: texts.muted,
    fontSize: '0.875rem',
  };

  const buttonRowStyle: CSSProperties = {
    display: 'flex',
    gap: space.sm,
    marginTop: space.lg,
  };

  const primaryStyle: CSSProperties = {
    background: accents.bg,
    color: accents.fg,
    border: 0,
    borderRadius: radius.md,
    padding: `${space.sm} ${space.md}`,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  const secondaryStyle: CSSProperties = {
    background: 'transparent',
    color: texts.default,
    border: `1px solid ${borders.default}`,
    borderRadius: radius.md,
    padding: `${space.sm} ${space.md}`,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  return (
    <article style={cardStyle}>
      <h3 style={headingStyle}>{title}</h3>
      <p style={bodyStyle}>{body}</p>
      <div style={buttonRowStyle}>
        <button type="button" style={primaryStyle}>
          Primary
        </button>
        <button type="button" style={secondaryStyle}>
          Secondary
        </button>
      </div>
    </article>
  );
}
