import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const sbStatic = resolve(docsRoot, '../storybook/storybook-static');
const outDir = resolve(docsRoot, 'static/media');
const PORT = 6017;
const base = `http://127.0.0.1:${PORT}`;

// Still targets: matched against story `title + ' ' + name` (substring).
// Confirmed against storybook-static/index.json:
//   blocks-tokentable--all     → title "Blocks/TokenTable",  name "All"
//   blocks-tokennavigator--default → title "Blocks/TokenNavigator", name "Default"
const STILLS = [
  { match: 'Blocks/TokenTable All', file: 'block.png' },
  { match: 'Blocks/TokenNavigator Default', file: 'navigator.png' },
];

// Clip: load a TokenTable story in the full manager, open the toolbar,
// flip axes to show visible theme changes.
// Real axis contexts from swatchbook.config.ts:
//   mode: ['Light', 'Dark'], brand: ['Default', 'Brand A'], contrast: ['Normal', 'High']
// Pill aria-labels follow "<context> (<axis>)" — e.g. "Dark (mode)".
const CLIP = { match: 'Blocks/TokenTable All', flips: ['Dark (mode)', 'Brand A (brand)'] };

function serve() {
  const proc = spawn('npx', ['sirv', sbStatic, '--port', String(PORT), '--quiet'], {
    cwd: docsRoot,
    stdio: 'inherit',
  });
  return proc;
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${base}/index.json`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('storybook-static did not come up');
}

function findStoryId(index, matcher) {
  const entries = Object.values(index.entries ?? index.stories ?? {});
  const hit = entries.find(
    (e) => e.type !== 'docs' && (e.title + ' ' + (e.name ?? '')).includes(matcher),
  );
  if (!hit) throw new Error(`No story matching "${matcher}"`);
  return hit.id;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = serve();
  try {
    await waitForServer();
    const index = JSON.parse(readFileSync(resolve(sbStatic, 'index.json'), 'utf8'));
    const browser = await chromium.launch();

    // Stills: load each story in the iframe and wait for it to render.
    // Storybook signals render completion via a `data-sb-story-id` attribute
    // on the `#storybook-root` element once the story mounts. We also wait
    // for the token table's table element to appear before screenshotting.
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    for (const s of STILLS) {
      const id = findStoryId(index, s.match);
      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      // Wait for Storybook to mark the story as rendered.
      await page
        .locator('#storybook-root[data-sb-story-id]')
        .waitFor({ state: 'attached', timeout: 15000 })
        .catch(() => null);
      // Additional wait for async rendering (e.g. token resolution).
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(outDir, s.file) });
      console.log('captured', s.file);
    }
    await page.close();

    // toolbar.png: full manager showing the story + toolbar as the webm poster.
    const toolbarPage = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    const blockId = findStoryId(index, CLIP.match);
    await toolbarPage.goto(`${base}/?path=/story/${blockId}`, { waitUntil: 'domcontentloaded' });
    // Wait for the Storybook manager shell to render (sidebar + toolbar).
    await toolbarPage
      .locator('[aria-label^="Swatchbook"]')
      .waitFor({ state: 'attached', timeout: 20000 })
      .catch(() => null);
    await toolbarPage.waitForTimeout(1500);
    await toolbarPage.screenshot({ path: join(outDir, 'toolbar.png') });
    console.log('captured toolbar.png');
    await toolbarPage.close();

    // Clip: full manager, open the toolbar popover, flip axes, record video.
    const ctx = await browser.newContext({
      viewport: { width: 1000, height: 700 },
      recordVideo: { dir: outDir, size: { width: 1000, height: 700 } },
    });
    const m = await ctx.newPage();
    const clipId = findStoryId(index, CLIP.match);
    await m.goto(`${base}/?path=/story/${clipId}`, { waitUntil: 'domcontentloaded' });
    // Wait for the toolbar button to be present and axes to load.
    // The label is "Swatchbook · <values>" once the INIT_EVENT fires,
    // or "Swatchbook theme (loading…)" before. Wait for the non-loading state.
    await m
      .locator('[aria-label^="Swatchbook ·"]')
      .waitFor({ state: 'attached', timeout: 20000 });
    await m.waitForTimeout(800);
    // Open the toolbar popover.
    const toolBtn = m.locator('[aria-label^="Swatchbook ·"]').first();
    await toolBtn.click();
    await m.waitForTimeout(600);
    // Click each axis flip in the switcher popover.
    for (const flip of CLIP.flips) {
      const pill = m
        .locator(`[data-testid="swatchbook-switcher"] button[aria-label="${flip}"]`)
        .first();
      await pill.click();
      await m.waitForTimeout(900);
    }
    await m.waitForTimeout(600);
    const video = m.video();
    await ctx.close(); // finalizes the webm
    if (video) {
      const path = await video.path();
      const { renameSync } = await import('node:fs');
      renameSync(path, join(outDir, 'toolbar-flip.webm'));
      console.log('captured toolbar-flip.webm');
    }
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
