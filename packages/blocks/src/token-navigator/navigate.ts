import type { VirtualToken } from '#/types.ts';

/**
 * The group paths to expand so `path` becomes visible in the tree — the
 * cumulative dotted prefixes of `path`, excluding `path` itself and any
 * prefix at or above `root` (the navigator's implicit root container is not
 * a group node). Matches `buildTree`'s full-dotted group-path scheme.
 */
export function ancestorGroupPaths(path: string, root: string | undefined): string[] {
  const segments = path.split('.');
  const out: string[] = [];
  for (let i = 1; i < segments.length; i += 1) {
    const prefix = segments.slice(0, i).join('.');
    if (root && !prefix.startsWith(`${root}.`)) continue;
    out.push(prefix);
  }
  return out;
}

/** Context a navigation target is tested against — the active structural filters. */
export interface InViewContext {
  resolved: Record<string, VirtualToken>;
  root?: string | undefined;
  typeFilter?: ReadonlySet<string> | undefined;
}

/**
 * Whether `path` survives the navigator's structural (`root` / `type`)
 * filters and exists in the resolved map — i.e. it can be selected in the
 * current tree. Transient search is NOT considered here: a target hidden
 * only by an active query is still "in view" once the query is cleared,
 * which the caller handles.
 */
export function isInView(path: string, ctx: InViewContext): boolean {
  const token = ctx.resolved[path];
  if (!token) return false;
  if (ctx.root && !(path === ctx.root || path.startsWith(`${ctx.root}.`))) return false;
  if (ctx.typeFilter && !(token.$type !== undefined && ctx.typeFilter.has(token.$type))) {
    return false;
  }
  return true;
}
