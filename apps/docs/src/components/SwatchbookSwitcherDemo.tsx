import type { ReactElement } from 'react';
import { SwatchbookSwitcherButton } from './SwatchbookSwitcherButton.tsx';
import { SwatchbookSwitcherProvider } from './SwatchbookSwitcherContext.tsx';

/**
 * Single-import mount point for embedding the switcher inside an MDX page
 * (`client:load`). Bundles the provider so the page doesn't need a
 * site-wide wrapper the way the previous Docusaurus Root swizzle did.
 */
export default function SwatchbookSwitcherDemo(): ReactElement {
  return (
    <SwatchbookSwitcherProvider>
      <SwatchbookSwitcherButton />
    </SwatchbookSwitcherProvider>
  );
}
