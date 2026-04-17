import type { Preview } from '@storybook/react-vite';
import '../src/generated/tokens.css';
import '../src/app.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Active swatchbook theme. Temporary until the addon lands.',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'Light', title: 'Light' },
          { value: 'Dark', title: 'Dark' },
          { value: 'Light · Brand A', title: 'Light · Brand A' },
          { value: 'Dark · Brand A', title: 'Dark · Brand A' },
          { value: 'High Contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'Light' },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) ?? 'Light';
      return (
        <div
          data-theme={theme}
          style={{
            background: 'var(--sb-color-sys-surface-default)',
            color: 'var(--sb-color-sys-text-default)',
            padding: '1rem',
            minHeight: '100%',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
