import BarChart from '@blog/BarChart'
import { activations } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Grey for the two words the document actually contains, Amaranth for the eight
// it does not. That split is the whole point of the slide: SPLADE adds
// vocabulary rather than reweighting what is already there.
mount(
  <BarChart
    orientation="horizontal"
    valueLabel="activation weight"
    valueMax={2.1}
    valueTicks={[0, 0.5, 1, 1.5, 2]}
    showLegend={false}
    height={300}
    chrome={qdrantChrome}
    categories={activations.categories}
    series={[
      {
        name: 'activation',
        values: activations.values,
        colors: activations.colors,
        text: activations.values.map((v) => v.toFixed(2)),
        textPosition: 'outside',
      },
    ]}
  />
)
