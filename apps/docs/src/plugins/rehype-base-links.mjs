import { visit } from 'unist-util-visit';

/**
 * Base-prefixes root-absolute internal links (`/reference/config`) so they
 * resolve under Astro's `base` config once deployed. Astro only base-prefixes
 * links it generates itself (nav, sidebar, `astro:assets`); links written by
 * hand inside MDX bodies pass through untouched and 404 under a non-root
 * base. Runs on the markdown-to-HTML AST, so it only ever sees real `<a>`
 * elements from markdown link syntax, not Starlight's own nav or JSX
 * component props.
 */
export function rehypeBaseLinks(options = {}) {
  const base = options.base ?? '/swatchbook';

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (href === base || href.startsWith(`${base}/`)) return;

      node.properties.href = `${base}${href}`;
    });
  };
}

export default rehypeBaseLinks;
