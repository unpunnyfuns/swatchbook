import OriginalColorModeToggle from '@theme-original/ColorModeToggle';
import type ColorModeToggleType from '@theme/ColorModeToggle';
import React from 'react';
import { SwatchbookSwitcherButton } from '../../components/SwatchbookSwitcherButton';

type ColorModeToggleProps = React.ComponentProps<typeof ColorModeToggleType>;

/**
 * ColorModeToggle swizzle (wrap) — renders the original Docusaurus
 * light/dark toggle unchanged, and appends the swatchbook switcher
 * button next to it. The navbar config is untouched; the trigger
 * hitches a ride on the existing colour-mode slot.
 */
export default function ColorModeToggle(props: ColorModeToggleProps): React.ReactElement {
  return (
    <>
      <OriginalColorModeToggle {...props} />
      <SwatchbookSwitcherButton />
    </>
  );
}
