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
function mount() {
  const host = document.createElement('div');
  host.style.width = '200px';
  document.body.appendChild(host);

  function Decorated() {
    return themedDecorator(() => <div data-testid="story" style={{ height: '10px' }} />, {
      globals: {},
      parameters: {},
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

it('keeps the axis attributes on an ancestor of the story so per-story overrides still scope', () => {
  const { story } = mount();

  const scope = story.closest('[data-sb-mode]');

  expect(scope).not.toBeNull();
  expect(scope?.getAttribute('data-sb-mode')).toBe('Light');
});
