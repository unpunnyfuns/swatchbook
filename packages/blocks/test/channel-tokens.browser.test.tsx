import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { registerChannel } from '#/internal/channel.ts';
import type { BlockChannel } from '#/internal/channel.ts';
import { TOKENS_UPDATED_EVENT, useTokenSnapshot } from '#/internal/channel-tokens.ts';

function fakeChannel() {
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
  return channel;
}

afterEach(() => {
  registerChannel(fakeChannel());
});

it('applies a dev-time token patch pushed over the channel', () => {
  const channel = fakeChannel();
  registerChannel(channel);
  const { result } = renderHook(() => useTokenSnapshot());
  const before = result.current.version;
  act(() => {
    channel.emit(TOKENS_UPDATED_EVENT, { cssVarPrefix: 'xy' });
  });
  expect(result.current.cssVarPrefix).toBe('xy');
  expect(result.current.version).toBe(before + 1);
});
