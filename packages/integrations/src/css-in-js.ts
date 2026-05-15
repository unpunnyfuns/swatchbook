import type { Project, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';

export interface CssInJsIntegrationOptions {
  /**
   * Virtual module ID the addon serves. Default:
   * `'virtual:swatchbook/theme'`. Consumers import this string from
   * their preview (or stories) to receive a typed accessor object whose
   * leaves are `var(--<cssVarPrefix>-*)` references.
   */
  virtualId?: string;
}

/**
 * Preview-only CSS-in-JS integration for swatchbook's Storybook addon.
 * Contributes a virtual JS module that exports a nested accessor
 * mirroring the project's token tree — every leaf is a `var(...)`
 * reference carrying the project's `cssVarPrefix`. Lets stories import
 * `{ theme }` the same way their production components do, but backed
 * by swatchbook's runtime-switchable cascade rather than a concrete
 * theme object. Not a replacement for the consumer's production
 * CSS-in-JS emit step.
 *
 * Swatchbook's toolbar still does the flipping via compound `data-*`
 * attributes; the accessor's values don't change across tuples because
 * the cascade resolves the var.
 *
 * ```ts
 * // .storybook/main.ts
 * import cssInJsIntegration from '@unpunnyfuns/swatchbook-integrations/css-in-js';
 *
 * export default defineMain({
 *   addons: [
 *     {
 *       name: '@unpunnyfuns/swatchbook-addon',
 *       options: {
 *         configPath: '../swatchbook.config.ts',
 *         integrations: [cssInJsIntegration()],
 *       },
 *     },
 *   ],
 * });
 *
 * // Any story / component
 * import { theme, color, space } from 'virtual:swatchbook/theme';
 *
 * // styled-components / emotion
 * <ThemeProvider theme={theme}>...</ThemeProvider>
 *
 * // direct ref
 * const bg = color.surface.default; // -> "var(--sb-color-surface-default)"
 * ```
 *
 * The theme object is stable across tuples — consumers wire it into a
 * provider *once*; runtime switching happens entirely through CSS cascade
 * when swatchbook's toolbar toggles `data-<prefix>-<axis>` on `<html>`.
 * Consumers who need resolved-value permutations (MUI `createTheme`, Vuetify
 * factories) are not covered — that's a different emission story.
 */
export default function cssInJsIntegration(
  options: CssInJsIntegrationOptions = {},
): SwatchbookIntegration {
  const virtualId = options.virtualId ?? 'virtual:swatchbook/theme';
  return {
    name: 'css-in-js',
    virtualModule: {
      virtualId,
      render: renderTheme,
    },
  };
}

function renderTheme(project: Project): string {
  const prefix = project.config.cssVarPrefix ?? '';
  const varPrefix = prefix ? `${prefix}-` : '';
  const paths = collectPaths(project);
  const tree = buildTree(paths, (path) => `var(--${varPrefix}${path.replaceAll('.', '-')})`);

  const groupNames = Object.keys(tree).toSorted();
  const groupExports = groupNames.map(
    (name) => `export const ${safeIdent(name)} = ${renderNode(tree[name]!, 1)};`,
  );
  const aggregate = `export const theme = { ${groupNames.map(safeIdent).join(', ')} };`;

  return [
    '/* Synthesized by @unpunnyfuns/swatchbook-integrations/css-in-js for preview.',
    ' * Served via `virtual:swatchbook/theme` — rebuilt on token changes. */',
    '',
    ...groupExports,
    '',
    aggregate,
    '',
  ].join('\n');
}

function collectPaths(project: Project): string[] {
  const all = new Set<string>();
  for (const theme of project.permutations) {
    const tokens = project.permutationsResolved[theme.name] ?? {};
    for (const path of Object.keys(tokens)) all.add(path);
  }
  return [...all].toSorted();
}

type TreeNode = { [key: string]: TreeNode | string };

/**
 * Build a nested object tree from a sorted path list. Leaves hold the
 * emitted value from `leafFor(path)`. Leaf/branch collisions (a shorter
 * path emits a leaf while a longer path wants to nest under the same
 * key) are resolved by keeping the leaf — realistic DTCG trees don't
 * hit this, but the explicit behaviour beats silent UB.
 */
function buildTree(sortedPaths: readonly string[], leafFor: (path: string) => string): TreeNode {
  const root: TreeNode = {};
  for (const path of sortedPaths) {
    const segments = path.split('.');
    let node = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      const existing = node[seg];
      if (typeof existing === 'string') break;
      if (existing === undefined) {
        const next: TreeNode = {};
        node[seg] = next;
        node = next;
      } else {
        node = existing;
      }
    }
    const leafKey = segments.at(-1)!;
    if (node[leafKey] === undefined) node[leafKey] = leafFor(path);
  }
  return root;
}

function renderNode(node: TreeNode | string, depth: number): string {
  if (typeof node === 'string') return JSON.stringify(node);
  const indent = '  '.repeat(depth);
  const closing = '  '.repeat(depth - 1);
  const entries = Object.keys(node)
    .toSorted()
    .map((key) => `${indent}${safeKey(key)}: ${renderNode(node[key]!, depth + 1)}`);
  return `{\n${entries.join(',\n')},\n${closing}}`;
}

/**
 * Bare identifier (or canonical non-leading-zero integer literal) if
 * safe; quoted string otherwise. Leading-zero numerics like `"050"`
 * stay quoted because bare `050` is an octal under strict mode.
 */
function safeKey(key: string): string {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return key;
  if (/^(0|[1-9]\d*)$/.test(key)) return key;
  return JSON.stringify(key);
}

/** Top-level exports must be valid JS identifiers. */
function safeIdent(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `_${key.replaceAll(/[^\w$]/g, '_')}`;
}
