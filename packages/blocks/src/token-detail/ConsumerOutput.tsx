import type { ReactElement } from 'react';
import { useState } from 'react';
import { useProject } from '#/internal/use-project.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface ConsumerOutputProps {
  /** Full dot-path of the token. */
  path: string;
}

export function ConsumerOutput({ path }: ConsumerOutputProps): ReactElement | null {
  const { token, cssVar, activeAxes } = useTokenDetailData(path);
  const { listing } = useProject();

  if (!token) return null;

  const tupleLabel = Object.entries(activeAxes)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  // Platforms beyond `css`. Populated only when the consumer has loaded
  // extra plugins (`@terrazzo/plugin-swift`, `-android`, `-sass`, …) via
  // `config.terrazzoPlugins` + `config.listingOptions.platforms`. Always
  // empty otherwise — the row set falls back to Path + CSS exactly like
  // before listing adoption.
  const names = listing[path]?.names ?? {};
  const extraPlatforms = Object.keys(names)
    .filter((platform) => platform !== 'css' && names[platform])
    .toSorted();

  return (
    <>
      <div className="sb-token-detail__section-header">Consumer output</div>
      {tupleLabel && (
        <div className="sb-token-detail__tuple-indicator">
          Active tuple: <strong>{tupleLabel}</strong>
        </div>
      )}
      <OutputRow label="Path" value={path} testId="consumer-output-path" />
      <OutputRow label="CSS" value={cssVar} testId="consumer-output-css" />
      {extraPlatforms.map((platform) => (
        <OutputRow
          key={platform}
          label={formatPlatformLabel(platform)}
          value={names[platform]!}
          testId={`consumer-output-${platform}`}
        />
      ))}
    </>
  );
}

function formatPlatformLabel(platform: string): string {
  if (platform.length === 0) return platform;
  return platform[0]!.toUpperCase() + platform.slice(1);
}

interface OutputRowProps {
  label: string;
  value: string;
  testId: string;
}

function OutputRow({ label, value, testId }: OutputRowProps): ReactElement {
  return (
    <div className="sb-token-detail__consumer-row">
      <span className="sb-token-detail__consumer-row-label">{label}</span>
      <code className="sb-token-detail__consumer-row-value" data-testid={testId}>
        {value}
      </code>
      <CopyButton text={value} testId={`${testId}-copy`} />
    </div>
  );
}

function CopyButton({ text, testId }: { text: string; testId: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="sb-token-detail__consumer-row-copy"
      data-testid={testId}
      onClick={() => {
        void copyToClipboard(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
