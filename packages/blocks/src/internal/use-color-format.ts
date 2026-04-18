import { useEffect, useState } from 'react';
import { addons } from 'storybook/preview-api';
import { type ColorFormat, COLOR_FORMATS } from '#/internal/format-color.ts';

/**
 * Storybook global key carrying the active {@link ColorFormat}. Declared in
 * the addon's preview annotations and set by the toolbar dropdown.
 */
export const COLOR_FORMAT_GLOBAL_KEY = 'swatchbookColorFormat';

const DEFAULT_FORMAT: ColorFormat = 'hex';

interface GlobalsPayload {
  globals?: Record<string, unknown>;
}

/**
 * Read the active color-display format. Subscribes directly to Storybook's
 * channel (`globalsUpdated`) rather than using `useGlobals` so the hook
 * stays safe to call from MDX doc blocks — where the preview HooksContext
 * is absent and `useGlobals` would throw.
 */
export function useColorFormat(): ColorFormat {
  const [format, setFormat] = useState<ColorFormat>(DEFAULT_FORMAT);

  useEffect(() => {
    const channel = addons.getChannel();
    const onGlobals = (payload: GlobalsPayload): void => {
      const next = payload.globals?.[COLOR_FORMAT_GLOBAL_KEY];
      if (typeof next === 'string' && (COLOR_FORMATS as readonly string[]).includes(next)) {
        setFormat(next as ColorFormat);
      }
    };
    channel.on('globalsUpdated', onGlobals);
    channel.on('updateGlobals', onGlobals);
    return () => {
      channel.off('globalsUpdated', onGlobals);
      channel.off('updateGlobals', onGlobals);
    };
  }, []);

  return format;
}
