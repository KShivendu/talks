import LineChart from '@blog/LineChart'
import { chunkEncode } from '@data/token-storage'
import { mount } from './mount.jsx'

// Log/log, because the series span 3.4us to 3,300us and the interesting thing
// is the ratio between them, not the difference.
//
// The old title here said brotli grows faster than its input, and the sweep
// does not support it: from 512 to 4,096 tokens the input grows 8x and brotli
// grows 5.9-7.5x, which is slightly SUBLINEAR. Only zstd-19 outgrows its input
// (11.3-12.1x).
//
// The title states the WORST case for us, so it cannot be argued with: across
// all three corpora and all four sizes, the cheapest byte codec still costs
// 8.1-17.7x more than the dearest token method. Comparing the extremes instead
// would give 526x, which is true but picks its opponent.
mount(
  <LineChart
    title="Token IDs encode 8-18x cheaper than even the fastest byte codec"
    xLabel="chunk size (tokens)"
    yLabel="encode µs per chunk"
    xScale="log"
    yScale="log"
    xTicks={chunkEncode.xTicks}
    height={250}
    views={chunkEncode.views}
  />
)
