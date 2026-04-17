import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { projectCss } from '#/emit';
import { loadProject } from '#/load';
import type { Project } from '#/types';

const fixtureCwd = dirname(tokensDir);

async function loadWithPrefix(prefix: string | undefined): Promise<Project> {
  return loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: 'Light',
      ...(prefix !== undefined && { cssVarPrefix: prefix }),
    },
    fixtureCwd,
  );
}

describe('projectCss — with sb prefix', () => {
  let project: Project;
  let css: string;

  beforeAll(async () => {
    project = await loadWithPrefix('sb');
    css = projectCss(project);
  }, 30_000);

  it('emits one [data-theme] block per theme', () => {
    for (const theme of project.themes) {
      expect(css).toContain(`[data-theme="${theme.name}"]`);
    }
  });

  it('terminates with a trailing newline', () => {
    expect(css.endsWith('\n')).toBe(true);
  });

  it('applies the prefix to variable names', () => {
    expect(css).toContain('--sb-color-sys-surface-default:');
    expect(css).not.toMatch(/^\s*--color-sys-surface-default:/m);
  });

  it('applies the prefix to aliased var(…) references inside values', () => {
    // cmp.button.bg aliases color.sys.accent.bg; both sides of the reference should carry the prefix
    const line = css.split('\n').find((l) => l.includes('--sb-cmp-button-bg:'));
    expect(line).toBeDefined();
    expect(line).toMatch(/var\(--sb-color-sys-accent-bg\)/);
  });

  it('emits every primitive + composite type covered by the fixture', () => {
    expect(css).toMatch(/--sb-color-ref-blue-500:\s*rgb\(/i);
    expect(css).toMatch(/--sb-size-ref-100:\s*4px/);
    expect(css).toMatch(/--sb-font-ref-family-sans:/);
    expect(css).toMatch(/--sb-font-ref-weight-bold:\s*700/);
    expect(css).toMatch(/--sb-duration-ref-fast:\s*120ms/);
    expect(css).toMatch(/--sb-easing-ref-standard:\s*cubic-bezier\(/);
    expect(css).toMatch(/--sb-typography-sys-body-font-family:/);
    expect(css).toMatch(/--sb-typography-sys-body-font-size:/);
    expect(css).toMatch(/--sb-typography-sys-body-font-weight:/);
    expect(css).toMatch(/--sb-shadow-sys-md/);
    expect(css).toMatch(/--sb-border-sys-default/);
    expect(css).toMatch(/--sb-motion-sys-enter/);
  });

  it('sparse overrides in Dark theme flip the surface but keep size scale identical', () => {
    const lightBlock = extractBlock(css, 'Light');
    const darkBlock = extractBlock(css, 'Dark');
    expect(lightBlock).toBeTruthy();
    expect(darkBlock).toBeTruthy();
    const lightSize = grep(lightBlock, '--sb-size-ref-400:');
    const darkSize = grep(darkBlock, '--sb-size-ref-400:');
    expect(lightSize).toEqual(darkSize);

    const lightSurface = grep(lightBlock, '--sb-color-sys-surface-default:');
    const darkSurface = grep(darkBlock, '--sb-color-sys-surface-default:');
    expect(lightSurface).not.toEqual(darkSurface);
  });
});

describe('projectCss — empty prefix', () => {
  it('omits the leading dash when prefix is empty', async () => {
    const project = await loadWithPrefix('');
    const css = projectCss(project);
    expect(css).toContain('--color-sys-surface-default:');
    expect(css).not.toContain('---color-sys-surface-default:');
  });
});

function extractBlock(css: string, themeName: string): string {
  const start = css.indexOf(`[data-theme="${themeName}"]`);
  if (start < 0) return '';
  const braceStart = css.indexOf('{', start);
  const braceEnd = css.indexOf('\n}', braceStart);
  return css.slice(braceStart + 1, braceEnd);
}

function grep(block: string, needle: string): string | undefined {
  return block.split('\n').find((l) => l.includes(needle))?.trim();
}
