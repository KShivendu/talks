import BarChart from '@blog/BarChart'
import { ifSpread } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// A diverging delta chart: bars grow LEFT from a zero line, so longer = worse.
// Horizontal, because 13 dataset names will not fit as vertical tick labels.
// scifact is amaranth only to mark it as the dataset every earlier slide used;
// the point of the chart is that it sits mid-pack, not that it is special.
const AMARANTH = '#dc244c'
const GREY = '#8a9099'
const colors = ifSpread.categories.map((c) => (c === 'scifact' ? AMARANTH : GREY))

mount(
  <BarChart
    orientation="horizontal"
    valueLabel="NDCG@10, inference-free minus full"
    valueUnit=""
    valueTicks={[[-0.08, '-0.08'], [-0.06, '-0.06'], [-0.04, '-0.04'], [-0.02, '-0.02'], [0, '0'], [0.02, '+0.02']]}
    valueMax={0.025}
    showLegend={false}
    height={330}
    barGap={0.32}
    chrome={qdrantChrome}
    categories={ifSpread.categories}
    series={[
      {
        name: 'IF penalty',
        values: ifSpread.values,
        colors,
        // the one positive bar needs its sign, or it reads as another loss
        text: ifSpread.values.map((v) => (v > 0 ? '+' : '') + v.toFixed(4)),
        textPosition: 'outside',
      },
    ]}
  />
)
