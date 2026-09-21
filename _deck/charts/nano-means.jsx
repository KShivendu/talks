import BarChart from '@blog/BarChart'
import { nanoGap } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Zero is full SPLADE, bars grow LEFT, so bar length = what you give up.
// Absolute NDCG@10 rides along in the label so nobody has to do the addition.
mount(
  <BarChart
    orientation="horizontal"
    title="Distance from full SPLADE, mean over 13 NanoBEIR datasets"
    subtitle="zero = naver/splade-v3 at 0.6337 NDCG@10"
    valueTicks={[[-0.09, '-0.09'], [-0.06, '-0.06'], [-0.03, '-0.03'], [0, '0']]}
    valueMax={0.022}  // room for the outside bar labels, which sit right of zero
    showLegend={false}
    height={240}
    barGap={0.38}
    chrome={qdrantChrome}
    categories={nanoGap.categories}
    series={[
      {
        name: 'gap to full SPLADE',
        values: nanoGap.values,
        colors: nanoGap.colors,
        text: nanoGap.text,
        textPosition: 'outside',
      },
    ]}
  />
)
