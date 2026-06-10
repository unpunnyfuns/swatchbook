import { act, cleanup, renderHook } from '@testing-library/react';
import { addons } from 'storybook/preview-api';
import { afterEach, describe, expect, it } from 'vitest';
import { useChannelGlobals } from '#/internal/channel-globals.ts';

// The provider-less (MDX docs) path: blocks read the toolbar's axes/format
// straight off the Storybook globals channel. Each test emits its own
// globals so it doesn't depend on the shared module snapshot's prior state.
const channel = addons.getChannel();
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
