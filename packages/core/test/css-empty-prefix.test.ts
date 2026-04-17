import { expect, it } from 'vitest';
import { projectCss } from '#/emit';
import { loadWithPrefix } from './_helpers';

it('omits the leading dash when prefix is empty', async () => {
  const project = await loadWithPrefix('');
  const css = projectCss(project);
  expect(css).toContain('--color-sys-surface-default:');
  expect(css).not.toContain('---color-sys-surface-default:');
});
