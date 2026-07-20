import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DEFAULT_PRESENTERS, usePresenter } from '@unpunnyfuns/swatchbook-blocks';
import { registerPresenters } from '@unpunnyfuns/swatchbook-blocks/host';
import swatchbookAddon from '#/index.ts';

const Custom = () => <i>custom</i>;

// The ambient registry is module-global; reset to the built-ins after each
// so the factory registration in one test does not leak into the next.
afterEach(() => {
  cleanup();
  registerPresenters();
});

it('forwards factory presenters into the ambient registry for provider-less blocks', () => {
  expect(usePresenterOutsideProvider()).toBe(DEFAULT_PRESENTERS.color);
  swatchbookAddon({ presenters: { color: Custom } });
  expect(usePresenterOutsideProvider()).toBe(Custom);
});

function usePresenterOutsideProvider() {
  const { result } = renderHook(() => usePresenter('color'));
  return result.current;
}
