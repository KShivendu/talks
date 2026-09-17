import TokenCompressionAnimated from '@blog/TokenCompressionAnimated'
import { mount } from './mount.jsx'
import { qdrantHero } from './qdrant-chrome.js'

/*
 * The blog's animated hero, retinted for the talk. It shows the same input
 * running down two pipelines at once -- LZ4 over bytes on top, the token path
 * below -- which is the whole argument before a word is said, so it earns the
 * title slide far better than a screenshot of itself.
 *
 * The component hardcoded its own 14 colour roles (green token path, amber
 * LZ4). It now takes a `palette` prop instead, so this retints rather than
 * forking 1,000 lines.
 */
mount(<TokenCompressionAnimated palette={qdrantHero} />)
