import BarChart from '@blog/BarChart'
import { ratioViews } from '@data/token-storage'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

// The slide asks "does it hold beyond English?", so open on Hindi rather than
// making the room wait for a click. Hindi is also the sharpest case: r50k sits
// at 0.84x, below the break-even line, while o200k reaches 2.55x raw.
// BarChart picks the dataset flagged `default: true` (see defaultDatasetIdx).
const hindiFirst = ratioViews.map((v) => ({
  ...v,
  datasets: v.datasets.map((d) => (d.label === 'Hindi' ? { ...d, default: true } : d)),
}))

mount(
  <BarChart
    orientation="horizontal"
    valueLabel="compression ratio vs raw UTF-8 (higher is better)"
    valueUnit="×"
    valueMax={6.4}
    valueTicks={[0, 1, 2, 3, 4, 5, 6]}
    height={243}
    chrome={qdrantChrome}
    views={hindiFirst}
  />
)
