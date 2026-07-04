/**
 * Minimal event-source contract blocks need from their host. Storybook's
 * preview Channel satisfies it structurally; a plain emitter or a test double
 * does too. Blocks never import `storybook/preview-api` — the addon, which
 * owns the Storybook relationship, injects the channel at preview init via
 * {@link registerChannel}, mirroring how `registerTokenSource` injects the
 * initial token snapshot.
 */
export interface BlockChannel {
  on<T>(event: string, listener: (payload: T) => void): void;
}

let channel: BlockChannel | null = null;
const pending = new Set<(channel: BlockChannel) => void>();

/**
 * Inject the host channel. Called once by the addon preview at init. Runs any
 * subscribers that registered before the channel existed, then clears the
 * queue. Idempotent for consumers: each subscriber guards its own attach, so a
 * re-register (HMR) does not double-wire.
 */
export function registerChannel(next: BlockChannel): void {
  channel = next;
  for (const attach of pending) attach(next);
  pending.clear();
}

/**
 * Attach a subscriber to the host channel now if one is registered, else queue
 * it to run the moment {@link registerChannel} fires. Blocks call this at
 * module load; the queue absorbs the gap until the addon injects the channel.
 */
export function onChannel(attach: (channel: BlockChannel) => void): void {
  if (channel) attach(channel);
  else pending.add(attach);
}
