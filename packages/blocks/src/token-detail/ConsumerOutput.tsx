import type { ReactElement } from 'react';
import { useState } from 'react';
import { styles } from '#/token-detail/styles.ts';
import { useTokenDetailData } from '#/token-detail/internal.ts';

export interface ConsumerOutputProps {
  /** Full dot-path of the token. */
  path: string;
}

export function ConsumerOutput({ path }: ConsumerOutputProps): ReactElement | null {
  const { token, cssVar, activeAxes } = useTokenDetailData(path);

  if (!token) return null;

  const tupleLabel = Object.entries(activeAxes)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return (
    <>
      <div style={styles.sectionHeader}>Consumer output</div>
      {tupleLabel && (
        <div style={styles.tupleIndicator}>
          Active tuple: <strong>{tupleLabel}</strong>
        </div>
      )}
      <OutputRow label="Path" value={path} testId="consumer-output-path" />
      <OutputRow label="CSS" value={cssVar} testId="consumer-output-css" />
    </>
  );
}

interface OutputRowProps {
  label: string;
  value: string;
  testId: string;
}

function OutputRow({ label, value, testId }: OutputRowProps): ReactElement {
  return (
    <div style={styles.consumerRow}>
      <span style={styles.consumerRowLabel}>{label}</span>
      <code style={styles.consumerRowValue} data-testid={testId}>
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
      style={styles.consumerRowCopy}
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
