import { registerProjectSource } from '@unpunnyfuns/swatchbook-blocks/host';
import type { ProjectSource } from '@unpunnyfuns/swatchbook-blocks/host';
import { AXES_GLOBAL_KEY, TOKENS_UPDATED_EVENT } from '#/constants.ts';

/**
 * Minimal structural contract this module needs from Storybook's preview
 * `Channel`: just enough to subscribe. Storybook's own `Channel` class
 * isn't exported from the public `storybook/preview-api` surface, so a
 * local interface (rather than reaching into `storybook/internal/*`) keeps
 * the addon's internal-import surface at the two sites
 * `storybook-internal-surface.test.ts` guards. `addons.getChannel()`
 * satisfies this structurally.
 */
interface HostChannel {
  on<T>(event: string, listener: (payload: T) => void): void;
}

interface SwatchbookGlobalsPayload {
  swatchbookAxes?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Own the addon's entire Storybook-channel decoding and push the result
 * into blocks' generic ambient project source (`registerProjectSource`
 * from `@unpunnyfuns/swatchbook-blocks/host`). Blocks carry no Storybook
 * vocabulary of their own; this is the one place that translates
 * Storybook's wire events into the host-agnostic `ProjectSource` shape.
 *
 * Two independent event streams feed the same store:
 * - globals → active axis tuple, decoded off `globalsUpdated` /
 *   `setGlobals` / `updateGlobals`.
 * - dev-time HMR token refresh (`TOKENS_UPDATED_EVENT`) → a snapshot
 *   patch, forwarded as-is.
 *
 * Call once at preview init, before any block renders, so the initial
 * `setGlobals` broadcast lands in the store before the first read.
 */
// Guards against a preview HMR re-eval calling `installHostSource` again
// with the same channel singleton (`addons.getChannel()` is stable across
// a module reload) and accumulating a second set of listeners. Tracked
// per-channel rather than as a single flag so distinct channel instances
// (multiple hosts, test isolation) each still get wired.
const installedChannels = new WeakSet<HostChannel>();

export function installHostSource(channel: HostChannel): void {
  if (installedChannels.has(channel)) return;
  installedChannels.add(channel);
  // Storybook fires `globalsUpdated`, `setGlobals`, and `updateGlobals` for
  // the same logical change (preview init + every toolbar tick):
  // `setGlobals` carries the initial URL-persisted globals, `updateGlobals`
  // is the toolbar signal, `globalsUpdated` is the cross-frame echo.
  // Subscribing to all three is intentional; the handler content-dedupes
  // via a fingerprint so the three events per tick push at most one patch.
  let lastFingerprint = '';
  const onGlobals = (payload: { globals?: SwatchbookGlobalsPayload }): void => {
    const incomingAxes = payload.globals?.[AXES_GLOBAL_KEY];
    if (!incomingAxes || typeof incomingAxes !== 'object') return;
    const fingerprint = JSON.stringify(incomingAxes);
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    registerProjectSource({ activeAxes: incomingAxes });
  };
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('globalsUpdated', onGlobals);
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('updateGlobals', onGlobals);
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('setGlobals', onGlobals);

  channel.on<Partial<ProjectSource>>(TOKENS_UPDATED_EVENT, (patch) => {
    registerProjectSource(patch);
  });
}
