import { createRoot } from 'react-dom/client'
import BarChart from '@blog/BarChart'
import { ratioViews } from '@data/token-storage'

// `?dark` lets the slide tell the iframe which theme to use; the next-themes
// shim reads the `dark` class off this document's own <html>.
if (new URLSearchParams(location.search).has('dark')) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')).render(
  <BarChart
    orientation="horizontal"
    valueLabel="compression ratio vs raw UTF-8 (higher is better)"
    valueUnit="×"
    valueMax={6.4}
    valueTicks={[0, 1, 2, 3, 4, 5, 6]}
    height={255}
    views={ratioViews}
  />
)
