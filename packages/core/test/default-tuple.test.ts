import { describe, expect, it } from 'vitest';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';
import { fixtureCwd } from './_helpers';

describe('Config.default tuple resolution', () => {
  it('sets the starting tuple when every axis is specified', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark', brand: 'Brand A', contrast: 'High' },
      },
      fixtureCwd,
    );
    expect(project.graph).toBe(project.themesResolved['Dark · Brand A · High']);
  });

  it("fills omitted axes from each axis's own default", async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark' },
      },
      fixtureCwd,
    );
    expect(project.graph).toBe(project.themesResolved['Dark · Default · Normal']);
  });

  it('resolves to the all-axis-defaults tuple when default is absent', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], resolver: resolverPath },
      fixtureCwd,
    );
    expect(project.graph).toBe(project.themesResolved['Light · Default · Normal']);
  });

  it('drops unknown axis keys with a warn diagnostic and falls back to the axis default', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark', notAnAxis: 'Whatever' },
      },
      fixtureCwd,
    );
    const warn = project.diagnostics.find(
      (d) => d.group === 'swatchbook/default' && d.message.includes('notAnAxis'),
    );
    expect(warn?.severity).toBe('warn');
    expect(project.graph).toBe(project.themesResolved['Dark · Default · Normal']);
  });

  it('drops invalid context values with a warn diagnostic and falls back to the axis default', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'NopeMode' },
      },
      fixtureCwd,
    );
    const warn = project.diagnostics.find(
      (d) => d.group === 'swatchbook/default' && d.message.includes('NopeMode'),
    );
    expect(warn?.severity).toBe('warn');
    expect(project.graph).toBe(project.themesResolved['Light · Default · Normal']);
  });
});
