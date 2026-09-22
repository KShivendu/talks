import LineChart from '@blog/LineChart'
import { floorSweep } from '@data/if-splade'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// Zero on the y axis is "no floor at all". Everything below the line is a
// floor that made the model worse. The two x ticks that matter are 0.20 and
// 0.31, the values the original post recommends -- all three curves are
// already underwater by then.
mount(
  <LineChart
    title="Change in mean NDCG@10 over 13 NanoBEIR datasets"
    xLabel="C, the floor coefficient"
    yLabel="change in NDCG@10"
    xMin={-0.02}
    xMax={0.84}
    xTicks={[[0, '0'], [0.1, '0.1'], [0.2, '0.20'], [0.31, '0.31'], [0.5, '0.5'], [0.8, '0.8']]}
    yMin={-7.2}
    yMax={1.2}
    yTicks={[[1, '+1'], [0, '0'], [-2, '-2'], [-4, '-4'], [-6, '-6']]}
    yTipDecimals={2}
    height={268}
    chrome={qdrantChrome}
    series={floorSweep}
  />
)
