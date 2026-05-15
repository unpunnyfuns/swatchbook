// Pragmatic exception: `swatchbookTokensPlugin`'s runtime surface is the
// Storybook preview build; exercising that end-to-end needs a real Vite
// dev server. The `resolveId` / `load` hooks for the integration-side-
// effects aggregate module are pure (no dependency on the async `project`
// state set in `buildStart`), so calling them as plain functions catches
// the common regressions — empty body, `autoInject` filtering,
// import-statement shape — at a fraction of the cost.
import type { Config, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';
import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
  RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
} from '#/constants.ts';
import { swatchbookTokensPlugin } from '#/virtual/plugin.ts';

const CWD = '/project';
const NOOP_CONFIG: Config = { tokens: ['tokens/**/*.json'] };

function invokeResolve(
  plugin: ReturnType<typeof swatchbookTokensPlugin>,
  id: string,
): string | null | undefined {
  const hook = plugin.resolveId;
  if (typeof hook !== 'function') return undefined;
  return (hook as (this: void, id: string) => string | null | undefined).call(
    undefined as unknown as void,
    id,
  );
}

function invokeLoad(
  plugin: ReturnType<typeof swatchbookTokensPlugin>,
  id: string,
): string | null | undefined {
  const hook = plugin.load;
  if (typeof hook !== 'function') return undefined;
  return (hook as (this: void, id: string) => string | null | undefined).call(
    undefined as unknown as void,
    id,
  );
}

function integration(name: string, virtualId: string, autoInject: boolean): SwatchbookIntegration {
  return {
    name,
    virtualModule: {
      virtualId,
      render: () => `/* ${name} */`,
      autoInject,
    },
  };
}

describe('integration-side-effects aggregate virtual module', () => {
  it('resolveId maps the public virtual ID to the resolved form', () => {
    const plugin = swatchbookTokensPlugin({ config: NOOP_CONFIG, cwd: CWD });
    expect(invokeResolve(plugin, INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID)).toBe(
      RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID,
    );
  });

  it('load returns an empty body when no integration opts in', () => {
    const plugin = swatchbookTokensPlugin({ config: NOOP_CONFIG, cwd: CWD });
    expect(invokeLoad(plugin, RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID)).toBe('');
  });

  it('load returns an empty body when every integration opts out', () => {
    const plugin = swatchbookTokensPlugin({
      config: NOOP_CONFIG,
      cwd: CWD,
      integrations: [integration('opaque', 'virtual:swatchbook/opaque', false)],
    });
    expect(invokeLoad(plugin, RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID)).toBe('');
  });

  it('load emits one side-effect import per auto-inject integration, skipping opt-outs', () => {
    const plugin = swatchbookTokensPlugin({
      config: NOOP_CONFIG,
      cwd: CWD,
      integrations: [
        integration('tailwind', 'virtual:swatchbook/tailwind.css', true),
        integration('theme', 'virtual:swatchbook/theme', false),
        integration('another', 'virtual:swatchbook/another.css', true),
      ],
    });
    const body = invokeLoad(plugin, RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID);
    expect(body).toBe(
      `import "virtual:swatchbook/tailwind.css";\nimport "virtual:swatchbook/another.css";`,
    );
    expect(body).not.toContain('virtual:swatchbook/theme');
  });

  it('load returns null for unrelated IDs so Vite can fall through to the next plugin', () => {
    const plugin = swatchbookTokensPlugin({ config: NOOP_CONFIG, cwd: CWD });
    expect(invokeLoad(plugin, '\0some-other-virtual')).toBeNull();
  });
});
