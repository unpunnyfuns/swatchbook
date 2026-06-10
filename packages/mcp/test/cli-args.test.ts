import { expect, it } from 'vitest';
import { parseArgs } from '#/cli-args.ts';

it('defaults to watch on, no help, no config', () => {
  expect(parseArgs([])).toEqual({ watch: true, help: false });
});

it('parses --config and its -c alias with the following value', () => {
  expect(parseArgs(['--config', 'swatchbook.config.ts']).config).toBe('swatchbook.config.ts');
  expect(parseArgs(['-c', 'resolver.json']).config).toBe('resolver.json');
});

it('parses --cwd', () => {
  expect(parseArgs(['--config', 'c.ts', '--cwd', '/proj']).cwd).toBe('/proj');
});

it('--no-watch disables watching', () => {
  expect(parseArgs(['--config', 'c.ts', '--no-watch']).watch).toBe(false);
});

it('--help / -h set the help flag without consuming a value', () => {
  expect(parseArgs(['--help'])).toEqual({ watch: true, help: true });
  expect(parseArgs(['-h']).help).toBe(true);
});

it('ignores a flag that expects a value when none follows', () => {
  // `--config` at the end with no path: not consumed, config stays undefined.
  expect(parseArgs(['--config']).config).toBeUndefined();
});

it('takes the last value when a flag is repeated', () => {
  expect(parseArgs(['-c', 'a.ts', '-c', 'b.ts']).config).toBe('b.ts');
});
