import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';
import preview from '../../.storybook/preview.tsx';

function TokenProbe({ path }: { path: string }) {
  const info = useToken(path);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 12,
        padding: '8px 12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 13,
        borderBottom: 'var(--sb-border-sys-default)',
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
    'color.sys.surface.default',
    'color.sys.text.default',
    'color.sys.accent.bg',
    'radius.sys.md',
    'typography.sys.heading',
    'shadow.sys.md',
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

export const LiveReadout = meta.story();
