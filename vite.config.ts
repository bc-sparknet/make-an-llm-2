import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

// `base: './'` + HashRouter means the built site works from any static host
// or sub-path (GitHub Pages, Netlify, a local file server) without config.
export default defineConfig({
  base: './',
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
});
