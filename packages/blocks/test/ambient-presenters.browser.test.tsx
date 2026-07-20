import { cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it } from 'vitest';
import {
  DEFAULT_PRESENTERS,
  mergePresenters,
  PresenterContext,
  SwatchbookProvider,
  usePresenter,
} from '#/index.ts';
import { registerPresenters } from '#/presenters/registry.ts';
import { makeWireSnapshot } from './_wire-helpers.ts';

const Custom = () => <i>custom</i>;
const Other = () => <i>other</i>;

// The ambient registry is module-global and leaks across tests; reset to the
// built-ins after each so no test inherits a prior registration.
afterEach(() => {
  cleanup();
  registerPresenters();
});

it('resolves the built-in with no provider and no registration', () => {
  const { result } = renderHook(() => usePresenter('color'));
  expect(result.current).toBe(DEFAULT_PRESENTERS.color);
});

it('resolves an ambient registration with no provider (the MDX path)', () => {
  registerPresenters({ color: Custom });
  const { result } = renderHook(() => usePresenter('color'));
  expect(result.current).toBe(Custom);
});

it('resolves the ambient registration inside a provider with no presenters prop', () => {
  registerPresenters({ color: Custom });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SwatchbookProvider snapshot={makeWireSnapshot()}>{children}</SwatchbookProvider>
  );
  const { result } = renderHook(() => usePresenter('color'), { wrapper });
  expect(result.current).toBe(Custom);
});

it('honors a provider presenters prop over the ambient registration', () => {
  registerPresenters({ color: Custom });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SwatchbookProvider snapshot={makeWireSnapshot()} presenters={{ color: Other }}>
      {children}
    </SwatchbookProvider>
  );
  const { result } = renderHook(() => usePresenter('color'), { wrapper });
  expect(result.current).toBe(Other);
});

it('honors a manual PresenterContext.Provider over the ambient registration', () => {
  registerPresenters({ color: Custom });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PresenterContext.Provider value={mergePresenters({ color: Other })}>
      {children}
    </PresenterContext.Provider>
  );
  const { result } = renderHook(() => usePresenter('color'), { wrapper });
  expect(result.current).toBe(Other);
});

it('resets to the built-in when registerPresenters is called with no argument', () => {
  registerPresenters({ color: Custom });
  registerPresenters();
  const { result } = renderHook(() => usePresenter('color'));
  expect(result.current).toBe(DEFAULT_PRESENTERS.color);
});
