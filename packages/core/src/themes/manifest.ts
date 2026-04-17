import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve as resolvePath } from 'node:path';
import type { Theme, ThemeConfig, TokenMap } from '#/types';
import type { BufferedLogger } from '#/diagnostics';
import { loadLayeredThemes } from '#/themes/layered';

interface ManifestEntry {
  name: string;
  selectedTokenSets: Record<string, 'enabled' | 'source' | 'disabled'>;
}

interface ManifestFile {
  $themes: ManifestEntry[];
}

/**
 * Realize themes from a Tokens Studio `$themes` manifest.
 *
 * Each manifest entry is converted into an explicit layered theme, then
 * handed off to `loadLayeredThemes`. Files marked `enabled` or `source`
 * are included as layers in declaration order; `disabled` entries are
 * skipped. The `enabled` / `source` distinction doesn't affect token
 * resolution — it matters at emit time and is tracked separately by
 * the emitter (which sees the manifest via the project config).
 */
export async function loadManifestThemes(
  manifestPath: string,
  cwd: string,
  logger: BufferedLogger,
  explicitDefault?: string,
): Promise<{
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
  sourceOnlyFiles: Set<string>;
}> {
  const absolute = isAbsolute(manifestPath) ? manifestPath : resolvePath(cwd, manifestPath);
  const raw = await readFile(absolute, 'utf8');
  const manifest = JSON.parse(raw) as ManifestFile;

  if (!Array.isArray(manifest.$themes) || manifest.$themes.length === 0) {
    throw new Error(`swatchbook: manifest at ${absolute} has no \`$themes\` entries.`);
  }

  const manifestDir = dirname(absolute);
  const sourceOnlyFiles = new Set<string>();

  const themeConfigs: ThemeConfig[] = manifest.$themes.map((entry) => {
    const layers: string[] = [];
    for (const [key, state] of Object.entries(entry.selectedTokenSets)) {
      if (state === 'disabled') continue;
      const layerPath = resolveManifestLayer(key, manifestDir);
      layers.push(layerPath);
      if (state === 'source') sourceOnlyFiles.add(layerPath);
    }
    return { name: entry.name, layers };
  });

  const layered = await loadLayeredThemes(themeConfigs, cwd, logger, explicitDefault);
  return { ...layered, sourceOnlyFiles };
}

/**
 * Tokens Studio keys are file stems without the `.json` extension
 * (e.g. `sys/color` → `sys/color.json`). Resolve relative to the
 * manifest's directory.
 */
function resolveManifestLayer(key: string, manifestDir: string): string {
  const withExt = key.endsWith('.json') ? key : `${key}.json`;
  return isAbsolute(withExt) ? withExt : resolvePath(manifestDir, withExt);
}
