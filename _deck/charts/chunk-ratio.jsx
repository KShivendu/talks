import LineChart from '@blog/LineChart'
import { chunkRatio } from '@data/token-storage'
import { mount } from './mount.jsx'

// Order-0 token methods are flat: per-token entropy is additive, so chunk size
// barely moves them. LZ-family methods climb by finding cross-chunk repeats.
mount(
  <LineChart
    title="Token methods stay flat; byte codecs need big chunks"
    xLabel="chunk size (tokens)"
    yLabel="compression ratio"
    xScale="log"
    xTicks={chunkRatio.xTicks}
    height={250}
    views={chunkRatio.views}
  />
)
