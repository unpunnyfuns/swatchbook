import { expect, it } from 'vitest';
import { deriveConsumerOutput } from '#/token-detail/ConsumerOutput.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

it('returns no extra platforms when the path is absent from the listing', () => {
  const listing = {} as ProjectData['listing'];
  const derived = deriveConsumerOutput('color.accent.bg', listing);
  expect(derived.extraPlatforms).toEqual([]);
});

it('returns one entry per non-css platform, sorted alphabetically', () => {
  const listing = {
    'color.accent.bg': {
      names: {
        css: '--sb-color-accent-bg',
        swift: 'Color.accentBg',
        android: '@color/accent_bg',
        sass: '$accent-bg',
      },
    },
  } as unknown as ProjectData['listing'];

  const derived = deriveConsumerOutput('color.accent.bg', listing);
  expect(derived.extraPlatforms).toEqual([
    { platform: 'android', label: 'Android', value: '@color/accent_bg' },
    { platform: 'sass', label: 'Sass', value: '$accent-bg' },
    { platform: 'swift', label: 'Swift', value: 'Color.accentBg' },
  ]);
});

it('skips platforms whose listing value is empty', () => {
  const listing = {
    'color.accent.bg': {
      names: {
        css: '--sb-color-accent-bg',
        swift: '',
      },
    },
  } as unknown as ProjectData['listing'];

  const derived = deriveConsumerOutput('color.accent.bg', listing);
  expect(derived.extraPlatforms).toEqual([]);
});
