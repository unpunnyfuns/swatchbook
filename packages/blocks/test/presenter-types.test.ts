import { expectTypeOf, it } from 'vitest';
import type { PresenterComponent, PresenterProps } from '#/presenters/types.ts';

it('a presenter is a component taking uniform PresenterProps', () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const p: PresenterComponent<'color'> = ({ path, token, colorFormat }) =>
    ({ path, type: token.$type, colorFormat }) as never;
  expectTypeOf<PresenterProps<'color'>>().toHaveProperty('cssVar');
  expectTypeOf<PresenterProps>().toHaveProperty('colorFormat');
  void p;
});
