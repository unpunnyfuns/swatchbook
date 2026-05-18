/**
 * Shared setup for the three DetailOverlay browser tests
 * (`detail-overlay-focus-lifecycle`, `-focus-trap`, `-dismissal`).
 * Empty-snapshot rendering hands callers a `dialog` + close button to
 * exercise; no per-block content is needed for the trap / dismissal /
 * lifecycle assertions.
 */
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { DetailOverlay } from '#/internal/DetailOverlay.tsx';
import { SwatchbookProvider } from '#/provider.tsx';
import type { ProjectSnapshot } from '#/contexts.ts';

export function emptySnapshot(): ProjectSnapshot {
  return {
    axes: [],
    disabledAxes: [],
    presets: [],
    cells: {},
    jointOverrides: [],
    defaultTuple: {},
    activeTheme: '',
    activeAxes: {},
    cssVarPrefix: '',
    diagnostics: [],
    css: '',
  };
}

export function renderOverlay(onClose = vi.fn()): { onClose: ReturnType<typeof vi.fn> } {
  render(
    <SwatchbookProvider value={emptySnapshot()}>
      <DetailOverlay path="color.accent.bg" onClose={onClose} />
    </SwatchbookProvider>,
  );
  return { onClose };
}
