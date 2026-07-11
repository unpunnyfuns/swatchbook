// Tree-building helpers for the css-in-js integration's virtual module
// renderer. Not part of the public `./css-in-js` subpath — tsdown builds
// each `src/*.ts` entry whole, so anything exported from `css-in-js.ts`
// itself ships in its `.d.mts`. Living here keeps these out of that surface
// while still letting the test suite reach them via `#/internal/tree.ts`.

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
