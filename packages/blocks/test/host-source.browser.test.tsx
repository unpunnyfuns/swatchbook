import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { registerProjectSource, useProjectSource } from '#/host.ts';

afterEach(() => {
  // Restore the ambient source to a clean baseline so other files sharing
  // this worker don't inherit this file's activeAxes / cssVarPrefix.
  registerProjectSource({
    axes: [],
    presets: [],
    diagnostics: [],
    css: '',
    cssVarPrefix: '',
    indicators: {},
    listing: {},
    tokenGraph: { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
    defaultTuple: {},
    defaultColorFormat: 'hex',
    activeAxes: null,
  });
});

it('a pushed source (including activeAxes) is read back', () => {
  registerProjectSource({ cssVarPrefix: 'sb', activeAxes: { mode: 'Dark' } });
  const { result } = renderHook(() => useProjectSource());
  expect(result.current.cssVarPrefix).toBe('sb');
  expect(result.current.activeAxes).toEqual({ mode: 'Dark' });
});

it('a later patch that omits activeAxes keeps the previously set value', () => {
  registerProjectSource({ cssVarPrefix: 'sb', activeAxes: { mode: 'Dark' } });
  const { result } = renderHook(() => useProjectSource());
  act(() => {
    registerProjectSource({ cssVarPrefix: 'zz' });
  });
  expect(result.current.cssVarPrefix).toBe('zz');
  expect(result.current.activeAxes).toEqual({ mode: 'Dark' });
});
