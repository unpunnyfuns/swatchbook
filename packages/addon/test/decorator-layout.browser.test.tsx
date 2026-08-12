import { cleanup, render } from '@testing-library/react';
import type { Decorator } from '@storybook/react-vite';
import { afterEach, expect, it } from 'vitest';
import { decorators } from '#/preview.tsx';

// Real geometry in a real browser is the whole point here: the bug this
// guards against (#1443) is the decorator's wrapper contributing a box of
// its own, which only shows up as measured layout.
function themedDecorator(...args: Parameters<Decorator>): ReturnType<Decorator> {
  const [first] = decorators as Decorator[];
  if (!first) throw new Error('the addon preview exports no decorator');
  return first(...args);
}

afterEach(cleanup);

// Mount the decorator around a fixed-size story inside a host whose height
// is content-driven, so any box the wrapper contributes shows up as extra
// height on the host.
function mount(parameters: Record<string, unknown> = {}) {
  const host = document.createElement('div');
  host.style.width = '200px';
  document.body.appendChild(host);

  function Decorated() {
    return themedDecorator(() => <div data-testid="story" style={{ height: '10px' }} />, {
      globals: {},
      parameters,
    } as never);
  }

  render(<Decorated />, { container: host });
  const story = host.querySelector('[data-testid="story"]') as HTMLElement;
  return { host, story };
}

it('wraps the story without contributing a box, so the host layout is the only source of spacing', () => {
  const { host, story } = mount();

  const hostBox = host.getBoundingClientRect();
  const storyBox = story.getBoundingClientRect();

  expect(storyBox.left).toBe(hostBox.left);
  expect(storyBox.top).toBe(hostBox.top);
  expect(storyBox.width).toBe(hostBox.width);
  expect(hostBox.height).toBe(storyBox.height);
});

// `parentElement`, not `closest()`: SwatchbookProvider mounts its own
// attribute div further out carrying the same tuple, so a walk up the tree
// would still find a match with the decorator's own attributes missing.
// A non-default context proves the per-story override reaches the wrapper
// rather than the axis defaulting into place.
it('puts the axis attributes on the wrapper directly around the story so per-story overrides scope', () => {
  const { story } = mount({ swatchbook: { axes: { mode: 'Dark' } } });

  expect(story.parentElement?.getAttribute('data-sb-mode')).toBe('Dark');
});
