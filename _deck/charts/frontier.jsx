import LineChart from '@blog/LineChart'
import { frontier } from '@data/token-storage'
import { mount } from './mount.jsx'
import { qdrantChrome } from './qdrant-chrome.js'

/*
 * Live scatter, not the PNG it used to be. showLine:false makes LineChart plot
 * markers only, and it hit-tests in 2D, so each point carries its own tooltip
 * -- the reason this is worth having interactive at all: the room can ask about
 * any single point instead of reading a caption.
 *
 * This could not be built until the blog's LineChart marker TDZ was fixed. A
 * scatter is nothing but markers, so it crashed outright.
 *
 * Up and to the left is better: more compression, less time to decode.
 */
mount(
  <LineChart
    title="English, o200k, 512-token chunks — up and to the left is better"
    xLabel="decode µs per chunk (log)"
    yLabel="compression ratio"
    xScale="log"
    height={238}
    chrome={qdrantChrome}
    series={frontier.series}
  />
)
