import { createContext, useContext } from 'react';
import type { TokenType } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { ColorSwatch } from '#/presenters/ColorSwatch.tsx';
import { DimensionSample } from '#/dimension-scale/DimensionSample.tsx';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';
import type { PresenterComponent, PresenterRegistry } from '#/presenters/types.ts';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';

/**
 * Built-in presenters, keyed by DTCG `$type`. Phase C registers each entry as
 * its presenter lands. A consumer's `presenters` override merges over this.
 */
export const DEFAULT_PRESENTERS: PresenterRegistry = {
  color: ColorSwatch as PresenterComponent,
  shadow: ShadowSample as PresenterComponent,
  border: BorderSample as PresenterComponent,
  dimension: DimensionSample as PresenterComponent,
  transition: MotionSample as PresenterComponent,
};

/** Overrides win per `$type`; unlisted types keep the built-in. */
export function mergePresenters(overrides?: PresenterRegistry): PresenterRegistry {
  return overrides ? { ...DEFAULT_PRESENTERS, ...overrides } : DEFAULT_PRESENTERS;
}

/** The active merged registry for the subtree. */
export const PresenterContext = createContext<PresenterRegistry>(DEFAULT_PRESENTERS);

/** The presenter for `type`, or `undefined` if none is registered. */
export function usePresenter(type: TokenType): PresenterComponent | undefined {
  return useContext(PresenterContext)[type];
}
