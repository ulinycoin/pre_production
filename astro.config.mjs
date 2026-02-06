import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.GH_PAGES ? 'https://ulinycoin.github.io/pre_production' : 'https://localpdf.online',
  base: process.env.GH_PAGES ? '/pre_production/' : '/',
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/blog/draft/'),
    })
  ],
  output: 'static',
  build: {
    format: 'file',
    inlineStylesheets: 'auto', // Inline small CSS automatically
  },
  vite: {
    build: {
      cssCodeSplit: true, // Split CSS by route
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  },
});
