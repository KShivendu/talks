import LineChart from '@blog/LineChart'
import { chunkRead } from '@data/token-storage'
import { mount } from './mount.jsx'

// Decode ALONE, on equal terms: decompress_us for the byte codecs, read_us for
// the token methods (already IDs, so read_us is their pure decode).
//
// The earlier version plotted a byte codec's full `read_us`, which bundles the
// mandatory tokenize -- ~99% of the number and identical across all four
// codecs. That compared a codec against a tokenizer and made the four grey
// lines overlap. Fairer to concede pure decode, which the byte codecs win
// (LZ4 0.9us against +freq 4.2us on English at 512), and put the tokenize tax
// in a line under the chart where it belongs.
mount(
  <LineChart
    title="Decode alone: what each codec costs to unpack"
    xLabel="chunk size (tokens)"
    yLabel="decode µs per chunk"
    xScale="log"
    yScale="log"
    xTicks={chunkRead.xTicks}
    height={230}
    views={chunkRead.views}
  />
)
