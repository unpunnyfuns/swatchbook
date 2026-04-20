import { beforeAll, expect, it } from 'vitest';
import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { CHROME_PATHS, validateChrome } from '#/chrome';
import { projectCss } from '#/emit';
import { loadProject } from '#/load';
import type { Project, TokenMap } from '#/types';

const fixtureCwd = dirname(tokensDir);

const tokensFixture: TokenMap = {
  'color.ref.blue.500': {} as TokenMap[string],
  'color.ref.neutral.0': {} as TokenMap[string],
};

it('validateChrome returns empty when input is undefined', () => {
  const { entries, diagnostics } = validateChrome(undefined, { Light: tokensFixture });
  expect(entries).toEqual({});
  expect(diagnostics).toEqual([]);
});

it('validateChrome keeps entries whose source is a known chrome path and target resolves', () => {
  const { entries, diagnostics } = validateChrome(
    { 'color.surface.default': 'color.ref.blue.500' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({ 'color.surface.default': 'color.ref.blue.500' });
  expect(diagnostics).toEqual([]);
});

it('validateChrome drops unknown source keys with a warn diagnostic', () => {
  const { entries, diagnostics } = validateChrome(
    { 'color.fake.path': 'color.ref.blue.500' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({});
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.group).toBe('swatchbook/chrome');
  expect(diagnostics[0]?.message).toMatch(/unknown source path "color\.fake\.path"/);
});

it('validateChrome drops entries whose target resolves in no theme', () => {
  const { entries, diagnostics } = validateChrome(
    { 'color.surface.default': 'color.nowhere' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({});
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.message).toMatch(/"color\.nowhere" is not a token/);
});

it('CHROME_PATHS covers the ten chrome variables blocks read', () => {
  expect(CHROME_PATHS).toHaveLength(10);
  expect(CHROME_PATHS).toContain('color.surface.default');
  expect(CHROME_PATHS).toContain('typography.body.font-family');
});

let project: Project;

beforeAll(async () => {
  project = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      cssVarPrefix: 'sb',
      chrome: {
        'color.surface.default': 'color.ref.blue.500',
        'color.fake.path': 'color.ref.blue.500',
      },
    },
    fixtureCwd,
  );
}, 30_000);

it('loadProject stores validated chrome entries on the project', () => {
  expect(project.chrome).toEqual({
    'color.surface.default': 'color.ref.blue.500',
  });
});

it('loadProject surfaces a chrome diagnostic for the dropped entry', () => {
  const chromeDiags = project.diagnostics.filter((d) => d.group === 'swatchbook/chrome');
  expect(chromeDiags).toHaveLength(1);
  expect(chromeDiags[0]?.message).toMatch(/unknown source path "color\.fake\.path"/);
});

it('projectCss emits the chrome alias using the fixed --swatchbook- namespace', () => {
  const css = projectCss(project);
  const rootBlocks = css.split('\n\n').filter((b) => b.startsWith(':root {'));
  const aliasBlock = rootBlocks.find((b) =>
    b.includes('--swatchbook-color-surface-default: var(--sb-color-ref-blue-500)'),
  );
  expect(aliasBlock).toBeDefined();
});

it('projectCss never prefixes chrome source vars with the project prefix', () => {
  const css = projectCss(project);
  expect(css).not.toMatch(/--sb-swatchbook-/);
  expect(css).not.toMatch(/--sb-color-surface-default:\s*var\(/);
});

it('projectCss skips chrome emission when no valid entries survive', async () => {
  const p = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      cssVarPrefix: 'sb',
    },
    fixtureCwd,
  );
  const css = projectCss(p);
  expect(css).not.toMatch(/--swatchbook-color-surface-default:/);
});
