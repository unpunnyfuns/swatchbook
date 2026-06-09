// Tests the plugin's reload pass through `plugin.api.reload` — the same
// routine the debounced fs watcher fires. A rejection escaping that
// routine is an unhandled rejection that kills the dev-server process,
// so the contract under test is: reload never rejects, failures log,
// and the previous project keeps serving.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ViteDevServer } from 'vite';
import { expect, it, vi } from 'vitest';
import { RESOLVED_VIRTUAL_MODULE_ID } from '#/constants.ts';
import { swatchbookTokensPlugin } from '#/virtual/plugin.ts';

function tokensJson(hex: string): string {
  return JSON.stringify({ color: { $type: 'color', a: { $value: hex } } });
}

async function setup() {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-reload-'));
  mkdirSync(join(cwd, 'tokens'));
  const tokenFile = join(cwd, 'tokens', 't.json');
  writeFileSync(tokenFile, tokensJson('#000000'));

  const plugin = swatchbookTokensPlugin({ config: { tokens: ['tokens/**/*.json'] }, cwd });
  await (plugin.buildStart as unknown as () => Promise<void>).call(plugin);

  const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
  const server = {
    config: { logger },
    moduleGraph: { getModuleById: () => undefined },
    ws: { send: vi.fn() },
  } as unknown as ViteDevServer;

  const reload = (plugin.api as { reload: (s: ViteDevServer) => Promise<void> }).reload;
  const loadVirtual = (): string =>
    (plugin.load as unknown as (id: string) => string).call(plugin, RESOLVED_VIRTUAL_MODULE_ID);

  return { tokenFile, server, logger, reload, loadVirtual };
}

it('a reload hitting a transient bad save logs the failure and keeps serving the previous tokens', async () => {
  const { tokenFile, server, logger, reload, loadVirtual } = await setup();
  const before = loadVirtual();

  writeFileSync(tokenFile, '{broken');
  await expect(reload(server)).resolves.toBeUndefined();

  expect(logger.error).toHaveBeenCalledTimes(1);
  expect(loadVirtual()).toBe(before);
  expect(server.ws.send).not.toHaveBeenCalled();
});

it('a good save after a failed reload recovers and broadcasts the fresh snapshot', async () => {
  const { tokenFile, server, reload, loadVirtual } = await setup();

  writeFileSync(tokenFile, '{broken');
  await reload(server);

  writeFileSync(tokenFile, tokensJson('#ffffff'));
  await reload(server);

  expect(server.ws.send).toHaveBeenCalledTimes(1);
  expect(loadVirtual()).toContain('ffffff');
});
