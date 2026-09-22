import BarChart from '@blog/BarChart'
import { agentWrite } from '@data/token-storage'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Log, unlike the read chart. Write spans 1.9us (an agent handing over token
// IDs it already has) to 960us (zstd --train), so a linear axis renders every
// token bar as a flat line against the axis and the "writes are nearly free"
// point disappears. Here the ratio is the message, so a ratio axis is right.
mount(
  <BarChart
    orientation="vertical"
    valueLabel="microseconds (log scale)"
    valueUnit="us"
    valueScale="log"
    // valueMin is the log floor and the bar base. Left unset it defaults to the
    // smallest datum (1.9us), which gives that bar zero height -- the one bar
    // the slide exists to show. Decade ticks for the same reason: linear ticks
    // on a log axis bunch 200..1000 into the top sliver.
    valueMin={1}
    valueMax={1000}
    valueTicks={[1, 10, 100, 1000]}
    height={255}
    chrome={qdrantChrome}
    views={agentWrite}
  />
)
