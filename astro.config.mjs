// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { site } from './src/data/site.config.mjs';

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'always', format: 'directory' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Familjen Grotesk',
      cssVariable: '--font-familjen',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./node_modules/@fontsource-variable/familjen-grotesk/files/familjen-grotesk-latin-wght-normal.woff2'],
            weight: '400 700',
            style: 'normal',
          },
          {
            src: ['./node_modules/@fontsource-variable/familjen-grotesk/files/familjen-grotesk-latin-wght-italic.woff2'],
            weight: '400 700',
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Doto',
      cssVariable: '--font-doto',
      fallbacks: ['monospace'],
      optimizedFallbacks: false,
      options: {
        variants: [
          {
            src: ['./node_modules/@fontsource-variable/doto/files/doto-latin-full-normal.woff2'],
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
  ],
  vite: {
    build: { assetsInlineLimit: 2048 },
  },
});
