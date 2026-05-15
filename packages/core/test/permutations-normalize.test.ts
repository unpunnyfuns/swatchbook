/**
 * Direct unit coverage of `normalizePermutations` from
 * `src/permutations/normalize.ts`. The function dispatches to one of
 * three loaders (resolver / layered / plain-parse fallback) based on
 * which fields the config sets, and guards against the mutually-
 * exclusive combinations. Integration tests run through `loadProject`
 * which calls this; here we pin the gating logic in isolation.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BufferedLogger } from '#/diagnostics.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import type { Config } from '#/types.ts';

describe('normalizePermutations gating', () => {
  it('throws when both `resolver` and `axes` are supplied', async () => {
    const config: Config = {
      resolver: 'whatever.json',
      axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
    };
    await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
      /either `resolver` or `axes`, not both/,
    );
  });

  it('throws when `axes` is set but `tokens` is missing', async () => {
    const config: Config = {
      axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
    };
    await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
      /must also supply `tokens`/,
    );
  });

  it('throws when `axes` is set with an empty `tokens` array', async () => {
    const config: Config = {
      axes: [{ name: 'mode', contexts: { Light: [], Dark: [] }, default: 'Light' }],
      tokens: [],
    };
    await expect(normalizePermutations(config, '/cwd', new BufferedLogger())).rejects.toThrow(
      /must also supply `tokens`/,
    );
  });
});

describe('normalizePermutations dispatch', () => {
  let workspace: string;

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'swatchbook-normalize-'));
  });

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  function writeJson(rel: string, value: unknown): string {
    const abs = join(workspace, rel);
    writeFileSync(abs, JSON.stringify(value), 'utf8');
    return abs;
  }

  it('takes the resolver path when `resolver` is set', async () => {
    writeJson('tokens.json', {
      color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
    });
    writeJson('resolver.json', {
      $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
      version: '2025.10',
      sets: { main: { sources: [{ $ref: './tokens.json' }] } },
      resolutionOrder: [{ $ref: '#/sets/main' }],
    });

    const result = await normalizePermutations(
      { resolver: 'resolver.json' },
      workspace,
      new BufferedLogger(),
    );
    // Resolver path produces a `parserInput` for downstream emit.
    expect(result.parserInput).toBeDefined();
    expect(result.permutations.length).toBeGreaterThan(0);
  });

  it('falls back to plain-parse when neither `resolver` nor `axes` is set', async () => {
    writeJson('tokens.json', {
      color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
    });

    const result = await normalizePermutations(
      { tokens: ['tokens.json'] },
      workspace,
      new BufferedLogger(),
    );
    expect(result.axes.length).toBe(1);
    expect(result.axes[0]?.source).toBe('synthetic');
    expect(result.permutations.length).toBe(1);
  });

  it('takes the layered path when `axes` + `tokens` are both set', async () => {
    writeJson('tokens.json', {
      color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
    });
    writeJson('overlay-light.json', {
      color: { red: { $value: { colorSpace: 'srgb', components: [1, 0.5, 0.5] } } },
    });

    const result = await normalizePermutations(
      {
        tokens: ['tokens.json'],
        axes: [
          {
            name: 'mode',
            contexts: { Light: ['overlay-light.json'], Dark: [] },
            default: 'Light',
          },
        ],
      },
      workspace,
      new BufferedLogger(),
    );
    expect(result.axes[0]?.source).toBe('layered');
    expect(result.permutations.map((p) => p.name).toSorted()).toEqual(['Dark', 'Light']);
    // Layered loader doesn't populate parserInput (resolver-backed only).
    expect(result.parserInput).toBeUndefined();
  });
});
