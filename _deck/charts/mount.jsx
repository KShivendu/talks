import { createRoot } from 'react-dom/client'

/*
 * Shared harness for every chart page.
 *
 * Each chart is its own HTML entry so it can run in an <iframe> on a slide.
 * That is deliberate: Slidev scales slides with a CSS transform, and a
 * transformed ancestor becomes the containing block for `position: fixed`
 * children, which threw the blog charts' cursor-following tooltip ~1.3x off.
 * An iframe is its own browsing context, so the components behave exactly as
 * they do on the blog.
 *
 * `?dark` is how the slide passes the deck's theme in, since an iframe cannot
 * inherit the `.dark` class from its parent document.
 */
export function mount(element) {
  if (new URLSearchParams(location.search).has('dark')) {
    document.documentElement.classList.add('dark')
  }
  createRoot(document.getElementById('root')).render(element)
}
