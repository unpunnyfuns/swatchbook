import preview from '../../.storybook/preview';
import { Card } from '../components/Card';

const meta = preview.meta({
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Design token card',
    children:
      'Every surface, border, radius, and shadow on this card resolves through swatchbook-core from the reference DTCG pyramid.',
  },
});

export const Default = meta.story();
export const Untitled = meta.story({ args: { title: undefined } });
