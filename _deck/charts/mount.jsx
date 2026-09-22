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
  //
  // overflow:hidden on top of that, because a responsive chart plus an
  // auto scrollbar is a feedback loop: the chart lays out at the full frame
  // width, comes out a hair too tall, the browser adds a 15px vertical bar,
  // the chart re-renders into the narrower box and now FITS -- but dropping
  // the bar would make it overflow again, so the bar stays forever on a
  // document with nothing to scroll. Clipping instead breaks the loop, and
  // the frames on the slides are sized to the content anyway.
  reset.textContent =
    'html, body { overflow: hidden; }' +
    '#root > * { margin-top: 0 !important; margin-bottom: 0 !important; }'
  document.head.appendChild(reset)
  createRoot(document.getElementById('root')).render(element)
}
