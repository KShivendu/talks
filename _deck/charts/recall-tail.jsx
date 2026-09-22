import BarChart from '@blog/BarChart'
import { recallTail } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Grouped, not stacked, and absolute rather than differences. A delta between
// two distributions' quartiles is not a quantity any query experienced, so the
// bars carry the values themselves and the reader does the comparison.
const GREY = '#8a9099'   // BM25, the floor
const LIGHT = '#ef5a7c'  // full SPLADE
const AMARANTH = '#dc244c' // inference-free, the subject of the talk

const bars = (name, values, color) => ({
  name,
  values,
  color,
  text: values.map((v) => v.toFixed(0)),
  textPosition: 'outside',
})

mount(
  <BarChart
    orientation="vertical"
    subtitle="Recall@10 pooled over 649 NanoBEIR queries"
    valueLabel="Recall@10"
    valueUnit="%"
    valueTicks={[0, 25, 50, 75, 100]}
    valueMax={112}
    height={300}
    barGap={0.3}
    chrome={qdrantChrome}
    categories={recallTail.categories}
    series={[
      bars('BM25', recallTail.bm25, GREY),
      bars('full SPLADE', recallTail.full, LIGHT),
      bars('inference-free', recallTail.inferenceFree, AMARANTH),
    ]}
  />
)
