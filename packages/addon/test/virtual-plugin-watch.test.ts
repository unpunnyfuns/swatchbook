// The dir watcher must reload when a *new* token file appears in a watched
// directory — the previous implementation froze a basename allow-list at
// server start, so files added later were silently ignored. Drives the real
// fs.watch via configureServer against a temp project.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ViteDevServer } from 'vite';
import { expect, it, vi } from 'vitest';
import { swatchbookTokensPlugin } from '#/virtual/plugin.ts';

function colorDoc(name: string, hex: string): string {
  return JSON.stringify({ color: { $type: 'color', [name]: { $value: hex } } });
}

it('reloads when a new token file is added to a watched directory', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-watch-'));
  mkdirSync(join(cwd, 'tokens'));
  writeFileSync(join(cwd, 'tokens', 'a.json'), colorDoc('a', '#000000'));

  const plugin = swatchbookTokensPlugin({ config: { tokens: ['tokens/**/*.json'] }, cwd });
  await (plugin.buildStart as unknown as () => Promise<void>).call(plugin);

  const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
  const send = vi.fn();
  const server = {
    config: { logger },
    moduleGraph: { getModuleById: () => undefined },
    ws: { send },
  } as unknown as ViteDevServer;
  await (plugin.configureServer as unknown as (s: ViteDevServer) => Promise<void>).call(
    plugin,
    server,
  );

  // A brand-new file in the watched dir — not present when watchers armed.
  writeFileSync(join(cwd, 'tokens', 'b.json'), colorDoc('b', '#ffffff'));

  // fs.watch event + 100ms debounce + reload.
  await vi.waitFor(() => expect(send).toHaveBeenCalled(), { timeout: 2000, interval: 100 });
  const payload = JSON.stringify(send.mock.calls.at(-1)?.[0]);
  expect(payload).toContain('color.b');
});
