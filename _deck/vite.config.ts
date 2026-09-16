// No `import { defineConfig } from 'vite'` on purpose: vite is a transitive
// dep of @slidev/cli, and under pnpm's strict layout it is not resolvable from
// here. Adding it directly risks two Vite copies. A plain object works;
// defineConfig only ever bought us types.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const r = (p: string) => resolve(here, p)

// The blog is the single source of truth for viz components and the palette.
// We alias straight into it instead of vendoring a copy, which is only safe
// because talks.kshivendu.dev is GitHub Pages serving committed static output:
// the build runs on this machine, never in CI. If that ever changes, this
// breaks loudly here rather than silently shipping a half-built deck.
const BLOG = r('../../blog')
if (!existsSync(BLOG)) {
  throw new Error(
    `Blog repo not found at ${BLOG}.\n` +
      `The deck imports <BarChart> and lib/viz-palette directly from it.\n` +
      `Clone it next to this repo, or set BLOG_PATH and update vite.config.ts.`
  )
}

export default {
  resolve: {
    alias: {
      // Charts are NOT imported here any more: they build separately under
      // charts/ and load in an iframe. Kept only so a slide can still reach
      // blog assets if needed.
      '@viz': resolve(BLOG, 'lib/viz-palette'),
      // Slidev compiles each slide's <script setup> into a virtual module, so a
      // relative "../data/x" has no base to resolve against. Alias it.
      '@data': r('./data'),
      // the only two framework couplings those components have
      'next/dynamic': r('./shims/dynamic.jsx'),
      'next-themes': r('./shims/theme.jsx'),
    },
  },
  server: {
    // Vite refuses to serve files outside its root unless told otherwise
    fs: { allow: [here, BLOG] },
  },
}
