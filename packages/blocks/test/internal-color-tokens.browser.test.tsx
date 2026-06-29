import '#/index.ts';
import { afterEach, expect, it } from 'vitest';

// The blocks' surface flips between a light card (standalone) and a dark card
// (when the consumer's chrome maps surfaces to dark-mode tokens). The status
// colors must clear WCAG AA on both. They derive from the adaptive
// `--swatchbook-text-default`, so we simulate each mode by pinning it — this
// is the contrast coverage axe lacks (it only ever renders the default tuple).
const CONTEXTS: Record<string, { textDefault: string; surface: number[] }> = {
  light: { textDefault: '#111827', surface: [255, 255, 255] },
  dark: { textDefault: '#f8f9fc', surface: [15, 23, 41] },
};

function relLum(rgb: number[]): number {
  const [r = 0, g = 0, b = 0] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: number[], b: number[]): number {
  const la = relLum(a);
  const lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// Resolve a `var(--x)` — which may be a `color-mix()` over other vars — to
// sRGB 0-255 via canvas, which paints from the browser-resolved value.
function resolveToRgb(varName: string): number[] {
  const el = document.createElement('span');
  el.style.color = `var(${varName})`;
  document.documentElement.appendChild(el);
  const computed = getComputedStyle(el).color;
  el.remove();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  ctx.fillStyle = '#000';
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
}

afterEach(() => document.documentElement.style.removeProperty('--swatchbook-text-default'));

it('the deprecated strikethrough color resolves to its flat amber', () => {
  const root = getComputedStyle(document.documentElement);
  expect(root.getPropertyValue('--swatchbook-deprecated').trim()).toBe('#d97706');
});

for (const [mode, { textDefault, surface }] of Object.entries(CONTEXTS)) {
  it(`status colors clear WCAG AA on the ${mode} surface`, () => {
    document.documentElement.style.setProperty('--swatchbook-text-default', textDefault);
    for (const role of ['status-success', 'status-warning', 'status-danger']) {
      const ratio = contrast(resolveToRgb(`--swatchbook-${role}`), surface);
      expect(ratio, `--swatchbook-${role} on ${mode} surface`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
