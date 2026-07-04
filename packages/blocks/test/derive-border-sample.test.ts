import { expect, it } from 'vitest';
import { deriveBorderSample } from '#/border-preview/BorderSample.tsx';
import type { ProjectData } from '#/internal/use-project.ts';

function makeProject(
  listing: Pick<ProjectData, 'listing'>['listing'] = {},
): Pick<ProjectData, 'listing' | 'cssVarPrefix'> {
  return { listing, cssVarPrefix: 'sb' };
}

it('resolves the css var from the listing when present', () => {
  const project = makeProject({
    'border.focus': { names: { css: '--tz-border-focus' } },
  } as unknown as ProjectData['listing']);
  const sample = deriveBorderSample('border.focus', project);
  expect(sample.cssVar).toBe('var(--tz-border-focus)');
});

it('falls back to the prefix-derived css var when the listing has no entry', () => {
  const sample = deriveBorderSample('border.focus', makeProject());
  expect(sample.cssVar).toContain('--sb-border-focus');
});
