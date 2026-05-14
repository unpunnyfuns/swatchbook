import type { ReactElement } from 'react';
import preview from '../../.storybook/preview.tsx';
import { CssInJsCard } from '../components/CssInJsCard.tsx';

const meta = preview.meta({
  title: 'Integrations/CSS-in-JS',
  component: CssInJsCard,
  tags: ['autodocs'],
  args: {
    title: 'Release notes',
    body: 'Permutation values come from `virtual:swatchbook/theme` — every leaf is a `var(--sb-*)` reference, so the toolbar flips every style at once through CSS cascade.',
  },
  decorators: [
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
          'Demonstrates `@unpunnyfuns/swatchbook-integrations/css-in-js`. The integration exposes `virtual:swatchbook/theme` whose leaves are `var(--sb-*)` string references — drop-in for styled-components / emotion / any ThemeProvider, or usable directly in React inline styles as shown here. The swatchbook toolbar flips every value at once via CSS cascade.',
      },
    },
  },
});

export const Default = meta.story({});
