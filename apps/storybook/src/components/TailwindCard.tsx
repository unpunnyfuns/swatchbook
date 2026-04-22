import type { ReactElement } from 'react';

export interface TailwindCardProps {
  /** Primary heading text. */
  title: string;
  /** Body paragraph text. */
  body: string;
  /** Optional status badge — toggles the accent strip + badge colour. */
  status?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * Proof-of-concept component using Tailwind v4 utilities whose values
 * resolve through swatchbook's DTCG tokens. Every utility uses the
 * `sb-` prefix (`bg-sb-surface-raised`, `p-sb-lg`, `rounded-sb-lg`,
 * `shadow-sb-md`) so it never collides with Tailwind's shipped scales —
 * see `.storybook/tailwind.css` for the `@theme` wiring. Switching
 * mode / brand / contrast in the swatchbook toolbar flips every utility
 * via CSS cascade.
 */
export function TailwindCard({ title, body, status = 'default' }: TailwindCardProps): ReactElement {
  const statusBadge = STATUS_CLASSES[status];
  return (
    <article className="bg-sb-surface-raised text-sb-text-default border border-sb-border-default rounded-sb-lg shadow-sb-md p-sb-lg w-full max-w-md">
      <header className="flex items-center justify-between gap-sb-md mb-sb-sm">
        <h3 className="text-lg font-semibold m-0">{title}</h3>
        {status !== 'default' && (
          <span className={`${statusBadge} text-xs font-medium rounded-sb-pill px-sb-sm py-sb-2xs`}>
            {status}
          </span>
        )}
      </header>
      <p className="text-sb-text-muted text-sm m-0">{body}</p>
      <div className="flex gap-sb-sm mt-sb-lg">
        <button
          type="button"
          className="bg-sb-accent-bg text-sb-accent-fg rounded-sb-md px-sb-md py-sb-sm font-medium hover:bg-sb-accent-bg-hover"
        >
          Primary
        </button>
        <button
          type="button"
          className="bg-transparent text-sb-text-default border border-sb-border-default rounded-sb-md px-sb-md py-sb-sm font-medium hover:bg-sb-surface-muted"
        >
          Secondary
        </button>
      </div>
    </article>
  );
}

const STATUS_CLASSES: Record<NonNullable<TailwindCardProps['status']>, string> = {
  default: '',
  success: 'bg-sb-status-success-bg text-sb-status-success-fg',
  warning: 'bg-sb-status-warning-bg text-sb-status-warning-fg',
  danger: 'bg-sb-status-danger-bg text-sb-status-danger-fg',
};
