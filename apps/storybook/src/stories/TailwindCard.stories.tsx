import type { ReactElement } from 'react';
import preview from '../../.storybook/preview.tsx';
import { TailwindCard } from '../components/TailwindCard.tsx';

const meta = preview.meta({
  title: 'Integrations/Tailwind',
  component: TailwindCard,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['default', 'success', 'warning', 'danger'] },
  },
  args: {
    title: 'Release notes',
    body: 'Tailwind utilities render through swatchbook CSS vars, so the theme toolbar flips every utility at once.',
    status: 'default',
  },
  decorators: [
    // Give the component a visible canvas — docs-mode story containers
    // otherwise shrink to content's intrinsic width and the card
    // collapses.
    (Story: () => ReactElement) => (
      <div style={{ padding: '1.5rem', minHeight: '12rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Demonstrates that a Tailwind v4 project can share swatchbook's DTCG tokens via `var(--sb-*)` references in its `@theme` block. Use the swatchbook toolbar above to flip mode / brand / contrast; every Tailwind colour utility updates through CSS cascade. See `.storybook/tailwind.css` for the mapping — and the note there about Tailwind's sizing scale colliding with DTCG semantic spacing names.",
      },
    },
  },
});

export const Default = meta.story({});
export const Success = meta.story({ args: { status: 'success' } });
export const Warning = meta.story({ args: { status: 'warning' } });
export const Danger = meta.story({ args: { status: 'danger' } });
