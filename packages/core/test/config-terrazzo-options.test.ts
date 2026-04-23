import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';

const fixtureCwd = dirname(tokensDir);

describe('Config terrazzo options plumbing', () => {
  it('forwards cssOptions to the internal plugin-css instance', async () => {
    // legacyHex flips oklch/p3-ish colors to sRGB hex fallbacks.
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        cssVarPrefix: 'sb',
        cssOptions: { legacyHex: true },
      },
      fixtureCwd,
    );
    // Smoke test: listing populates, names still correct, no crash from the
    // extra plugin option surface. Behavioral effect of legacyHex is a
    // plugin-css concern we don't re-verify here.
    const entry = project.listing['color.accent.bg'];
    expect(entry?.$extensions['app.terrazzo.listing'].names['css']).toBe('--sb-color-accent-bg');
  });

  it('forwards listingOptions.platforms to plugin-token-listing', async () => {
    // Register an extra platform whose naming function just tags paths with
    // a marker — no real plugin needed, function is the whole platform.
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        cssVarPrefix: 'sb',
        listingOptions: {
          platforms: {
            css: { name: '@terrazzo/plugin-css' },
            figma: { name: ({ token }) => `figma/${token.id.replaceAll('.', '/')}` },
          },
        },
      },
      fixtureCwd,
    );
    const entry = project.listing['color.accent.bg'];
    const names = entry?.$extensions['app.terrazzo.listing'].names;
    expect(names?.['css']).toBe('--sb-color-accent-bg');
    expect(names?.['figma']).toBe('figma/color/accent/bg');
  });

  it('runs terrazzoPlugins alongside the internal plugin-css', async () => {
    // Give a tiny passthrough plugin that records being called. Its
    // presence in the build is what matters — listing shouldn't crash.
    const calls: string[] = [];
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        cssVarPrefix: 'sb',
        terrazzoPlugins: [
          {
            name: 'test/passthrough',
            transform() {
              calls.push('transform');
            },
          },
        ],
      },
      fixtureCwd,
    );
    expect(calls.length).toBeGreaterThan(0);
    const entry = project.listing['color.accent.bg'];
    expect(entry).toBeDefined();
  });
});
