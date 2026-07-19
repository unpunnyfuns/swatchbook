import '#/internal/chrome-base.css';
import '#/internal/internal-tokens.css';
import '#/internal/internal-dimensions.css';
import '#/internal/internal-typography.css';
import { useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { SwatchbookContext, useOptionalSwatchbookData } from '#/contexts.ts';
import type { ProjectSnapshot } from '#/contexts.ts';
import { mergePresenters, PresenterContext } from '#/presenters/registry.ts';
import type { PresenterRegistry } from '#/presenters/types.ts';

export type { ProjectSnapshot };

export interface SwatchbookProviderProps {
  value: ProjectSnapshot;
  /** Overrides merged over {@link DEFAULT_PRESENTERS} for this subtree. */
  presenters?: PresenterRegistry;
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
export function SwatchbookProvider({
  value,
  presenters,
  children,
}: SwatchbookProviderProps): ReactElement {
  const merged = useMemo(() => mergePresenters(presenters), [presenters]);
  return (
    <SwatchbookContext.Provider value={value}>
      <PresenterContext.Provider value={merged}>{children}</PresenterContext.Provider>
    </SwatchbookContext.Provider>
  );
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
