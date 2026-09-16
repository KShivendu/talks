// Standalone React app for the deck's interactive charts.
//
// These render inside an <iframe> on a Slidev slide. That is the whole point:
// Slidev scales each slide with a CSS transform, and a transformed ancestor
// becomes the containing block for `position: fixed` children, so the blog's
// cursor-following tooltip (left = e.clientX + 14) landed ~1.3x off. An iframe
// is its own browsing context, so clientX and fixed positioning resolve against
// the iframe's own viewport and the components behave exactly as on the blog.
//
// It also means no Vue anywhere in this build: no Vue->React bridge, no fight
// with @vitejs/plugin-vue-jsx over .jsx files, no React duplication.
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const r = (p) => resolve(here, p)
const BLOG = r('../../../blog')

if (!existsSync(BLOG)) {
  throw new Error(`Blog repo not found at ${BLOG}. The charts import <BarChart> from it.`)
}

export default {
  root: here,
  base: './',
  // No @vitejs/plugin-react: nothing else here claims .jsx, so esbuild's own
  // JSX transform is enough, and it avoids a plugin/Vite version mismatch
  // (plugin-react 6 wants Vite 7; Slidev pins Vite 6).
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  optimizeDeps: { esbuildOptions: { jsx: 'automatic', jsxImportSource: 'react' } },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@blog': resolve(BLOG, 'components'),
      '@viz': resolve(BLOG, 'lib/viz-palette'),
      '@data': r('../data'),
      // the only two framework couplings the blog's charts have
      'next/dynamic': r('../shims/dynamic.jsx'),
      'next-themes': r('../shims/theme.jsx'),
    },
  },
  server: { fs: { allow: [here, r('..'), BLOG] } },
  build: {
    // emitted into the Slidev public dir, so slides load them as /charts/*.html
    outDir: r('../public/charts'),
    emptyOutDir: true,
    rollupOptions: {
      input: { ratio: r('ratio.html') },
    },
  },
}
