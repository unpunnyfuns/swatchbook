import type { Project, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';

export interface TailwindIntegrationOptions {
  /**
   * Virtual module ID the addon serves. Storybook users import this
   * string from their preview to receive the rendered `@theme` block.
   * Default: `'virtual:swatchbook/tailwind.css'`.
   */
  virtualId?: string;
  /**
   * Override the auto-derived role map. Keys are Tailwind scale names
   * (`color`, `spacing`, `radius`, `shadow`, `font`); values are ordered
   * `[tailwindEntryName, dtcgPath]` pairs. Supplied map **replaces** the
   * derived one — pass your own to pin exact entries, restrict the
   * universe of emitted utilities, or name scales the derivation doesn't
   * cover.
   *
   * Omit to let the integration derive a role map from the project at
   * render time: every `color` token lands under the `color` scale,
   * every `dimension` token under `spacing` / `radius` based on its
   * path prefix, every `shadow` under `shadow`, every `fontFamily` under
   * `font`. Works for any DTCG project without a configuration step.
   */
  roles?: Readonly<Record<string, readonly (readonly [string, string])[]>>;
}

type RoleMap = Readonly<Record<string, readonly (readonly [string, string])[]>>;

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
  const userRoles = options.roles;

  return {
    name: 'tailwind',
    virtualModule: {
      virtualId,
      render: (project) => renderTailwindTheme(project, userRoles ?? deriveRoles(project)),
      // Tailwind's `@theme` block is a global stylesheet — exactly the
      // kind of payload the addon should auto-inject into the preview,
      // so consumers don't hand-write a second `import` line after
      // plugging the integration in.
      autoInject: true,
    },
  };
}

function renderTailwindTheme(project: Project, roles: RoleMap): string {
  const prefix = project.config.cssVarPrefix ?? '';
  const sourcePrefix = prefix ? `${prefix}-` : '';
  const scopePrefix = prefix ? `${prefix}-` : '';

  const entries: string[] = [];
  for (const [scale, names] of Object.entries(roles)) {
    if (names.length === 0) continue;
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
 * Walk the project's default-theme token graph and classify each entry
 * into a Tailwind scale based on its `$type` + path. Returns a role map
 * shaped the same as a user-supplied `roles` option.
 *
 * Scale assignment:
 * - `$type: 'color'`     → `color`, role = path minus `color.` prefix
 * - `$type: 'dimension'` → `spacing` (default), `radius` (if path starts with
 *   `radius.`, `borderRadius.`, or `border-radius.`), or nothing (skipped)
 *   for dimensions that look like font sizes (`font.size.*`, `text.*`), since
 *   Tailwind's `--text-*` scale needs size + line-height pairs this preview
 *   integration doesn't synthesize
 * - `$type: 'shadow'`      → `shadow`, role = path minus `shadow.` prefix
 * - `$type: 'fontFamily'`  → `font`, role = path minus `font.` / `font.family.` / `fontFamily.` prefix
 *
 * Other `$type`s are skipped — they don't have a natural single-value
 * Tailwind utility and would produce broken output.
 */
function deriveRoles(project: Project): RoleMap {
  const scales: Record<string, [string, string][]> = {
    color: [],
    spacing: [],
    radius: [],
    shadow: [],
    font: [],
  };

  for (const [path, token] of Object.entries(project.graph)) {
    const classification = classify(path, token.$type);
    if (!classification) continue;
    const { scale, role } = classification;
    if (!role) continue;
    scales[scale]?.push([role, path]);
  }

  const out: Record<string, readonly (readonly [string, string])[]> = {};
  for (const [scale, entries] of Object.entries(scales)) {
    if (entries.length === 0) continue;
    entries.sort(([a], [b]) => a.localeCompare(b, 'en'));
    out[scale] = entries;
  }
  return out;
}

const SPACING_ROOTS = ['space', 'spacing'] as const;
const RADIUS_ROOTS = ['radius', 'borderRadius', 'border-radius'] as const;
const FONT_PREFIXES = ['font.family.', 'fontFamily.', 'font.'] as const;

function classify(path: string, type: string | undefined): { scale: string; role: string } | null {
  switch (type) {
    case 'color':
      return { scale: 'color', role: stripPrefix(path, 'color.') };
    case 'shadow':
      return { scale: 'shadow', role: stripPrefix(path, 'shadow.') };
    case 'fontFamily': {
      for (const prefix of FONT_PREFIXES) {
        if (path.startsWith(prefix)) {
          return { scale: 'font', role: pathToRole(path.slice(prefix.length)) };
        }
      }
      return { scale: 'font', role: pathToRole(path) };
    }
    case 'dimension': {
      const head = path.split('.', 1)[0] ?? '';
      if ((RADIUS_ROOTS as readonly string[]).includes(head)) {
        return { scale: 'radius', role: pathToRole(path.slice(head.length + 1)) };
      }
      if ((SPACING_ROOTS as readonly string[]).includes(head)) {
        return { scale: 'spacing', role: pathToRole(path.slice(head.length + 1)) };
      }
      // Font-size-ish dimensions are skipped — Tailwind's `--text-*` entries
      // expect a size+line-height pair that this integration doesn't build.
      if (head === 'font' && /size|text/i.test(path)) return null;
      if (head === 'text') return null;
      // Default-bucket any other dimension under spacing — safer than guessing.
      return { scale: 'spacing', role: pathToRole(path) };
    }
    default:
      return null;
  }
}

function stripPrefix(path: string, prefix: string): string {
  return pathToRole(path.startsWith(prefix) ? path.slice(prefix.length) : path);
}

function pathToRole(remainder: string): string {
  return remainder.replaceAll('.', '-');
}
