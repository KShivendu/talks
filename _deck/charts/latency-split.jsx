import BarChart from '@blog/BarChart'
import { latencySplit } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Stacked so the 13x reads as one component rather than a diffuse win: the
// embed segment is the entire difference, and search barely moves.
mount(
  <BarChart
    orientation="vertical"
    stacked
    valueLabel="milliseconds"
    valueUnit=" ms"
    height={300}
    chrome={qdrantChrome}
    categories={latencySplit.categories}
    series={[
      { name: 'Query embed', group: 'total', color: '#dc244c', values: latencySplit.embed },
      { name: 'Search', group: 'total', color: '#8a9099', values: latencySplit.search },
    ]}
  />
)
