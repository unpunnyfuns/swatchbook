import { expect, it } from 'vitest';
import type { VirtualTokenShape } from '#/contexts.ts';

// Type-level contract: VirtualTokenShape must accept $deprecated so blocks
// can read it off resolved tokens. A runtime assertion keeps the test real.
it('VirtualTokenShape accepts $deprecated as string | boolean', () => {
  const withMessage: VirtualTokenShape = {
    $type: 'color',
    $value: { hex: '#000' },
    $deprecated: 'use color.new',
  };
  const withFlag: VirtualTokenShape = {
    $type: 'color',
    $value: { hex: '#000' },
    $deprecated: true,
  };
  expect(withMessage.$deprecated).toBe('use color.new');
  expect(withFlag.$deprecated).toBe(true);
});
