import type { ReactElement } from 'react';
import { useState } from 'react';
import { useProject } from '#/internal/use-project.ts';
import type { ProjectData } from '#/internal/use-project.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface ConsumerOutputProps {
  /** Full dot-path of the token. */
  path: string;
}

/** One non-`css` platform row: the consumer's listed name for this token under that platform. */
export interface ConsumerOutputPlatformEntry {
  platform: string;
  label: string;
  value: string;
}

export interface ConsumerOutputData {
  /**
   * Platforms beyond `css`. Populated only when the consumer has loaded
   * extra plugins (`@terrazzo/plugin-swift`, `-android`, `-sass`, …) via
   * `config.terrazzoPlugins` + `config.listingOptions.platforms`. Empty
   * otherwise — the row set falls back to Path + CSS.
   */
  extraPlatforms: ConsumerOutputPlatformEntry[];
}

/**
 * Pure derivation of the consumer-output platform rows from the Token
 * Listing. Extracted so it is unit-testable without React or a store.
 */
export function deriveConsumerOutput(
  path: string,
  listing: ProjectData['listing'],
): ConsumerOutputData {
  const names = listing[path]?.names ?? {};
  const extraPlatforms = Object.keys(names)
    .filter((platform) => platform !== 'css' && names[platform])
    .toSorted()
    .map((platform) => ({
      platform,
      label: formatPlatformLabel(platform),
      value: names[platform]!,
    }));
  return { extraPlatforms };
}

export interface ConsumerOutputViewProps extends ConsumerOutputData {
  path: string;
  cssVar: string;
  activeAxes: Record<string, string>;
  /** Whether the token resolves in the active theme; `false` renders nothing. */
  hasToken: boolean;
}

/** Pure presentation for the consumer-output section. Renders from plain props; owns the copy-button's local feedback state. */
export function ConsumerOutputView({
  path,
  cssVar,
  activeAxes,
  hasToken,
  extraPlatforms,
}: ConsumerOutputViewProps): ReactElement | null {
  if (!hasToken) return null;

  const tupleLabel = Object.entries(activeAxes)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

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
      {extraPlatforms.map((entry) => (
        <OutputRow
          key={entry.platform}
          label={entry.label}
          value={entry.value}
          testId={`consumer-output-${entry.platform}`}
        />
      ))}
    </>
  );
}

export function ConsumerOutput({ path }: ConsumerOutputProps): ReactElement | null {
  const { token, cssVar, activeAxes } = useTokenDetailData(path);
  const { listing } = useProject();
  const { extraPlatforms } = deriveConsumerOutput(path, listing);

  return (
    <ConsumerOutputView
      path={path}
      cssVar={cssVar}
      activeAxes={activeAxes}
      hasToken={Boolean(token)}
      extraPlatforms={extraPlatforms}
    />
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
