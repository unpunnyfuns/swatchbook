import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../components/Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Type a theme name…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Disabled input' },
};
export const Invalid: Story = { args: { invalid: true, defaultValue: 'not-a-theme' } };
