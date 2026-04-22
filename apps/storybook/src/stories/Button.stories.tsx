import preview from '../../.storybook/preview.tsx';
import { Button } from '../components/Button.tsx';

const meta = preview.meta({
  title: 'Integrations/CSS/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'ghost'] },
  },
  args: { children: 'Save changes' },
});

export const Primary = meta.story({ args: { variant: 'primary' } });
export const Ghost = meta.story({ args: { variant: 'ghost' } });
