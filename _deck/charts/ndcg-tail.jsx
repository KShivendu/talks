import BarChart from '@blog/BarChart'
import { ndcgTail } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Grouped, per dataset, absolute. A delta between two distributions' quartiles
// is not a quantity any query experienced, so the bars carry the values
// themselves. p25 leads because that is the view the mean hides.
const GREY = '#8a9099'     // BM25, the floor
const LIGHT = '#ef5a7c'    // full SPLADE
const AMARANTH = '#dc244c' // inference-free, the subject of the talk

const view = (label, d) => ({
  label,
  categories: ndcgTail.categories,
  series: [
    { name: 'BM25', values: d.bm25, color: GREY },
    { name: 'full SPLADE', values: d.full, color: LIGHT },
    { name: 'inference-free', values: d.inferenceFree, color: AMARANTH },
  ],
})

mount(
  <BarChart
    orientation="horizontal"
    valueLabel="NDCG@10"
    valueTicks={[0, 25, 50, 75, 100]}
    valueMax={104}
    height={310}
    barGap={0.26}
    chrome={qdrantChrome}
    views={[
      view('p25', ndcgTail.p25),
      view('p50', ndcgTail.p50),
      view('mean', ndcgTail.mean),
    ]}
  />
)
