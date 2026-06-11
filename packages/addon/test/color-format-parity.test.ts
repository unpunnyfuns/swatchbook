import { COLOR_FORMATS } from '@unpunnyfuns/swatchbook-core/color-formats';
import { expect, it } from 'vitest';
import { COLOR_FORMAT_OPTIONS } from '#/ColorFormatSelector.tsx';

it('the toolbar label set covers exactly core COLOR_FORMATS, in order', () => {
  // The manager bundle can't import blocks, so it hand-lists labels for each
  // format. This guards that list against drifting from the canonical set.
  expect(COLOR_FORMAT_OPTIONS.map((o) => o.id)).toEqual([...COLOR_FORMATS]);
});
