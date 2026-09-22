import BarChart from '@blog/BarChart'
import { ifSpread } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Two views behind a toggle, because the two comparisons answer different
// questions and showing only the second made a 10-of-13 win look like a loss.
// Amaranth where inference-free is ahead, grey where it is behind, in both.
const AMARANTH = '#dc244c'
const GREY = '#8a9099'
const view = (label, values, valueLabel) => ({
  label,
  categories: ifSpread.categories,
  series: [{
    name: label,
    values,
    colors: values.map((v) => (v > 0 ? AMARANTH : GREY)),
    text: values.map((v) => (v > 0 ? '+' : '') + v.toFixed(1)),
    textPosition: 'outside',
  }],
  valueLabel,
})

mount(
  <BarChart
    orientation="horizontal"
    valueLabel="NDCG@10 difference"
    valueTicks={[[-15, '-15'], [-10, '-10'], [-5, '-5'], [0, '0'], [10, '+10'], [20, '+20']]}
    valueMax={28}
    valueMin={-18}
    showLegend={false}
    height={296}
    barGap={0.32}
    chrome={qdrantChrome}
    views={[
      view('vs BM25', ifSpread.vsBM25, 'NDCG@10, inference-free minus BM25'),
      view('vs full SPLADE', ifSpread.vsFull, 'NDCG@10, inference-free minus full'),
    ]}
  />
)
