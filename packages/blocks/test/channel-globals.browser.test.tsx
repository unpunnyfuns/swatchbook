import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { registerChannel } from '#/internal/channel.ts';
import type { BlockChannel } from '#/internal/channel.ts';
import { useChannelGlobals } from '#/internal/channel-globals.ts';

// The provider-less (MDX docs) path: blocks read the toolbar's axes/format
// off the injected host channel. A plain fake channel stands in for
// Storybook's — proving blocks need no Storybook symbol to function. Each
// test emits its own globals so it doesn't depend on the shared snapshot's
// prior state.
const listeners = new Map<string, ((payload: any) => void)[]>();
const channel: BlockChannel & { emit(event: string, payload: unknown): void } = {
  on(event, listener) {
    const list = listeners.get(event) ?? [];
    list.push(listener as (payload: any) => void);
    listeners.set(event, list);
  },
  emit(event, payload) {
    for (const l of listeners.get(event) ?? []) l(payload);
  },
};
registerChannel(channel);

function emitGlobals(globals: Record<string, unknown>): void {
  act(() => {
    channel.emit('setGlobals', { globals });
  });
}

afterEach(() => {
  cleanup();
});

describe('useChannelGlobals', () => {
  it('captures axes and format from a globals event', () => {
    const { result } = renderHook(() => useChannelGlobals());
    emitGlobals({ swatchbookAxes: { mode: 'Dark' }, swatchbookColorFormat: 'rgb' });
    expect(result.current.axes).toEqual({ mode: 'Dark' });
    expect(result.current.format).toBe('rgb');
  });

  it('retains a field when a later event omits it (partial merge)', () => {
    const { result } = renderHook(() => useChannelGlobals());
    emitGlobals({ swatchbookAxes: { mode: 'Light' }, swatchbookColorFormat: 'hex' });
    emitGlobals({ swatchbookAxes: { mode: 'Dark' } });
    expect(result.current.axes).toEqual({ mode: 'Dark' });
    expect(result.current.format).toBe('hex');
  });

  it('ignores an unrecognized color format', () => {
    const { result } = renderHook(() => useChannelGlobals());
    emitGlobals({ swatchbookColorFormat: 'oklch' });
    emitGlobals({ swatchbookColorFormat: 'not-a-real-format' });
    expect(result.current.format).toBe('oklch');
  });
});
