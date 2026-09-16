// No `import { defineAppSetup } from '@slidev/types'`: it is a transitive dep
// and pnpm's strict layout will not resolve it from here. defineAppSetup is an
// identity helper, so a plain default export does the same job.

/*
 * $asset('imgs/hero.png') -> '/token-storage/imgs/hero.png' in the build,
 *                            '/imgs/hero.png' in dev.
 *
 * Vite rewrites asset URLs it can see in markup, but not values inside Slidev
 * frontmatter (`layout: image`, `background:`), and not every raw src. Those
 * stayed root-absolute and resolved to the site root once deployed under a
 * base path, so the hero and both full-bleed PNGs rendered blank.
 */
export default ({ app }: { app: any }) => {
  app.config.globalProperties.$asset = (p: string) =>
    `${import.meta.env.BASE_URL}${String(p).replace(/^\//, '')}`
}
