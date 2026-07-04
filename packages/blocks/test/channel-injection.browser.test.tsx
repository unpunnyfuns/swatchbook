import { afterEach, expect, it } from 'vitest';
import { onChannel, registerChannel } from '#/internal/channel.ts';
import type { BlockChannel } from '#/internal/channel.ts';

// A minimal event source standing in for Storybook's preview Channel.
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

it('runs an attach queued before a channel is registered', () => {
  let seen: unknown;
  onChannel((c) => c.on('evt', (p) => (seen = p)));
  const channel = fakeChannel();
  registerChannel(channel);
  channel.emit('evt', 42);
  expect(seen).toBe(42);
});

it('runs an attach registered after a channel, immediately', () => {
  const channel = fakeChannel();
  registerChannel(channel);
  let seen: unknown;
  onChannel((c) => c.on('evt', (p) => (seen = p)));
  channel.emit('evt', 'hi');
  expect(seen).toBe('hi');
});
