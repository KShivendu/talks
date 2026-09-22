import BarChart from '@blog/BarChart'
import { throughput } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Log scale: 13,778 against 89 is a 155x range and a linear axis would flatten
// every GPU bar into the baseline. This is the bill for free queries.
mount(
  <BarChart
    orientation="vertical"
    valueLabel="docs / sec (log)"
    valueUnit=" docs/sec"
    valueScale="log"
    valueMin={60}
    valueMax={30000}
    valueTicks={[[100, '100'], [1000, '1,000'], [10000, '10,000']]}
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
