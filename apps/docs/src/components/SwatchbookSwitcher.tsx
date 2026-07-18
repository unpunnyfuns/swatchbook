import type { ReactElement } from 'react';
import { SwatchbookSwitcherButton } from './SwatchbookSwitcherButton.tsx';
import { SwatchbookSwitcherProvider } from './SwatchbookSwitcherContext.tsx';

/**
 * Self-contained switcher island: bundles the provider with the trigger +
 * popover so a single `client:load` mount works anywhere. Used both as the
 * site header's theme control (via the `ThemeSelect` override) and as the
 * live demo on the switcher reference page.
 */
export default function SwatchbookSwitcher(): ReactElement {
  return (
    <SwatchbookSwitcherProvider>
      <SwatchbookSwitcherButton />
    </SwatchbookSwitcherProvider>
  );
}
