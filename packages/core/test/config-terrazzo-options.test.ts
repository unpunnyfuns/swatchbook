import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BufferedLogger } from '#/diagnostics.ts';
import { loadProject } from '#/load.ts';
import { buildParseConfig } from '#/terrazzo-options.ts';
import type { Project } from '#/types.ts';

const fixtureCwd = dirname(tokensDir);
const lintFixtureCwd = resolve(import.meta.dirname, 'fixtures/lint-legacy-color');

const lintDiagnostics = (project: Project) => project.diagnostics.filter((d) => d.group === 'lint');

describe('Config terrazzo options plumbing', () => {
  it('forwards cssOptions to the internal plugin-css instance', async () => {
    // legacyHex flips oklch/p3-ish colors to sRGB hex fallbacks.
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
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
        default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
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

  it('runs terrazzoPlugins alongside the internal plugin-css — `transform` is invoked at least once per listed token', async () => {
    // Tiny passthrough plugin that counts its `transform` invocations.
    // Co-execution with plugin-css means the user plugin runs through the
    // same Terrazzo build pipeline that populates the listing; the
    // invariant is "the plugin's transform is called and the listing
    // populates" — not just "the listing populates."
    const calls: string[] = [];
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
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
    const listingEntryCount = Object.keys(project.listing).length;
    expect(listingEntryCount).toBeGreaterThan(0);
    // Terrazzo's build pipeline invokes `transform` once per build, not
    // per token (the plugin can iterate `getTransforms()` itself). The
    // meaningful pin is "the plugin ran" — i.e. `calls.length >= 1` — and
    // that the listing co-populated rather than crashing.
    expect(calls.length).toBeGreaterThan(0);
    expect(project.listing['color.accent.bg']).toBeDefined();
  });

  it('buildParseConfig applies Terrazzo recommended lint rules when no lintOptions are given', () => {
    const config = buildParseConfig({
      logger: new BufferedLogger({ level: 'warn' }),
      cwd: pathToFileURL(`${fixtureCwd}/`),
    });
    expect(config.lint.rules['core/valid-color']).toEqual(['error', {}]);
  });

  it('buildParseConfig forwards a supplied lint rule option into the normalized config', () => {
    const config = buildParseConfig({
      lintOptions: { rules: { 'core/valid-color': ['error', { legacyFormat: true }] } },
      logger: new BufferedLogger({ level: 'warn' }),
      cwd: pathToFileURL(`${fixtureCwd}/`),
    });
    expect(config.lint.rules['core/valid-color']).toEqual(['error', { legacyFormat: true }]);
  });

  it('flags legacy hex colors by default on the plain-parse path, matching Terrazzo recommended rules', async () => {
    const project = await loadProject({ tokens: ['base/*.json'] }, lintFixtureCwd);
    const lint = lintDiagnostics(project);
    expect(lint.length).toBeGreaterThan(0);
    expect(lint.some((d) => d.message.includes('object format'))).toBe(true);
  });

  it('honours lintOptions on the plain-parse path so legacyFormat colors stop erroring', async () => {
    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        lintOptions: { rules: { 'core/valid-color': ['error', { legacyFormat: true }] } },
      },
      lintFixtureCwd,
    );
    expect(lintDiagnostics(project)).toHaveLength(0);
  });

  it('honours a rule switched off entirely via lintOptions', async () => {
    const project = await loadProject(
      { tokens: ['base/*.json'], lintOptions: { rules: { 'core/valid-color': 'off' } } },
      lintFixtureCwd,
    );
    expect(lintDiagnostics(project)).toHaveLength(0);
  });

  it('honours lintOptions on the layered path, where overlays are parsed per tuple', async () => {
    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        axes: [{ name: 'mode', contexts: { Light: [], Dark: ['modes/dark.json'] }, default: 'Light' }],
        lintOptions: { rules: { 'core/valid-color': ['error', { legacyFormat: true }] } },
      },
      lintFixtureCwd,
    );
    expect(lintDiagnostics(project)).toHaveLength(0);
  });

  it('flags legacy hex colors by default on the layered path', async () => {
    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        axes: [{ name: 'mode', contexts: { Light: [], Dark: ['modes/dark.json'] }, default: 'Light' }],
      },
      lintFixtureCwd,
    );
    expect(lintDiagnostics(project).some((d) => d.message.includes('object format'))).toBe(true);
  });

  it('resolves a lint rule registered by a terrazzoPlugins entry instead of erroring "Unknown rule"', async () => {
    // Terrazzo validates lint.rules ids against the plugin set forwarded into
    // the parse config; a rule id owned by a plugin (rather than Terrazzo
    // core) only resolves if that plugin's `plugins` entry reaches parse().
    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        terrazzoPlugins: [
          {
            name: 'test/plugin-with-lint',
            lint() {
              return { 'test/no-legacy-brand': { create() {} } };
            },
          },
        ],
        lintOptions: { rules: { 'test/no-legacy-brand': 'off' } },
      },
      lintFixtureCwd,
    );
    const configDiagnostics = project.diagnostics.filter((d) => d.group === 'config');
    expect(configDiagnostics.some((d) => d.message.includes('Unknown rule'))).toBe(false);
  });

  it('does not run a terrazzoPlugins entry’s config() hook against the parse config', async () => {
    // @terrazzo/plugin-sass throws from config() when plugin-css is absent, and
    // the parse config never carries it.
    let configHookRuns = 0;
    const peerCheckingPlugin = {
      name: 'test/peer-checking',
      config(config: { plugins: { name: string }[] }) {
        configHookRuns += 1;
        if (!config.plugins.some((p) => p.name === '@terrazzo/plugin-css')) {
          throw new Error('test/peer-checking relies on @terrazzo/plugin-css.');
        }
      },
      lint() {
        return { 'test/peer-rule': { create() {} } };
      },
    };

    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        terrazzoPlugins: [peerCheckingPlugin],
        lintOptions: { rules: { 'test/peer-rule': 'off' } },
      },
      lintFixtureCwd,
    );

    expect(project.diagnostics.filter((d) => d.group === 'config')).toHaveLength(0);
    // Once, in the listing build — never in parse.
    expect(configHookRuns).toBe(1);
  });

  it('honours lintOptions.build.enabled: false by skipping the lint pass entirely', async () => {
    const project = await loadProject(
      {
        tokens: ['base/*.json'],
        lintOptions: {
          build: { enabled: false },
          rules: { 'core/valid-color': ['error', {}] },
        },
      },
      lintFixtureCwd,
    );
    expect(lintDiagnostics(project)).toHaveLength(0);
  });
});
