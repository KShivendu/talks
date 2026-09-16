import LineChart from '@blog/LineChart'
import { chunkRead } from '@data/token-storage'
import { mount } from './mount.jsx'

// The companion to chunk-encode, and the one that actually matters: a write
// happens once, a read happens on every retrieval forever.
//
// Title says "overlap" deliberately: the four grey lines are drawn but sit on
// top of each other, and from the back of a room that reads as missing lines
// unless the title says otherwise. The flatness is the finding, not the gap. read_us is decompress plus the
// mandatory tokenize, and tokenize is ~99% of it, so all four byte codecs sit
// within 1.0-3.2% of each other at every corpus and every size. Picking a
// better byte codec buys you almost nothing here. (The gap itself is 6.6-17x
// against the cheapest byte codec, up to 119x against the dearest.)
mount(
  <LineChart
    title="The grey lines ARE the dashed line: read cost is the tokenizer"
    xLabel="chunk size (tokens)"
    yLabel="read µs per chunk"
    xScale="log"
    yScale="log"
    xTicks={chunkRead.xTicks}
    height={250}
    views={chunkRead.views}
  />
)
