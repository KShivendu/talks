import BarChart from '@blog/BarChart'
import { ratioViews } from '@data/token-storage'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

mount(
  <BarChart
    orientation="horizontal"
    valueLabel="compression ratio vs raw UTF-8 (higher is better)"
    valueUnit="×"
    valueMax={6.4}
    valueTicks={[0, 1, 2, 3, 4, 5, 6]}
    height={243}
    chrome={qdrantChrome}
    views={ratioViews}
  />
)
