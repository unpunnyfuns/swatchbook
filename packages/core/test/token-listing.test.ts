import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import { fixtureCwd, loadWithPrefix } from './_helpers';

describe('Token Listing integration', () => {
  it('populates project.listing for resolver-backed projects', async () => {
    const project = await loadWithPrefix('sb');
    const paths = Object.keys(project.listing);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('records the CSS var name under names.css using the project prefix', async () => {
    const project = await loadWithPrefix('sb');
    const entry = project.listing['color.accent.bg'];
    expect(entry).toBeDefined();
    expect(entry?.$extensions['app.terrazzo.listing'].names['css']).toBe('--sb-color-accent-bg');
  });

  it('respects an empty prefix — no leading dash after `--`', async () => {
    const project = await loadWithPrefix('');
    const entry = project.listing['color.accent.bg'];
    expect(entry?.$extensions['app.terrazzo.listing'].names['css']).toBe('--color-accent-bg');
  });

  it('includes source.loc linking back to the authoring file', async () => {
    const project = await loadWithPrefix('sb');
    const entry = project.listing['color.accent.bg'];
    const source = entry?.$extensions['app.terrazzo.listing'].source;
    expect(source).toBeDefined();
    expect(source?.resource).toMatch(/resolver\.json$/);
    expect(source?.loc?.start.line).toBeGreaterThan(0);
  });

  it('includes a CSS-ready previewValue for each color token', async () => {
    const project = await loadWithPrefix('sb');
    const entry = project.listing['color.palette.blue.500'];
    const preview = entry?.$extensions['app.terrazzo.listing'].previewValue;
    expect(typeof preview).toBe('string');
    expect(preview).toMatch(/^#[0-9a-fA-F]{6,8}$/);
  });

  it('surfaces a swatchbook/listing warn diagnostic when a terrazzoPlugin throws', async () => {
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        cssVarPrefix: 'sb',
        terrazzoPlugins: [
          {
            name: 'test/throws',
            transform() {
              throw new Error('plugin asplode');
            },
          },
        ],
      },
      fixtureCwd,
    );
    expect(Object.keys(project.listing)).toHaveLength(0);
    const listingDiagnostics = project.diagnostics.filter(
      (d) => d.group === 'swatchbook/listing',
    );
    expect(listingDiagnostics).toHaveLength(1);
    expect(listingDiagnostics[0]?.severity).toBe('warn');
    expect(listingDiagnostics[0]?.message).toContain('plugin asplode');
  });
});
