import { expect, it } from 'vitest';
import { deriveShadowSample } from '#/shadow-preview/ShadowSample.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

function makeProject(
  listing: Pick<ProjectData, 'listing'>['listing'] = {},
): Pick<ProjectData, 'listing' | 'cssVarPrefix'> {
  return { listing, cssVarPrefix: 'sb' };
}

it('resolves the css var from the listing when present', () => {
  const project = makeProject({
    'shadow.default': { names: { css: '--tz-shadow-default' } },
  } as unknown as ProjectData['listing']);
  const sample = deriveShadowSample('shadow.default', project);
  expect(sample.cssVar).toBe('var(--tz-shadow-default)');
});

it('falls back to the prefix-derived css var when the listing has no entry', () => {
  const sample = deriveShadowSample('shadow.default', makeProject());
  expect(sample.cssVar).toContain('--sb-shadow-default');
});
