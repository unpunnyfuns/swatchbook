// Pragmatic exception: `formatTokenValue` is an internal helper, but it's
// the one place we make the one-line value-display decisions for every
// DTCG type. Testing it directly is materially cheaper than a dozen
// component-render tests that each just assert the same display strings,
// and it's pure so the refactor tax is low.
import { describe, expect, it } from 'vitest';
import { formatTokenValue } from '#/internal/format-token-value.ts';

describe('formatTokenValue', () => {
  it('returns empty string for null / undefined', () => {
    expect(formatTokenValue(null, 'dimension', 'hex')).toBe('');
    expect(formatTokenValue(undefined, 'color', 'hex')).toBe('');
  });

  it('respects the active color format for color tokens', () => {
    const color = { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ff0000' };
    expect(formatTokenValue(color, 'color', 'hex')).toContain('#');
    expect(formatTokenValue(color, 'color', 'rgb')).toContain('rgb');
    expect(formatTokenValue(color, 'color', 'oklch')).toContain('oklch');
  });

  it('stringifies dimensions as value+unit', () => {
    expect(formatTokenValue({ value: 16, unit: 'px' }, 'dimension', 'hex')).toBe('16px');
    expect(formatTokenValue({ value: 1.5, unit: 'rem' }, 'dimension', 'hex')).toBe('1.5rem');
    expect(formatTokenValue({ value: 200, unit: 'ms' }, 'duration', 'hex')).toBe('200ms');
  });

  it('joins fontFamily arrays with commas; passes strings through', () => {
    expect(formatTokenValue('Inter', 'fontFamily', 'hex')).toBe('Inter');
    expect(formatTokenValue(['Inter', 'system-ui'], 'fontFamily', 'hex')).toBe('Inter, system-ui');
  });

  it('formats cubicBezier as the CSS function', () => {
    expect(formatTokenValue([0.2, 0, 0, 1], 'cubicBezier', 'hex')).toBe(
      'cubic-bezier(0.2, 0, 0, 1)',
    );
  });

  it('honors colorFormat in border sub-values', () => {
    const border = {
      width: { value: 1, unit: 'px' },
      style: 'solid',
      color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' },
    };
    const out = formatTokenValue(border, 'border', 'hex');
    expect(out).toContain('1px');
    expect(out).toContain('solid');
    expect(out).toContain('#');
  });

  it('honors colorFormat in shadow sub-values and joins layers', () => {
    const shadow = [
      {
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 2, unit: 'px' },
        blur: { value: 4, unit: 'px' },
        spread: { value: 0, unit: 'px' },
        color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1, hex: '#0000001a' },
      },
    ];
    const out = formatTokenValue(shadow, 'shadow', 'rgb');
    expect(out).toContain('0px 2px 4px 0px');
    expect(out).toMatch(/rgb/);
  });

  it('formats typography as family / size / lineHeight / weight', () => {
    const typography = {
      fontFamily: 'Inter',
      fontSize: { value: 16, unit: 'px' },
      lineHeight: 1.5,
      fontWeight: 400,
    };
    expect(formatTokenValue(typography, 'typography', 'hex')).toBe('Inter / 16px / 1.5 / 400');
  });

  it('formats transitions without trailing zero delay', () => {
    const transition = {
      duration: { value: 200, unit: 'ms' },
      timingFunction: 'ease-out',
      delay: { value: 0, unit: 'ms' },
    };
    expect(formatTokenValue(transition, 'transition', 'hex')).toBe('200ms ease-out');
  });

  it('formats gradient stops with percent positions', () => {
    const gradient = [
      { position: 0, color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000' } },
      { position: 1, color: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#fff' } },
    ];
    const out = formatTokenValue(gradient, 'gradient', 'hex');
    expect(out).toContain('0%');
    expect(out).toContain('100%');
  });

  it('passes plugin-css previewValue through, scrubbing IEEE-754 noise from gradient stops', () => {
    // plugin-css emits `100 * position`% without rounding, so 0.55
    // surfaces as 55.00000000000001%. cleanFloatNoise normalises that
    // to 55% while preserving the rest of the previewValue verbatim.
    const gradient = [
      { position: 0, color: { colorSpace: 'srgb', components: [1, 1, 0], hex: '#fde047' } },
      { position: 0.55, color: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#ef4444' } },
      { position: 1, color: { colorSpace: 'srgb', components: [0.5, 0, 1], hex: '#7c3aed' } },
    ];
    const listing = {
      names: { css: '--sb-gradient-warn' },
      previewValue: '#fde047 0%, #ef4444 55.00000000000001%, #7c3aed 100%',
    };
    const out = formatTokenValue(gradient, 'gradient', 'hex', listing);
    expect(out).not.toContain('55.00000000000001');
    expect(out).toBe('#fde047 0%, #ef4444 55%, #7c3aed 100%');
  });

  it('falls back to the local gradient formatter when no previewValue is available', () => {
    const gradient = [
      { position: 0, color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000' } },
      { position: 1, color: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#fff' } },
    ];
    const out = formatTokenValue(gradient, 'gradient', 'hex');
    expect(out).toContain('→');
  });

  it('preserves legitimate 3-decimal precision in previewValue numbers', () => {
    // Authored values like 33.333% (gradient stop at 1/3) or 0.875rem
    // (7/8 step) must pass through cleanFloatNoise untouched. Only
    // strings with 8+ fractional digits are normalised.
    const gradient = [
      { position: 0, color: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000' } },
      { position: 0.333, color: { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], hex: '#888' } },
      { position: 1, color: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#fff' } },
    ];
    const listing = {
      names: { css: '--sb-gradient-thirds' },
      previewValue: '#000 0%, #888 33.333%, #fff 100%',
    };
    const out = formatTokenValue(gradient, 'gradient', 'hex', listing);
    expect(out).toBe('#000 0%, #888 33.333%, #fff 100%');
  });

  it('renders typography via plugin-css CSS `font` shorthand', () => {
    const typography = {
      fontFamily: ['Inter', 'system-ui'],
      fontSize: { value: 1, unit: 'rem' },
      fontWeight: 400,
      lineHeight: 1.5,
    };
    const listing = {
      names: { css: '--sb-typography-body' },
      previewValue: '400 1rem/1.5 "Inter", system-ui',
    };
    const out = formatTokenValue(typography, 'typography', 'hex', listing);
    expect(out).toBe('400 1rem/1.5 "Inter", system-ui');
  });

  it('renders transition via plugin-css `duration delay easing` shorthand', () => {
    const transition = {
      duration: { value: 200, unit: 'ms' },
      timingFunction: 'ease-out',
      delay: { value: 0, unit: 'ms' },
    };
    const listing = {
      names: { css: '--sb-transition-enter' },
      previewValue: '200ms 0ms ease-out',
    };
    const out = formatTokenValue(transition, 'transition', 'hex', listing);
    expect(out).toBe('200ms 0ms ease-out');
  });

  it('falls through to JSON only for unknown object shapes', () => {
    const out = formatTokenValue({ foo: 'bar' }, 'mystery', 'hex');
    expect(out).toBe('{"foo":"bar"}');
  });
});
