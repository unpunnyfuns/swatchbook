import { expect, it } from 'vitest';
import type { VirtualTokenShape } from '#/contexts.ts';
import { ancestorGroupPaths, isInView } from '#/token-navigator/navigate.ts';

const resolved: Record<string, VirtualTokenShape> = {
  'color.palette.blue.500': { $type: 'color', $value: { hex: '#00f' } },
  'space.md': { $type: 'dimension', $value: '8px' },
};

it('ancestorGroupPaths returns cumulative prefixes excluding the leaf, no root', () => {
  expect(ancestorGroupPaths('color.palette.blue.500', undefined)).toEqual([
    'color',
    'color.palette',
    'color.palette.blue',
  ]);
});

it('ancestorGroupPaths drops prefixes at or above a set root', () => {
  expect(ancestorGroupPaths('color.palette.blue.500', 'color')).toEqual([
    'color.palette',
    'color.palette.blue',
  ]);
});

it('isInView honors root prefix', () => {
  expect(isInView('color.palette.blue.500', { root: 'color', resolved })).toBe(true);
  expect(isInView('space.md', { root: 'color', resolved })).toBe(false);
});

it('isInView honors the type filter', () => {
  const typeFilter = new Set(['color']);
  expect(isInView('color.palette.blue.500', { resolved, typeFilter })).toBe(true);
  expect(isInView('space.md', { resolved, typeFilter })).toBe(false);
});

it('isInView is false for a path absent from resolved', () => {
  expect(isInView('ghost.token', { resolved })).toBe(false);
});
