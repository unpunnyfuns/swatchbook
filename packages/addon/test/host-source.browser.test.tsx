import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { registerProjectSource, useProjectSource } from '@unpunnyfuns/swatchbook-blocks/host';
import { TOKENS_UPDATED_EVENT } from '#/constants.ts';
import { installHostSource } from '#/host-source.ts';

// A minimal event source standing in for Storybook's preview Channel:
// `installHostSource` only needs `on`, so a plain listener map suffices.
function fakeChannel() {
  const listeners = new Map<string, ((payload: any) => void)[]>();
  return {
    on(event: string, listener: (payload: any) => void) {
      const list = listeners.get(event) ?? [];
      list.push(listener);
      listeners.set(event, list);
    },
    emit(event: string, payload: unknown) {
      for (const l of listeners.get(event) ?? []) l(payload);
    },
  };
}

afterEach(() => {
  // Restore the ambient source to a clean baseline so other files sharing
  // this worker don't inherit a test's activeAxes / cssVarPrefix.
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

it('decodes a globals event into the ambient source activeAxes', () => {
  const channel = fakeChannel();
  installHostSource(channel);
  const { result } = renderHook(() => useProjectSource());

  act(() => {
    channel.emit('setGlobals', { globals: { swatchbookAxes: { mode: 'Dark' } } });
  });

  expect(result.current.activeAxes).toEqual({ mode: 'Dark' });
});

it('dedupes identical globals across the three Storybook globals events', () => {
  const channel = fakeChannel();
  installHostSource(channel);
  const { result } = renderHook(() => useProjectSource());

  act(() => {
    channel.emit('setGlobals', { globals: { swatchbookAxes: { mode: 'Light' } } });
  });
  const versionAfterFirst = result.current.version;

  act(() => {
    channel.emit('updateGlobals', { globals: { swatchbookAxes: { mode: 'Light' } } });
    channel.emit('globalsUpdated', { globals: { swatchbookAxes: { mode: 'Light' } } });
  });

  expect(result.current.version).toBe(versionAfterFirst);
});

it('forwards a TOKENS_UPDATED_EVENT payload as a snapshot patch', () => {
  const channel = fakeChannel();
  installHostSource(channel);
  const { result } = renderHook(() => useProjectSource());

  act(() => {
    channel.emit(TOKENS_UPDATED_EVENT, { cssVarPrefix: 'xy' });
  });

  expect(result.current.cssVarPrefix).toBe('xy');
});
