import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermutationContext } from '@unpunnyfuns/swatchbook-blocks';
import { useToken } from '#/hooks/use-token.ts';

function withPermutation(name: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PermutationContext.Provider value={name}>{children}</PermutationContext.Provider>;
  };
}

describe('useToken', () => {
  it('returns the resolved value + `var(--…)` reference for the active permutation', () => {
    const { result } = renderHook(() => useToken('color.accent.bg'), {
      wrapper: withPermutation('Light'),
    });
    expect(result.current.value).toEqual({ colorSpace: 'srgb', components: [0, 0.4, 1] });
    expect(result.current.cssVar).toBe('var(--sb-color-accent-bg)');
    expect(result.current.type).toBe('color');
    expect(result.current.description).toBe('Accent background');
  });

  it('returns a different resolved value when the active permutation changes', () => {
    const { result: light } = renderHook(() => useToken('color.accent.bg'), {
      wrapper: withPermutation('Light'),
    });
    const { result: dark } = renderHook(() => useToken('color.accent.bg'), {
      wrapper: withPermutation('Dark'),
    });
    expect(light.current.value).not.toEqual(dark.current.value);
    // cssVar is permutation-independent: blocks read CSS vars per
    // selector on the page, not via the JS value.
    expect(light.current.cssVar).toBe(dark.current.cssVar);
  });

  it('falls back to defaultPermutation when context is empty', () => {
    // Without a provider, useActivePermutation returns the empty string.
    // The hook then reads from `defaultPermutation` (`Light` in the stub).
    const { result } = renderHook(() => useToken('color.accent.bg'));
    expect(result.current.value).toEqual({ colorSpace: 'srgb', components: [0, 0.4, 1] });
  });

  it('returns undefined value + cssVar reference when the path is unknown', () => {
    const { result } = renderHook(() => useToken('not.a.token'), {
      wrapper: withPermutation('Light'),
    });
    expect(result.current.value).toBeUndefined();
    expect(result.current.cssVar).toBe('var(--sb-not-a-token)');
    expect(result.current.type).toBeUndefined();
    expect(result.current.description).toBeUndefined();
  });

  it('returns a non-color token with the right $type', () => {
    const { result } = renderHook(() => useToken('space.md'), {
      wrapper: withPermutation('Light'),
    });
    expect(result.current.value).toBe('16px');
    expect(result.current.type).toBe('dimension');
    expect(result.current.cssVar).toBe('var(--sb-space-md)');
  });

  it('omits the `description` field when the token has no $description', () => {
    const { result } = renderHook(() => useToken('space.md'), {
      wrapper: withPermutation('Light'),
    });
    expect(result.current.description).toBeUndefined();
  });
});
