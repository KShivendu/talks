import BarChart from '@blog/BarChart'
import { agentRead } from '@data/token-storage'
import { mount } from './mount.jsx'

// Linear on purpose. The story is the cliff: every byte codec piles up at
// ~450us on English because they all pay the same mandatory tokenize, however
// fast they decompress -- and the token bars are a rounding error beside it. A
// log axis would make the bars comparable and destroy exactly that impression.
mount(
  <BarChart
    orientation="vertical"
    valueLabel="microseconds"
    valueUnit="us"
    valueMax={500}
    valueTicks={[0, 100, 200, 300, 400, 500]}
    height={255}
    views={agentRead}
  />
)
