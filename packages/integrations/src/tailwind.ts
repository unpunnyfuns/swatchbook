import type { Project, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';

export interface TailwindIntegrationOptions {
  /**
   * Virtual module ID the addon serves. Storybook users import this
   * string from their preview to receive the rendered `@theme` block.
   * Default: `'virtual:swatchbook/tailwind.css'`.
   */
  virtualId?: string;
  /**
   * Override or extend the default role map. Keys are Tailwind scale
   * names (`color`, `spacing`, `radius`, `shadow`); values are ordered
   * `[tailwindEntryName, dtcgPath]` pairs. Supplied map **replaces**
   * the default — pass your own to customise which roles land in
   * `@theme`. Omit to use the curated default.
   */
  roles?: Readonly<Record<string, readonly (readonly [string, string])[]>>;
}

/**
 * Preview-only Tailwind v4 integration for the swatchbook Storybook
 * addon. Contributes a virtual CSS module whose `@theme` block aliases
 * Tailwind utility scales to the project's DTCG tokens via
 * `var(--<cssVarPrefix>-*)` references, so stories authored with
 * utility classes render correctly inside Storybook and react to the
 * toolbar's axis flips. This is not a replacement for the consumer's
 * production Tailwind build.
 *
 * Every entry is nested under the project's own `cssVarPrefix` so it
 * never collides with Tailwind's shipped scales: with
 * `cssVarPrefix: 'sb'` you get `--color-sb-surface-default`,
 * `--spacing-sb-md`, etc., generating utilities `bg-sb-surface-default`
 * and `p-sb-md` that coexist with `bg-red-500` / `p-4` / `max-w-md`.
 *
 * ```ts
 * // .storybook/main.ts
 * import tailwindIntegration from '@unpunnyfuns/swatchbook-integrations/tailwind';
 *
 * export default defineMain({
 *   addons: [
 *     {
 *       name: '@unpunnyfuns/swatchbook-addon',
 *       options: {
 *         configPath: '../swatchbook.config.ts',
 *         integrations: [tailwindIntegration()],
 *       },
 *     },
 *   ],
 * });
 *
 * // .storybook/preview.tsx
 * import 'virtual:swatchbook/tailwind.css';
 * ```
 */
export default function tailwindIntegration(
  options: TailwindIntegrationOptions = {},
): SwatchbookIntegration {
  const virtualId = options.virtualId ?? 'virtual:swatchbook/tailwind.css';
  const roles = options.roles ?? DEFAULT_ROLES;

  return {
    name: 'tailwind',
    virtualModule: {
      virtualId,
      render: (project) => renderTailwindTheme(project, roles),
      // Tailwind's `@theme` block is a global stylesheet — exactly the
      // kind of payload the addon should auto-inject into the preview,
      // so consumers don't hand-write a second `import` line after
      // plugging the integration in.
      autoInject: true,
    },
  };
}

function renderTailwindTheme(
  project: Project,
  roles: Readonly<Record<string, readonly (readonly [string, string])[]>>,
): string {
  const prefix = project.config.cssVarPrefix ?? '';
  const sourcePrefix = prefix ? `${prefix}-` : '';
  const scopePrefix = prefix ? `${prefix}-` : '';

  const entries: string[] = [];
  for (const [scale, names] of Object.entries(roles)) {
    entries.push(`  /* ${scale} */`);
    for (const [themeKey, sourcePath] of names) {
      const sourceVar = `--${sourcePrefix}${sourcePath.replaceAll('.', '-')}`;
      const themeVar = `--${scale}-${scopePrefix}${themeKey}`;
      entries.push(`  ${themeVar}: var(${sourceVar});`);
    }
    entries.push('');
  }
  while (entries.length > 0 && entries.at(-1) === '') entries.pop();

  return [
    '/* Synthesized by @unpunnyfuns/swatchbook-integrations/tailwind for preview.',
    ' * Served via `virtual:swatchbook/tailwind.css` — rebuilt on token changes. */',
    "@import 'tailwindcss';",
    '',
    '@theme {',
    ...entries,
    '}',
    '',
  ].join('\n');
}

/**
 * Example role map derived from the reference fixture's semantic paths.
 * Consumers with divergent paths pass their own map through
 * `tailwindIntegration({ roles })`. The default is not a general-purpose
 * schema — it's the concrete shape that makes the addon's own Storybook
 * run usefully, and a convenient starting point to copy and edit.
 */
const DEFAULT_ROLES: Readonly<Record<string, readonly (readonly [string, string])[]>> = {
  color: [
    ['surface-default', 'color.surface.default'],
    ['surface-muted', 'color.surface.muted'],
    ['surface-raised', 'color.surface.raised'],
    ['surface-subtle', 'color.surface.subtle'],
    ['surface-inverse', 'color.surface.inverse'],
    ['text-default', 'color.text.default'],
    ['text-muted', 'color.text.muted'],
    ['text-subtle', 'color.text.subtle'],
    ['text-inverse', 'color.text.inverse'],
    ['text-accent', 'color.text.accent'],
    ['accent-bg', 'color.accent.bg'],
    ['accent-bg-hover', 'color.accent.bg-hover'],
    ['accent-fg', 'color.accent.fg'],
    ['border-default', 'color.border.default'],
    ['border-strong', 'color.border.strong'],
    ['border-focus', 'color.border.focus'],
    ['status-danger-bg', 'color.status.danger-bg'],
    ['status-danger-fg', 'color.status.danger-fg'],
    ['status-success-bg', 'color.status.success-bg'],
    ['status-success-fg', 'color.status.success-fg'],
    ['status-warning-bg', 'color.status.warning-bg'],
    ['status-warning-fg', 'color.status.warning-fg'],
  ],
  spacing: [
    ['none', 'space.none'],
    ['2xs', 'space.2xs'],
    ['xs', 'space.xs'],
    ['sm', 'space.sm'],
    ['md', 'space.md'],
    ['lg', 'space.lg'],
    ['xl', 'space.xl'],
    ['2xl', 'space.2xl'],
    ['3xl', 'space.3xl'],
  ],
  radius: [
    ['sm', 'radius.sm'],
    ['md', 'radius.md'],
    ['lg', 'radius.lg'],
    ['xl', 'radius.xl'],
    ['pill', 'radius.pill'],
  ],
  shadow: [
    ['sm', 'shadow.sm'],
    ['md', 'shadow.md'],
    ['lg', 'shadow.lg'],
  ],
};
