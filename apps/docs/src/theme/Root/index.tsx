import React from 'react';
import { SwatchbookSwitcherProvider } from '../../components/SwatchbookSwitcherContext';

/**
 * Root swizzle (wrap) — provides the docs-site theme-switcher state at the
 * outermost React boundary so every page (plus the swizzled
 * `ColorModeToggle` next to the navbar) can read from it without prop
 * drilling. The provider handles attribute syncing to `<html>` and
 * localStorage persistence.
 */
export default function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return <SwatchbookSwitcherProvider>{children}</SwatchbookSwitcherProvider>;
}
