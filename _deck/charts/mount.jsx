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
  // The blog's chart components ship `margin: 1.5rem 0`, which reads as
  // breathing room in an article and as 48px of unreachable dead space inside a
  // fixed-height iframe -- enough to push the document past the frame and give
  // every chart a scrollbar. On a slide the slide itself is the margin.
  //
  // !important is not decoration here: BarChart sets that margin as an INLINE
  // style (components/BarChart.jsx, `style={{ margin: '1.5rem 0' }}`), and an
  // inline style beats any stylesheet rule without it.
  const reset = document.createElement('style')
  reset.textContent = '#root > * { margin-top: 0 !important; margin-bottom: 0 !important; }'
  document.head.appendChild(reset)
  createRoot(document.getElementById('root')).render(element)
}
