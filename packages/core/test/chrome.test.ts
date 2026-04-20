import { beforeAll, expect, it } from 'vitest';
import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { CHROME_ROLES, DEFAULT_CHROME_MAP, validateChrome } from '#/chrome';
import { projectCss } from '#/emit';
import { loadProject } from '#/load';
import type { Project, TokenMap } from '#/types';

const fixtureCwd = dirname(tokensDir);

const tokensFixture: TokenMap = {
  'color.blue.500': {} as TokenMap[string],
  'color.neutral.0': {} as TokenMap[string],
};

it('validateChrome returns empty when input is undefined', () => {
  const { entries, diagnostics } = validateChrome(undefined, { Light: tokensFixture });
  expect(entries).toEqual({});
  expect(diagnostics).toEqual([]);
});

it('validateChrome keeps entries whose role is known and target resolves', () => {
  const { entries, diagnostics } = validateChrome(
    { surfaceDefault: 'color.blue.500' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({ surfaceDefault: 'color.blue.500' });
  expect(diagnostics).toEqual([]);
});

it('validateChrome drops unknown roles with a warn diagnostic', () => {
  const { entries, diagnostics } = validateChrome(
    { bogusRole: 'color.blue.500' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({});
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.group).toBe('swatchbook/chrome');
  expect(diagnostics[0]?.message).toMatch(/unknown role "bogusRole"/);
});

it('validateChrome accepts composite sub-field targets (parent token exists)', () => {
  const composite: TokenMap = { 'typography.body': {} as TokenMap[string] };
  const { entries, diagnostics } = validateChrome(
    { bodyFontFamily: 'typography.body.font-family' },
    { Light: composite },
  );
  expect(entries).toEqual({ bodyFontFamily: 'typography.body.font-family' });
  expect(diagnostics).toEqual([]);
});

it('validateChrome drops entries whose target resolves in no theme', () => {
  const { entries, diagnostics } = validateChrome(
    { surfaceDefault: 'color.nowhere' },
    { Light: tokensFixture },
  );
  expect(entries).toEqual({});
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.message).toMatch(/"color\.nowhere" is not a token/);
});

it('CHROME_ROLES and DEFAULT_CHROME_MAP cover the same ten roles', () => {
  expect(CHROME_ROLES).toHaveLength(10);
  expect(Object.keys(DEFAULT_CHROME_MAP).toSorted()).toEqual([...CHROME_ROLES].toSorted());
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
        surfaceDefault: 'color.blue.500',
        bogusRole: 'color.blue.500',
      },
    },
    fixtureCwd,
  );
}, 30_000);

it('loadProject stores only the validated user-supplied chrome entries', () => {
  expect(project.chrome).toEqual({ surfaceDefault: 'color.blue.500' });
});

it('loadProject surfaces a chrome diagnostic for dropped user entries', () => {
  const chromeDiags = project.diagnostics.filter((d) => d.group === 'swatchbook/chrome');
  expect(chromeDiags).toHaveLength(1);
  expect(chromeDiags[0]?.message).toMatch(/unknown role "bogusRole"/);
});

it('projectCss emits every chrome role — user entry as var, others as literal defaults', () => {
  const css = projectCss(project);
  const rootBlocks = css.split('\n\n').filter((b) => b.startsWith(':root {'));
  const chromeBlock = rootBlocks.find((b) => b.includes('--swatchbook-surface-default:'));
  expect(chromeBlock).toBeDefined();
  expect(chromeBlock).toContain('color-scheme: light dark;');
  expect(chromeBlock).toContain('--swatchbook-surface-default: var(--sb-color-blue-500);');
  expect(chromeBlock).toContain(
    `--swatchbook-accent-bg: ${DEFAULT_CHROME_MAP.accentBg};`,
  );
  expect(chromeBlock).toContain(
    `--swatchbook-body-font-size: ${DEFAULT_CHROME_MAP.bodyFontSize};`,
  );
});

it('projectCss emits all ten roles even when chrome config is absent', async () => {
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
  for (const role of CHROME_ROLES) {
    const varName = `--swatchbook-${role
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')}`;
    expect(css, `chrome var ${varName} must be declared`).toContain(`${varName}:`);
  }
});

it('projectCss never prefixes chrome source vars with the project prefix', () => {
  const css = projectCss(project);
  expect(css).not.toMatch(/--sb-swatchbook-/);
  expect(css).not.toMatch(/--sb-surface-default:\s*var\(/);
});
