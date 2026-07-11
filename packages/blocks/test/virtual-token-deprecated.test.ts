import { expect, it } from 'vitest';
import type { VirtualToken } from '#/types.ts';

// Type-level contract: VirtualToken must accept $deprecated so blocks
// can read it off resolved tokens. A runtime assertion keeps the test real.
it('VirtualToken accepts $deprecated as string | boolean', () => {
  const withMessage: VirtualToken = {
    $type: 'color',
    $value: { hex: '#000' },
    $deprecated: 'use color.new',
  };
  const withFlag: VirtualToken = {
    $type: 'color',
    $value: { hex: '#000' },
    $deprecated: true,
  };
  expect(withMessage.$deprecated).toBe('use color.new');
  expect(withFlag.$deprecated).toBe(true);
});
