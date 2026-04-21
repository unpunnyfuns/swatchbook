import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeSwitcher } from '@unpunnyfuns/swatchbook-switcher';
import { useSwatchbookSwitcher } from './SwatchbookSwitcherContext';
import './SwatchbookSwitcherButton.css';

/**
 * Navbar trigger + popover for the docs-site theme switcher. Mounts next
 * to Docusaurus's built-in colour-mode toggle via the `ColorModeToggle`
 * wrap swizzle. State lives in `SwatchbookSwitcherContext` (provided by
 * the `Root` wrap swizzle).
 *
 * The popover is an absolutely-positioned div anchored to the trigger
 * button — no portal, no popper.js dep. Close on outside click, Escape,
 * or selection inside.
 */
export function SwatchbookSwitcherButton(): React.ReactElement {
  const {
    axes,
    presets,
    defaults,
    activeTuple,
    activeColorFormat,
    lastApplied,
    setAxis,
    applyPreset,
    setColorFormat,
  } = useSwatchbookSwitcher();
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

  // `SwatchbookSwitcherContext` exposes every axis including `mode`; the
  // popover UI should focus on what we actually own here (i.e. the a11y
  // axis). Mode stays driven by Docusaurus's built-in toggle next door.
  const switcherAxes = axes.filter((axis) => axis.name !== 'mode');
  const hasSwitchableContent = switcherAxes.length > 0 || presets.length > 0;

  if (!hasSwitchableContent) return <></>;

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
            axes={switcherAxes}
            presets={presets}
            defaults={defaults}
            activeTuple={activeTuple}
            activeColorFormat={activeColorFormat}
            lastApplied={lastApplied}
            onAxisChange={setAxis}
            onPresetApply={applyPreset}
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
