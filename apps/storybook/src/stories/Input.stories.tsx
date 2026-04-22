import preview from '../../.storybook/preview.tsx';
import { Input } from '../components/Input.tsx';

const meta = preview.meta({
  title: 'Integrations/CSS/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Type a theme name…' },
});

export const Default = meta.story();
export const Disabled = meta.story({
  args: { disabled: true, defaultValue: 'Disabled input' },
});
export const Invalid = meta.story({ args: { invalid: true, defaultValue: 'not-a-theme' } });
