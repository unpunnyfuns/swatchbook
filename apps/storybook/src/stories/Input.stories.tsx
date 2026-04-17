import preview from '../../.storybook/preview';
import { Input } from '../components/Input';

const meta = preview.meta({
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Type a theme name…' },
});

export const Default = meta.story();
export const Disabled = meta.story({
  args: { disabled: true, defaultValue: 'Disabled input' },
});
export const Invalid = meta.story({ args: { invalid: true, defaultValue: 'not-a-theme' } });
