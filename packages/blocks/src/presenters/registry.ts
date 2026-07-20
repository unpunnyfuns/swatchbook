import { createContext, useContext } from 'react';
import type { TokenType } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { BorderSample } from '#/border-preview/BorderSample.tsx';
import { ColorSwatch } from '#/presenters/ColorSwatch.tsx';
import { DimensionSample } from '#/dimension-scale/DimensionSample.tsx';
import { FontFamilySpecimen } from '#/presenters/FontFamilySpecimen.tsx';
import { FontWeightSpecimen } from '#/presenters/FontWeightSpecimen.tsx';
import { GradientSwatch } from '#/presenters/GradientSwatch.tsx';
import { MotionSample } from '#/motion-preview/MotionSample.tsx';
import { OpacitySwatch } from '#/presenters/OpacitySwatch.tsx';
import type { PresenterComponent, PresenterRegistry } from '#/presenters/types.ts';
import { StrokeSample } from '#/presenters/StrokeSample.tsx';
import { TypeSpecimen } from '#/presenters/TypeSpecimen.tsx';
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
  gradient: GradientSwatch as PresenterComponent,
  transition: MotionSample as PresenterComponent,
  typography: TypeSpecimen as PresenterComponent,
  fontFamily: FontFamilySpecimen as PresenterComponent,
  fontWeight: FontWeightSpecimen as PresenterComponent,
  number: OpacitySwatch as PresenterComponent,
  strokeStyle: StrokeSample as PresenterComponent,
};

/** Overrides win per `$type`; unlisted types keep the built-in. */
export function mergePresenters(overrides?: PresenterRegistry): PresenterRegistry {
  return overrides ? { ...DEFAULT_PRESENTERS, ...overrides } : DEFAULT_PRESENTERS;
}

/** The active merged registry for the subtree. */
export const PresenterContext = createContext<PresenterRegistry>(DEFAULT_PRESENTERS);

let ambientPresenters: PresenterRegistry = DEFAULT_PRESENTERS;

/**
 * Set the ambient presenter registry consulted by blocks that render with
 * no `SwatchbookProvider` or `PresenterContext.Provider` above them (MDX
 * doc blocks, autodocs). A host registers this once at preview-init; it is
 * NOT reactive, so register before first render. Passing no argument (or
 * `undefined`) resets to the built-ins. An explicit provider/context
 * override still wins for its subtree; this only fills the provider-less
 * gap.
 */
export function registerPresenters(overrides?: PresenterRegistry): void {
  ambientPresenters = mergePresenters(overrides);
}

/** The ambient registry for the provider-less fallback. */
export function getAmbientPresenters(): PresenterRegistry {
  return ambientPresenters;
}

/** The presenter for `type`, or `undefined` if none is registered. */
export function usePresenter(type: TokenType): PresenterComponent | undefined {
  const ctx = useContext(PresenterContext);
  // An explicit provider/context override replaces the default reference, so
  // identity distinguishes "no override present" (fall to ambient) from
  // "override present" (honor it).
  const registry = ctx === DEFAULT_PRESENTERS ? ambientPresenters : ctx;
  return registry[type];
}
