// Per-component Chromatic detection lets animated samples render
// their static fallback during snapshot capture, instead of using
// Storybook's global `chromatic.prefersReducedMotion: true` (which
// is incompatible with Chromatic's verification parser in our
// setup). These tests pin the detection so a silent regression
// (Chromatic changing their UA, or the env-detection branch order
// flipping) doesn't un-stabilize every motion-bearing visual
// regression.
import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from '#/internal/prefers-reduced-motion.ts';

function Probe(props: { onValue: (v: boolean) => void }): null {
  const reduced = usePrefersReducedMotion();
  props.onValue(reduced);
  return null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

it("returns true when Chromatic's user-agent is present, even if matchMedia would say otherwise", () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh) Chromatic/1.0');
  // Force matchMedia to report "not reduced" so the result must come
  // from the isChromatic branch.
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  let observed: boolean | null = null;
  render(<Probe onValue={(v) => (observed = v)} />);
  expect(observed).toBe(true);
});

it('follows matchMedia when not inside Chromatic (transitions from default-false to matchMedia=true)', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (Macintosh) AppleWebKit/537.36',
  );
  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: true,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  const observed: boolean[] = [];
  render(<Probe onValue={(v) => observed.push(v)} />);
  // Sequence: initial render returns the useState default (false), then
  // the useEffect's matchMedia read flips to true and re-renders.
  expect(observed).toEqual([false, true]);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
});

it('falls through to matchMedia=false when neither Chromatic nor user preference reports reduced', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (Macintosh) AppleWebKit/537.36',
  );
  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  const observed: boolean[] = [];
  render(<Probe onValue={(v) => observed.push(v)} />);
  // The effect's `setReduced(false)` matches the existing state, so React
  // bails out of the re-render; we only observe the initial false. The
  // positive signal that the effect actually ran is the matchMedia call.
  expect(observed).toEqual([false]);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
});
