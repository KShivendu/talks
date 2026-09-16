// NOT BUILT: the 'ngram' slide was cut from the deck. Re-add 'ngram' to the
// charts npm script to bring it back; the data is still generated.
import BarChart from '@blog/BarChart'
import { ngram } from '@data/token-storage'
import { mount } from './mount.jsx'

// The wall: a bigram table is a real gain, a trigram is not worth ~3x the
// table size. And the language-model ceiling is ~12x, unreachable by stacking.
mount(
  <BarChart
    orientation="vertical"
    valueLabel="compression ratio vs raw UTF-8"
    valueUnit="×"
    valueMax={5.6}
    valueTicks={[0, 1, 2, 3, 4, 5]}
    height={250}
    views={ngram.views.map((v) => ({
      label: v.label,
      categories: ngram.categories,
      series: [
        {
          name: 'ratio',
          values: v.values,
          colors: ['#94a3b8', '#dc244C', '#dc244C'],
          text: v.values.map((x) => `${x.toFixed(2)}×`),
          textPosition: 'outside',
        },
      ],
    }))}
  />
)
