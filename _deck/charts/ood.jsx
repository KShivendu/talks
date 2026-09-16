import BarChart from '@blog/BarChart'
import { oodAuc } from '@data/token-storage'
import { mount } from './mount.jsx'

// The ANS coder already computes -log2 P(token), so this separability comes
// for free with the compression -- no extra pass, no extra model.
mount(
  <BarChart
    orientation="horizontal"
    valueLabel="AUC, separating out-of-domain chunks (1.0 = perfect)"
    valueMax={1.05}
    valueTicks={[0, 0.25, 0.5, 0.75, 1]}
    height={240}
    categories={oodAuc.categories}
    series={[
      {
        name: 'AUC from the entropy the coder already computed',
        values: oodAuc.values,
        color: '#dc244C',
        text: oodAuc.values.map((v) => v.toFixed(3)),
        textPosition: 'outside',
      },
    ]}
  />
)
