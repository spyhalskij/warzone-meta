import { defineConfig } from 'astro/config';

// GitHub Pages project site, for spyhalskij/warzone-meta.
export default defineConfig({
  site: process.env.SITE_URL || 'https://spyhalskij.github.io',
  base: process.env.BASE_PATH || '/warzone-meta/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { host: true }
});
