import type { ReactElement } from 'react';
import type { RealisedToken, TokenType } from '@unpunnyfuns/swatchbook-core/token-value-types';
import type { ColorFormat } from '#/format-color.ts';

/**
 * Uniform props every presenter receives, built-in or third-party. A composer
 * renders `registry[token.$type]` with this shape and never special-cases a
 * type. The presenter owns the `$value`→CSS mapping; that is what an override
 * customizes.
 */
export interface PresenterProps<T extends TokenType = TokenType> {
  /** Token dot-path. Label/provenance; the presenter shows the leaf. */
  path: string;
  /** Fully-realised token: concrete `$value`, no alias/graph resolution. */
  token: RealisedToken<T>;
  /** R3: present → use for the visual; absent → render from `$value`. */
  cssVar?: string | undefined;
  /** Relevant to color/gradient; other presenters ignore it (uniform props). */
  colorFormat: ColorFormat;
  /**
   * Optional block-level display hints (RJSF `ui:options`-style). A query
   * block passes its own config (e.g. `{ visual }`, `{ speed }`, `{ sample }`)
   * here; built-in presenters read the keys they understand, custom presenters
   * ignore them. Not part of the token; purely presentation.
   */
  options?: Record<string, unknown> | undefined;
}

/** A presenter component for tokens of `$type` T. */
export type PresenterComponent<T extends TokenType = TokenType> = (
  props: PresenterProps<T>,
) => ReactElement;

/** `$type` → presenter. Partial: a composer falls back to defaults for gaps. */
export type PresenterRegistry = Partial<Record<TokenType, PresenterComponent>>;
