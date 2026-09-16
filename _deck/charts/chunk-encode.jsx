import LineChart from '@blog/LineChart'
import { chunkEncode } from '@data/token-storage'
import { mount } from './mount.jsx'

// The point of the log axis: brotli's quality-11 search does not amortise.
// 8x the input costs it ~18-35x the time, while the token coders stay linear.
mount(
  <LineChart
    title="Encode cost: brotli grows faster than its input"
    xLabel="chunk size (tokens)"
    yLabel="encode µs per chunk"
    xScale="log"
    yScale="log"
    xTicks={chunkEncode.xTicks}
    height={250}
    views={chunkEncode.views}
  />
)
