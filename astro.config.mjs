// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import remarkWikilinks from './remark-wikilinks.mjs';
import remarkBibleCallout from './remark-bible-callout.mjs';
import remarkHighlight from './remark-highlight.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), {
      name: 'witness-cues-entry',
      apply: 'build',
      // Emit a standalone browser entry without adding a script to unflagged pages.
      applyToEnvironment(environment) { return environment.name === 'client'; },
      buildStart() {
        this.emitFile({
          type: 'chunk',
          id: fileURLToPath(new URL('./src/lib/witness-cues.ts', import.meta.url)),
          fileName: '_astro/witness-cues.js',
        });
      },
    }]
  },

  integrations: [react(), mdx()],

  markdown: {
    remarkPlugins: [remarkBibleCallout, remarkHighlight, remarkWikilinks],
  },
});