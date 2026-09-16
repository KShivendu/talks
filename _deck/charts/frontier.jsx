// NOT BUILT. Re-add 'frontier' to the charts npm script once the blog's
// LineChart is fixed: its marker hit-layer references onCrosshairLeave
// (a const declared ~260 lines below the use) during render, so any series
// with markers throws "Cannot access 'onCrosshairLeave' before initialization".
// A scatter needs markers, so this page cannot work until then.
import LineChart from '@blog/LineChart'
import { frontier } from '@data/token-storage'
import { mount } from './mount.jsx'

// showLine: false turns LineChart into a scatter, and it hit-tests in 2D, so
// each point keeps a real hover tooltip.
mount(
  <LineChart
    title="Pick your point on the curve"
    subtitle="English, o200k, 512-token chunks"
    xLabel="decode µs per chunk (log)"
    yLabel="compression ratio"
    xScale="log"
    height={250}
    series={frontier.series}
  />
)
