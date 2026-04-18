import type { ReactElement, ReactNode } from 'react';
import { type ProjectSnapshot, SwatchbookContext, useOptionalSwatchbookData } from '#/contexts.ts';

export type { ProjectSnapshot };

export interface SwatchbookProviderProps {
  value: ProjectSnapshot;
  children: ReactNode;
}

/**
 * Wraps a tree of blocks with the token data they need to render.
 *
 * The Storybook addon's preview decorator mounts this automatically, so
 * story/MDX authors typically never see it. Outside Storybook — unit
 * tests, custom React apps, non-Storybook doc sites — consumers construct
 * a {@link ProjectSnapshot} (often imported from a JSON file) and wrap
 * their blocks in this provider.
 */
export function SwatchbookProvider({ value, children }: SwatchbookProviderProps): ReactElement {
  return <SwatchbookContext.Provider value={value}>{children}</SwatchbookContext.Provider>;
}

/**
 * Read the current {@link ProjectSnapshot}. Throws if called outside a
 * {@link SwatchbookProvider}; blocks that need to fall back to the
 * virtual module go through the internal `useProject()` hook instead.
 */
export function useSwatchbookData(): ProjectSnapshot {
  const value = useOptionalSwatchbookData();
  if (!value) {
    throw new Error(
      '[swatchbook-blocks] useSwatchbookData() called outside <SwatchbookProvider>. ' +
        'Wrap your tree in <SwatchbookProvider value={snapshot}> or render inside a Storybook story.',
    );
  }
  return value;
}
