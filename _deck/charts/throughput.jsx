import BarChart from '@blog/BarChart'
import { throughput } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Log scale: 1,439 against 58 is a 25x range and a linear axis would flatten
// every GPU bar into the baseline. This is the bill for free queries.
mount(
  <BarChart
    orientation="vertical"
    valueLabel="docs / sec (log)"
    valueUnit=" docs/sec"
    valueScale="log"
    valueMin={40}
    valueMax={3000}
    valueTicks={[[100, '100'], [1000, '1,000']]}
    showLegend={false}
    height={300}
    chrome={qdrantChrome}
    categories={throughput.categories}
    series={[
      {
        name: 'doc encoding throughput',
        values: throughput.values,
        colors: throughput.colors,
        text: throughput.text,
        textPosition: 'outside',
      },
    ]}
  />
)
