import { useColorMode } from '@docusaurus/theme-common';
import { type SwitcherPreset, ThemeSwitcher } from '@unpunnyfuns/swatchbook-switcher';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODE_AXIS, useSwatchbookSwitcher } from './SwatchbookSwitcherContext';
import './SwatchbookSwitcherButton.css';

type DocusaurusMode = 'light' | 'dark';

function toDocusaurusMode(context: string): DocusaurusMode {
  return context.toLowerCase() === 'dark' ? 'dark' : 'light';
}

function toSwatchbookMode(colorMode: DocusaurusMode, contexts: readonly string[]): string {
  const match = contexts.find((ctx) => ctx.toLowerCase() === colorMode);
  return match ?? contexts[0] ?? 'Light';
}

/**
 * Navbar trigger + popover for the docs-site theme switcher. Replaces
 * Docusaurus's built-in colour-mode toggle (via the `ColorModeToggle`
 * swizzle) and hosts every axis the project ships — including `mode`,
 * which is bridged to `useColorMode` here so `[data-theme]` on `<html>`
 * stays in lockstep.
 *
 * Runs strictly under `<ColorModeProvider>`, which is why the
 * `useColorMode` call lives in the button rather than the Root-level
 * provider (Root sits outside the colour-mode context during SSR).
 */
export function SwatchbookSwitcherButton(): React.ReactElement {
  const {
    axes,
    presets,
    defaults,
    nonModeTuple,
    activeColorFormat,
    lastApplied,
    setNonModeAxis,
    applyNonModeFromPreset,
    setLastApplied,
    setColorFormat,
  } = useSwatchbookSwitcher();
  const { colorMode, setColorMode } = useColorMode();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onDocMouseDown = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onDocKey);
    document.addEventListener('mousedown', onDocMouseDown);
    return () => {
      document.removeEventListener('keydown', onDocKey);
      document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, [open]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  }, []);

  const modeAxis = useMemo(() => axes.find((axis) => axis.name === MODE_AXIS), [axes]);
  const activeTuple = useMemo<Record<string, string>>(() => {
    const tuple: Record<string, string> = { ...nonModeTuple };
    if (modeAxis) tuple[MODE_AXIS] = toSwatchbookMode(colorMode, modeAxis.contexts);
    return tuple;
  }, [nonModeTuple, modeAxis, colorMode]);

  const onAxisChange = useCallback(
    (axisName: string, next: string) => {
      if (axisName === MODE_AXIS) {
        setColorMode(toDocusaurusMode(next));
        return;
      }
      setNonModeAxis(axisName, next);
    },
    [setColorMode, setNonModeAxis],
  );

  const onPresetApply = useCallback(
    (preset: SwitcherPreset) => {
      const nextMode = preset.axes[MODE_AXIS];
      if (typeof nextMode === 'string' && modeAxis?.contexts.includes(nextMode)) {
        setColorMode(toDocusaurusMode(nextMode));
      }
      applyNonModeFromPreset(preset);
      setLastApplied(preset.name);
    },
    [modeAxis, setColorMode, applyNonModeFromPreset, setLastApplied],
  );

  // With the built-in colour-mode toggle removed from the navbar, this
  // popover owns every axis the project ships.
  if (axes.length === 0 && presets.length === 0) return <></>;

  return (
    <div ref={wrapperRef} className="sb-docs-switcher">
      <button
        type="button"
        aria-label="Open theme switcher"
        aria-expanded={open}
        aria-haspopup="menu"
        className="sb-docs-switcher__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <SwatchbookGlyph />
      </button>
      {open && (
        <div className="sb-docs-switcher__popover">
          <ThemeSwitcher
            axes={axes}
            presets={presets}
            defaults={defaults}
            activeTuple={activeTuple}
            activeColorFormat={activeColorFormat}
            lastApplied={lastApplied}
            onAxisChange={onAxisChange}
            onPresetApply={onPresetApply}
            onColorFormatChange={setColorFormat}
            onKeyDown={onKeyDown}
          />
        </div>
      )}
    </div>
  );
}

function SwatchbookGlyph(): React.ReactElement {
  // Match the addon toolbar's yinyang glyph for visual continuity.
  return (
    <svg width={18} height={18} viewBox="0 0 14 14" aria-hidden>
      <circle cx={7} cy={7} r={6} fill="currentColor" opacity={0.15} />
      <path d="M7 1a6 6 0 0 0 0 12 3 3 0 0 0 0-6 3 3 0 0 1 0-6Z" fill="currentColor" />
    </svg>
  );
}
