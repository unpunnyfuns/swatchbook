import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const sbStatic = resolve(docsRoot, '../storybook/storybook-static');
const outDir = resolve(docsRoot, 'public/media');
const PORT = 6017;
const base = `http://127.0.0.1:${PORT}`;

// One viewport for every shot so all previews share an aspect ratio. Compact
// so doc-block tables read densely; 2x deviceScaleFactor keeps them crisp when
// enlarged in the frontpage lightbox.
const VIEWPORT = { width: 900, height: 600 };
const SCALE = 2;

// Matched against story `title + ' ' + name`.
const STILLS = [
  { match: 'Blocks/TokenTable Colors Only', file: 'block.png' },
  { match: 'Blocks/TokenNavigator Default', file: 'navigator.png' },
];

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

// Minimal static server for storybook-static. Dependency-free on purpose: the
// previous `npx sirv` could block on an install prompt in CI. Manager routes
// (`/?path=…`) strip the query to `/` → index.html; everything else is a real
// file (iframe.html, index.json, assets).
function serve() {
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      const data = await readFile(join(sbStatic, safe));
      res.writeHead(200, { 'content-type': MIME[extname(safe)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  server.listen(PORT, '127.0.0.1');
  return server;
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
  let browser;
  try {
    await waitForServer();
    const index = JSON.parse(readFileSync(resolve(sbStatic, 'index.json'), 'utf8'));
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
    for (const s of STILLS) {
      const id = findStoryId(index, s.match);
      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      // Storybook marks the story rendered with a data-sb-story-id attribute;
      // then wait for async token resolution to settle before the shot.
      await page
        .locator('#storybook-root[data-sb-story-id]')
        .waitFor({ state: 'attached', timeout: 15000 })
        .catch(() => null);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(outDir, s.file) });
      console.log('captured', s.file);
    }
    await page.close();

    // switcher.png: open the toolbar control in the full manager and screenshot
    // the viewport — the toolbar button + open popover shown in context, at the
    // same VIEWPORT as the stills so every preview shares an aspect ratio.
    // Selectors from packages/addon/src/manager.tsx: tool button aria-label
    // begins "Swatchbook ·"; the popover body carries
    // data-testid="swatchbook-switcher".
    const mgr = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
    const storyId = findStoryId(index, 'Blocks/TokenTable Colors Only');
    await mgr.goto(`${base}/?path=/story/${storyId}`, { waitUntil: 'domcontentloaded' });
    const toolBtn = mgr.locator('[aria-label^="Swatchbook ·"]').first();
    await toolBtn.waitFor({ state: 'visible', timeout: 20000 });
    await mgr.waitForTimeout(600);
    await toolBtn.click();
    await mgr
      .locator('[data-testid="swatchbook-switcher"]')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await mgr.waitForTimeout(400);
    await mgr.screenshot({ path: join(outDir, 'switcher.png') });
    console.log('captured switcher.png');
    await mgr.close();
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
