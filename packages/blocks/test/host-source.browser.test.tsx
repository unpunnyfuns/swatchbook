import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { registerProjectSource, useProjectSource } from '#/host.ts';

it('a pushed source (including activeAxes) is read back', () => {
  registerProjectSource({ cssVarPrefix: 'sb', activeAxes: { mode: 'Dark' } });
  const { result } = renderHook(() => useProjectSource());
  expect(result.current.cssVarPrefix).toBe('sb');
  expect(result.current.activeAxes).toEqual({ mode: 'Dark' });
});
