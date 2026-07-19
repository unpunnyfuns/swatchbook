import { expect, it } from 'vitest';
import { formatDimension, formatTokenValue } from '@unpunnyfuns/swatchbook-core/token-value-css';

it('formats a dimension object', () => {
  expect(formatDimension({ value: 4, unit: 'px' })).toBe('4px');
});
it('formats a color token value', () => {
  expect(formatTokenValue({ hex: '#3b82f6' }, 'color', 'hex')).toBe('#3b82f6');
});
