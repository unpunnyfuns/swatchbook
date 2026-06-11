import { expect, it } from 'vitest';
import { transitionDurationMs } from '#/token-detail/transition-duration.ts';

it('reads a millisecond duration object directly', () => {
  expect(transitionDurationMs('duration', { value: 300, unit: 'ms' })).toBe(300);
});

it('converts a seconds duration object to ms', () => {
  expect(transitionDurationMs('duration', { value: 2, unit: 's' })).toBe(2000);
});

it('parses string durations in ms and s', () => {
  expect(transitionDurationMs('duration', '450ms')).toBe(450);
  expect(transitionDurationMs('duration', '1.5s')).toBe(1500);
});

it('treats a bare number as milliseconds', () => {
  expect(transitionDurationMs('duration', 250)).toBe(250);
});

it('reads the duration sub-field of a transition composite', () => {
  expect(
    transitionDurationMs('transition', {
      duration: { value: 200, unit: 'ms' },
      delay: { value: 0, unit: 'ms' },
      timingFunction: [0.4, 0, 0.2, 1],
    }),
  ).toBe(200);
});

it('returns the fixed 800ms the cubicBezier sample animates over', () => {
  expect(transitionDurationMs('cubicBezier', [0.4, 0, 0.2, 1])).toBe(800);
});

it('returns undefined for types without a duration or an unparseable value', () => {
  expect(transitionDurationMs('color', '#fff')).toBeUndefined();
  expect(transitionDurationMs('duration', { value: 'x' })).toBeUndefined();
  expect(transitionDurationMs('duration', 'not-a-duration')).toBeUndefined();
});
