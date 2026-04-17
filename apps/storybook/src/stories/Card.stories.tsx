import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../components/Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Design token card',
    children:
      'Every surface, border, radius, and shadow on this card resolves through swatchbook-core from the reference DTCG pyramid.',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Untitled: Story = { args: { title: undefined } };
