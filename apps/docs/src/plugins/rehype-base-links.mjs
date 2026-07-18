import { visit } from 'unist-util-visit';

/**
 * Base-prefixes root-absolute internal links (`/reference/config`) so they
 * resolve under Astro's `base` config once deployed. Astro only base-prefixes
 * links it generates itself (nav, sidebar, `astro:assets`); links written by
 * hand inside MDX bodies pass through untouched and 404 under a non-root
 * base. Runs on the markdown-to-HTML AST, so it only ever sees real `<a>`
 * elements from markdown link syntax, not Starlight's own nav or JSX
 * component props.
 *
 * Also normalizes page links to a trailing slash so hand-authored links match
 * the trailing-slash form Starlight emits for its own nav/sidebar. Asset links
 * (any final segment carrying a file extension) keep their exact path.
 */
export function rehypeBaseLinks(options = {}) {
  const base = options.base ?? '/swatchbook';

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      if (!href.startsWith('/') || href.startsWith('//')) return;

      const prefixed = href === base || href.startsWith(`${base}/`) ? href : `${base}${href}`;
      node.properties.href = ensureTrailingSlash(prefixed);
    });
  };
}

// Append a trailing slash to a page path, preserving any `?query`/`#fragment`
// suffix. Skips paths that already end in `/` and asset paths whose final
// segment has a file extension (`/logo.png`), which a trailing slash would break.
function ensureTrailingSlash(href) {
  const suffixStart = href.search(/[?#]/);
  const path = suffixStart === -1 ? href : href.slice(0, suffixStart);
  const suffix = suffixStart === -1 ? '' : href.slice(suffixStart);
  if (path.endsWith('/')) return href;
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return href;
  return `${path}/${suffix}`;
}

export default rehypeBaseLinks;
