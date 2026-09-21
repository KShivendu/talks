import LineChart from '@blog/LineChart'
import { frontier } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// showLine:false makes this a scatter. Log x, because the interesting distance is
// 4ms against 57ms and a linear axis would put every fast method on the spine.
// Up and to the LEFT is better.
mount(
  <LineChart
    title="BEIR scifact, Qdrant — up and to the left is better"
    xLabel="median query latency (ms), log"
    yLabel="NDCG@10"
    xScale="log"
    xTicks={[[3, '3'], [4, '4'], [5, '5'], [10, '10'], [20, '20'], [60, '60']]}
    xMin={2.6}
    xMax={95}
    yMin={0.678}
    yMax={0.724}
    yTicks={[[0.68, '0.68'], [0.69, '0.69'], [0.7, '0.70'], [0.71, '0.71'], [0.72, '0.72']]}
    xUnit=" ms"
    yTipDecimals={4}
    height={300}
    chrome={qdrantChrome}
    series={frontier.map((s) => ({ ...s, showLine: false }))}
  />
)
