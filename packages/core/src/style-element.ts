/**
 * Browser-safe `<style>` injector. Exported through the
 * `@unpunnyfuns/swatchbook-core/style-element` subpath so the addon's
 * preview decorator, the blocks-side stylesheet path, and any future
 * integration share one implementation — no parallel
 * `getElementById` / `createElement` boilerplate across packages.
 *
 * Idempotent: creates the `<style>` element the first time, then only
 * updates `textContent` when it actually changes. Safe to call from
 * both module-level and effect callsites.
 *
 * No-ops in non-DOM environments (SSR, Node).
 */
export const SWATCHBOOK_STYLE_ELEMENT_ID = 'swatchbook-tokens';

export function ensureStyleElement(elementId: string, text: string): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(elementId) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = elementId;
    document.head.appendChild(style);
  }
  if (style.textContent !== text) style.textContent = text;
}
