// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import remarkWikilinks from './remark-wikilinks.mjs';
import remarkBibleCallout from './remark-bible-callout.mjs';
import remarkHighlight from './remark-highlight.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), mdx()],

  markdown: {
    remarkPlugins: [remarkBibleCallout, remarkHighlight, remarkWikilinks],
  },
});