import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';
import { expect, waitFor } from 'storybook/test';
import preview from '../../.storybook/preview.tsx';

function TokenProbe({ path }: { path: string }) {
  const info = useToken(path);
  return (
    <div
      data-testid="probe"
      data-path={path}
      data-css-var={info.cssVar}
      data-type={info.type ?? ''}
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 12,
        padding: '8px 12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        borderBottom: 'var(--sb-border-default)',
      }}
    >
      <code style={{ opacity: 0.7 }}>{path}</code>
      <div>
        <div>
          <strong>cssVar:</strong> <code>{info.cssVar}</code>
        </div>
        <div>
          <strong>type:</strong> {info.type ?? '—'}
        </div>
        {info.description && (
          <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>{info.description}</div>
        )}
      </div>
    </div>
  );
}

function ProbeGrid() {
  const paths = [
    'color.surface.default',
    'color.text.default',
    'color.accent.bg',
    'radius.md',
    'typography.heading',
    'shadow.md',
  ] as const;
  return (
    <div>
      {paths.map((p) => (
        <TokenProbe key={p} path={p} />
      ))}
    </div>
  );
}

const meta = preview.meta({
  title: 'Hooks/useToken',
  component: ProbeGrid,
  tags: ['autodocs'],
});

export default meta;

/**
 * Verify each probe in the grid renders with the right shape: a
 * `var(--sb-<path-with-dashes>)` cssVar, an axis-stable string, and a
 * non-empty `type` for tokens whose `$type` is set. Per-permutation
 * value reactivity is exercised in `UseTokenUpdates`; this story
 * verifies the no-axis-input contract — the hook produces deterministic
 * output for a static set of paths under the default tuple.
 */
export const LiveReadout = meta.story({
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const probes = canvasElement.querySelectorAll<HTMLElement>('[data-testid="probe"]');
      expect(probes.length, 'every path renders its own probe').toBe(6);
    });
    const probes = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-testid="probe"]'));
    for (const probe of probes) {
      const path = probe.getAttribute('data-path') ?? '';
      const cssVar = probe.getAttribute('data-css-var') ?? '';
      expect(cssVar, `${path} should have a var(...) reference`).toMatch(/^var\(--sb-/);
      expect(cssVar, `${path}'s cssVar should mirror the path with dashes`).toContain(
        path.replaceAll('.', '-'),
      );
    }
    const expectedTyped = ['color.surface.default', 'color.text.default', 'color.accent.bg'];
    for (const path of expectedTyped) {
      const probe = probes.find((p) => p.getAttribute('data-path') === path);
      expect(probe?.getAttribute('data-type'), `${path} should expose a $type`).toBeTruthy();
    }
  },
});
