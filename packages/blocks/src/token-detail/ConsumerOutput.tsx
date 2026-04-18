import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useColorFormat } from '#/contexts.ts';
import { formatColor } from '#/internal/format-color.ts';
import { formatValue, makeCssVar } from '#/internal/use-project.ts';
import { styles } from '#/token-detail/styles.ts';
import { type DetailToken, useTokenDetailData } from '#/token-detail/internal.ts';

export interface ConsumerOutputProps {
  /** Full dot-path of the token. */
  path: string;
}

type TabKey = 'css' | 'json' | 'js' | 'ts';

interface Tab {
  key: TabKey;
  label: string;
  language: string;
}

const TABS: readonly Tab[] = [
  { key: 'css', label: 'CSS', language: 'css' },
  { key: 'json', label: 'JSON', language: 'json' },
  { key: 'js', label: 'JS', language: 'ts' },
  { key: 'ts', label: 'TS', language: 'ts' },
];

interface RenderArgs {
  path: string;
  token: DetailToken;
  cssVarPrefix: string;
  colorValue: string;
}

export function ConsumerOutput({ path }: ConsumerOutputProps): ReactElement | null {
  const { token, cssVarPrefix, activeAxes } = useTokenDetailData(path);
  const colorFormat = useColorFormat();
  const [active, setActive] = useState<TabKey>('css');

  const outputs = useMemo(() => {
    if (!token) return null;
    const isColor = token.$type === 'color';
    const colorValue = isColor ? formatColor(token.$value, colorFormat).value : '';
    const args: RenderArgs = { path, token, cssVarPrefix, colorValue };
    return {
      css: renderCss(args),
      json: renderJson(args, colorFormat === 'raw' ? '' : colorValue),
      js: renderJs(args),
      ts: renderTs(args),
    };
  }, [token, cssVarPrefix, colorFormat, path]);

  if (!token || !outputs) return null;

  const tupleLabel = Object.entries(activeAxes)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  const content = outputs[active];
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <>
      <div style={styles.sectionHeader}>Consumer output</div>
      {tupleLabel && (
        <div style={styles.tupleIndicator}>
          Active tuple: <strong>{tupleLabel}</strong>
        </div>
      )}
      <div style={styles.tabBar} role='tablist' aria-label='Consumer output format'>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type='button'
              role='tab'
              aria-selected={isActive}
              data-testid={`consumer-output-tab-${tab.key}`}
              onClick={() => setActive(tab.key)}
              style={{
                ...styles.tabButton,
                ...(isActive ? styles.tabButtonActive : null),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div style={styles.tabPanel} role='tabpanel'>
        <CopyButton text={content} />
        <code
          style={styles.consumerSnippet}
          data-testid='consumer-output-content'
          data-format={activeTab?.key}
        >
          {content}
        </code>
      </div>
    </>
  );
}

function CopyButton({ text }: { text: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type='button'
      style={styles.copyButton}
      data-testid='consumer-output-copy'
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

function renderCss({ path, token, cssVarPrefix, colorValue }: RenderArgs): string {
  const ref = makeCssVar(path, cssVarPrefix);
  const varName = cssVarPrefix
    ? `--${cssVarPrefix}-${path.replaceAll('.', '-')}`
    : `--${path.replaceAll('.', '-')}`;
  const declValue = token.$type === 'color' && colorValue ? colorValue : formatValue(token.$value);
  return `${ref}\n${varName}: ${declValue};`;
}

function renderJson({ token }: RenderArgs, colorOverride: string): string {
  const value = token.$type === 'color' && colorOverride ? colorOverride : (token.$value ?? null);
  const payload: Record<string, unknown> = {};
  if (token.$type !== undefined) payload['$type'] = token.$type;
  payload['$value'] = value;
  return JSON.stringify(payload, null, 2);
}

function renderJs({ path }: RenderArgs): string {
  return [
    "import { useToken } from '@unpunnyfuns/swatchbook-addon/hooks';",
    '',
    `const ${toIdentifier(path)} = useToken(${JSON.stringify(path)});`,
  ].join('\n');
}

function renderTs({ path }: RenderArgs): string {
  return `${JSON.stringify(path)}: string;`;
}

function toIdentifier(path: string): string {
  const tail = path.split('.').pop() ?? 'token';
  const cleaned = tail.replace(/[^A-Za-z0-9]/g, ' ').trim();
  const parts = cleaned.split(/\s+/);
  const head = parts[0]?.toLowerCase() ?? 'token';
  const camel = parts
    .slice(1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');
  const ident = head + camel;
  return /^[A-Za-z_$]/.test(ident)
    ? ident
    : `token${ident.charAt(0).toUpperCase()}${ident.slice(1)}`;
}
