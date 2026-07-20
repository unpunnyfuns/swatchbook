import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { SnapshotForWire } from '@unpunnyfuns/swatchbook-core/snapshot-for-wire';
import {
  ensureStyleElement,
  SWATCHBOOK_STYLE_ELEMENT_ID,
} from '@unpunnyfuns/swatchbook-core/style-element';
import { tupleToName } from '@unpunnyfuns/swatchbook-core/themes';
import { SwatchbookContext, useOptionalSwatchbookData } from '#/contexts.ts';
import type { ProjectSnapshot } from '#/contexts.ts';
import { perAxisAttrs } from '#/internal/data-attr.ts';
import { mergePresenters, PresenterContext } from '#/presenters/registry.ts';
import type { PresenterRegistry } from '#/presenters/types.ts';
import '#/internal/chrome-base.css';
import '#/internal/internal-tokens.css';
import '#/internal/internal-dimensions.css';
import '#/internal/internal-typography.css';

export type { ProjectSnapshot };

const SetAxesContext = createContext<((tuple: Record<string, string>) => void) | null>(null);

export interface SwatchbookProviderProps {
  snapshot: SnapshotForWire;
  /** Controlled active tuple. Mutually exclusive with `defaultAxes`. */
  axes?: Record<string, string> | undefined;
  /** Uncontrolled initial tuple; the provider owns state and `useSetAxes` flips it. */
  defaultAxes?: Record<string, string> | undefined;
  /** Overrides merged over {@link DEFAULT_PRESENTERS} for this subtree. */
  presenters?: PresenterRegistry | undefined;
  /**
   * Mount the snapshot's emitted CSS into `document.head` through the shared
   * managed style element (default `true`). Pass `false` when the host places
   * the stylesheet itself: SSR frameworks, shadow roots, the Storybook addon
   * (which injects its own combined stylesheet). The element is shared by ID,
   * so a page hosting providers with different snapshots should opt out and
   * manage stylesheets itself; same-snapshot providers are idempotent.
   */
  mountCss?: boolean | undefined;
  children: ReactNode;
}

// Builds the internal ProjectSnapshot from the wire payload plus the active
// tuple. `resolveAt` is deliberately left unset: use-project builds it from
// `tokenGraph` (memoized on `[tokenGraph, activeTheme]`), so assembling it
// here would just produce a second, throwaway closure per render.
function assemble(snapshot: SnapshotForWire, activeAxes: Record<string, string>): ProjectSnapshot {
  return {
    axes: snapshot.axes,
    activeAxes,
    activeTheme: tupleToName(snapshot.axes, activeAxes),
    cssVarPrefix: snapshot.cssVarPrefix,
    indicators: snapshot.indicators,
    diagnostics: snapshot.diagnostics,
    css: snapshot.css,
    listing: snapshot.listing,
    tokenGraph: snapshot.tokenGraph,
    defaultTuple: snapshot.defaultTuple,
    defaultColorFormat: snapshot.defaultColorFormat,
  };
}

/**
 * Wraps a tree of blocks with the token data they need to render, assembled
 * from core's wire snapshot plus an active axis tuple.
 *
 * The Storybook addon's preview decorator mounts this automatically
 * (`axes` controlled by the toolbar), so story/MDX authors typically never
 * see it. Outside Storybook: unit tests, custom React apps, non-Storybook
 * doc sites. Consumers pass a {@link SnapshotForWire} (often imported from
 * a JSON file) and either drive `axes` themselves or let the provider own
 * the tuple via `defaultAxes` + {@link useSetAxes}.
 */
export function SwatchbookProvider({
  snapshot,
  axes,
  defaultAxes,
  presenters,
  mountCss = true,
  children,
}: SwatchbookProviderProps): ReactElement {
  const [internalAxes, setInternalAxes] = useState<Record<string, string>>(
    () => defaultAxes ?? snapshot.defaultTuple,
  );
  // Effect, not render-time, so SSR renders never touch the DOM. The
  // element is deliberately left in place on unmount: it is shared and
  // idempotent, matching the host-fed fallback path's semantics.
  useEffect(() => {
    if (!mountCss) return;
    ensureStyleElement(SWATCHBOOK_STYLE_ELEMENT_ID, snapshot.css);
  }, [mountCss, snapshot.css]);
  const controlled = axes !== undefined;
  const activeAxes = controlled ? axes : internalAxes;
  const value = useMemo(() => assemble(snapshot, activeAxes), [snapshot, activeAxes]);
  const merged = useMemo(() => mergePresenters(presenters), [presenters]);
  const setAxes = controlled ? null : setInternalAxes;
  // `perAxisAttrs`, not `blockWrapperAttrs`: this div wraps arbitrary
  // children (the addon wraps a whole story in it), not a single block's
  // own root. `blockWrapperAttrs`'s `.sb-block` chrome (hard-coded light
  // surface/padding/border-radius, see chrome-base.css) is meant for one
  // block's card, not the whole subtree. Applying it here would paint
  // every story in a light card regardless of the active theme axis.
  // Axis data-attributes are still the point: descendant blocks' CSS var
  // reads resolve against the nearest matching `[data-<prefix>-<axis>]`.
  return (
    <div {...perAxisAttrs(snapshot.cssVarPrefix, activeAxes)}>
      <SwatchbookContext.Provider value={value}>
        <PresenterContext.Provider value={merged}>
          <SetAxesContext.Provider value={setAxes}>{children}</SetAxesContext.Provider>
        </PresenterContext.Provider>
      </SwatchbookContext.Provider>
    </div>
  );
}

/**
 * Flip the active tuple on an uncontrolled {@link SwatchbookProvider}
 * (mounted with `defaultAxes`, not `axes`). Throws when the nearest
 * provider is controlled (the host owns `axes`) or absent, since there's
 * no internal state to flip in either case.
 */
export function useSetAxes(): (tuple: Record<string, string>) => void {
  const setAxes = useContext(SetAxesContext);
  if (!setAxes) {
    throw new Error(
      '[swatchbook-blocks] useSetAxes() requires an uncontrolled <SwatchbookProvider defaultAxes={…}> ' +
        '(not one given an `axes` prop, and not no provider at all).',
    );
  }
  return setAxes;
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
        'Wrap your tree in <SwatchbookProvider snapshot={wire}> or render inside a Storybook story.',
    );
  }
  return value;
}
