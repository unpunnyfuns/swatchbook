import preview from '../../.storybook/preview';
import { Button } from '../components/Button';

const meta = preview.meta({
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'ghost'] },
  },
  args: { children: 'Save changes' },
});

export const Primary = meta.story({ args: { variant: 'primary' } });
export const Ghost = meta.story({ args: { variant: 'ghost' } });
