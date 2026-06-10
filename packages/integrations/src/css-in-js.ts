import type { Project, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';
import { cssVarName } from '@unpunnyfuns/swatchbook-core/css-var';
import { listPaths } from '@unpunnyfuns/swatchbook-core/graph';

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
 * Contributes a virtual JS module exporting a nested accessor that mirrors
 * the project's token tree, every leaf a `var(--<cssVarPrefix>-*)` reference.
 * Stories import `{ theme }` the way their production components do, but
 * backed by swatchbook's runtime-switchable cascade rather than a concrete
 * theme object.
 *
 * The accessor is stable across tuples: its values are `var(...)` refs, so
 * the toolbar's `data-*` axis flips repaint through the cascade without
 * rebuilding the object. Consumers wire it into a provider once.
 *
 * Not a transform step. Consumers needing resolved-value permutations
 * (MUI `createTheme`, Vuetify factories) are out of scope — that's the
 * production CSS-in-JS emit, not this preview shim.
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

// Render the virtual module source: one accessor export per top-level group,
// plus the aggregate `theme`.
function renderTheme(project: Project): string {
  const paths = collectPaths(project);
  const tree = buildTree(paths, (path) => `var(${cssVarName(path, project)})`);

  const groupNames = Object.keys(tree).toSorted();
  // Distinct group names can sanitize to the same identifier (e.g. `a-b` and
  // `a.b` both → `a_b`), which would emit duplicate top-level exports — a
  // SyntaxError in the virtual module. Suffix collisions to keep each unique.
  const idents = uniqueIdents(groupNames);
  const groupExports = groupNames.map(
    (name) => `export const ${idents.get(name)!} = ${renderNode(tree[name]!, 1)};`,
  );
  const aggregate = `export const theme = { ${groupNames.map((n) => idents.get(n)!).join(', ')} };`;

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
  // Mutable copy; listPaths returns a readonly array.
  return [...listPaths(project.tokenGraph)];
}

export interface TreeNode {
  [key: string]: TreeNode | string;
}

// Build a nested object tree from a sorted path list; leaves hold leafFor(path).
// On a leaf/branch collision (a short path's leaf shares a key a longer path
// wants to nest under) the leaf wins — real DTCG trees don't hit this, but
// explicit beats silent UB.
export function buildTree(
  sortedPaths: readonly string[],
  leafFor: (path: string) => string,
): TreeNode {
  // Null-prototype nodes: token path segments become object keys, so a
  // `__proto__` segment from untrusted token input would otherwise mutate
  // Object.prototype. With no prototype, such a key is just an own property.
  const root: TreeNode = Object.create(null);
  for (const path of sortedPaths) {
    const segments = path.split('.');
    let node = root;
    let collided = false;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      const existing = node[seg];
      // A token already occupies this segment as a leaf, so the deeper path
      // can't nest under it (a key can't be both a string and an object).
      // Drop the deeper path rather than misfiling it under the truncated
      // key the loop happened to stop on.
      if (typeof existing === 'string') {
        collided = true;
        break;
      }
      if (existing === undefined) {
        const next: TreeNode = Object.create(null);
        node[seg] = next;
        node = next;
      } else {
        node = existing;
      }
    }
    if (collided) continue;
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

// Bare identifier or canonical integer literal when safe, quoted otherwise.
// Leading-zero numerics like "050" stay quoted — bare 050 is octal in strict mode.
function safeKey(key: string): string {
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return key;
  if (/^(0|[1-9]\d*)$/.test(key)) return key;
  return JSON.stringify(key);
}

// Top-level exports must be valid JS identifiers.
function safeIdent(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `_${key.replaceAll(/[^\w$]/g, '_')}`;
}

// Map each name to a unique JS identifier, suffixing on collision so two
// names that sanitize to the same ident don't produce duplicate exports.
export function uniqueIdents(names: readonly string[]): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  for (const name of names) {
    const base = safeIdent(name);
    let ident = base;
    let n = 2;
    while (used.has(ident)) ident = `${base}_${n++}`;
    used.add(ident);
    out.set(name, ident);
  }
  return out;
}
