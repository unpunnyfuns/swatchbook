import { COLOR_FORMATS } from '@unpunnyfuns/swatchbook-core/color-formats';
import { expect, it } from 'vitest';
import { COLOR_FORMAT_OPTIONS } from '#/ColorFormatSelector.tsx';

it('the color-format label set covers exactly core COLOR_FORMATS, in order', () => {
  // The switcher hand-lists labels rather than depending on core at
  // runtime (see ColorFormatSelector.tsx / types.ts). This guards that
  // list against drifting from the canonical set.
  expect(COLOR_FORMAT_OPTIONS.map((o) => o.id)).toEqual([...COLOR_FORMATS]);
});
