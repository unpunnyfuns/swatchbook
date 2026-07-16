import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightVersions from 'starlight-versions';

export default defineConfig({
  site: 'https://unpunnyfuns.github.io',
  base: '/swatchbook',
  integrations: [
    react(),
    starlight({
      title: 'swatchbook',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/unpunnyfuns/swatchbook' },
      ],
      plugins: [starlightVersions({ versions: [{ slug: '1.0' }] })],
      sidebar: [{ label: 'Start', items: ['index'] }],
    }),
  ],
});
