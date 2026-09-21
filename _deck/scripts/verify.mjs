/*
 * Screenshot the built deck so changes can be eyeballed without a manual pass.
 *
 * Usage:  node scripts/verify.mjs 12 13 chart:chunk-ratio
 *         node scripts/verify.mjs            (every slide)
 *
 * Serves ../token-storage under /token-storage/ -- the same base path the real
 * deploy uses, so a broken base shows up here instead of in production. Shots
 * land in scripts/.shots/ (gitignored).
 */
import { chromium } from '/home/kshivendu/projects/blog/node_modules/playwright-core/index.mjs'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { mkdirSync, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

// DECK=if-splade node scripts/verify.mjs   (defaults to the token-storage deck)
const DECK = process.env.DECK || 'token-storage'
const ROOT = new URL(`../../${DECK}/`, import.meta.url).pathname
const OUT = new URL('./.shots/', import.meta.url).pathname
const PORT = 8861
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }

if (!existsSync(ROOT)) throw new Error(`no build at ${ROOT} -- run: npm run build${DECK === 'token-storage' ? '' : ':splade'}`)
mkdirSync(OUT, { recursive: true })

// No SPA fallback and no prefix stripping: GitHub Pages has neither, and a
// friendlier server here once hid real 404s from the deployed deck.
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])
  if (!path.startsWith(`/${DECK}/`)) return res.writeHead(404).end('404')
  const raw = path.slice(DECK.length + 2)
  // normalize('') is '.', which would make us readFile() a directory and 404
  const rel = !raw || raw.endsWith('/') ? raw + 'index.html' : normalize(raw)
  const file = join(ROOT, rel)
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('404')
  }
}).listen(PORT)

const browser = await chromium.launch({
  executablePath: '/home/kshivendu/.cache/ms-playwright/chromium-1181/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' && !/FloatingVue|favicon/.test(m.text())) errors.push(m.text().slice(0, 110))
})
// Chromium always asks for /favicon.ico; the deck has none and does not need one
page.on('requestfailed', (r) => {
  if (!/favicon\.ico$/.test(r.url())) errors.push(`REQ ${r.url().slice(-60)}`)
})

// Counting `---` in the source overcounts: the headmatter is not a separator,
// per-slide frontmatter adds two more lines each, and `hide: true` slides do
// not render at all. So take an upper bound and stop when Slidev starts
// clamping -- asking for a slide past the end just re-renders the last one.
const src = await readFile(new URL(`../${DECK}.md`, import.meta.url), 'utf8')
const total = (src.match(/^---$/gm) || []).length + 1
const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : Array.from({ length: total }, (_, i) => String(i + 1))

let lastHead = null
let lastChars = null
for (const t of targets) {
  const chart = t.startsWith('chart:')
  const url = chart
    ? `http://localhost:${PORT}/${DECK}/charts/${t.slice(6)}.html`
    : `http://localhost:${PORT}/${DECK}/#/${t}?clicks=99`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.slidev-page')].find((x) => {
      const b = x.getBoundingClientRect()
      return b.width > 0 && b.left > -50 && b.left < 100
    })
    const scope = el || document.body
    const txt = (scope.innerText || '').trim()
    const d = document.documentElement
    return {
      head: txt.split('\n')[0]?.slice(0, 46) || '',
      chars: txt.length,
      iframe: !!scope.querySelector('iframe'),
      img: !!scope.querySelector('img') || getComputedStyle(scope).backgroundImage !== 'none',
      // a series label per line, so a missing series is visible as a count
      legend: [...document.querySelectorAll('svg text')].map((n) => n.textContent),
      overflow: Math.max(0, d.scrollHeight - d.clientHeight, scope.scrollHeight - scope.clientHeight),
      leaked: /^(layout|image|backgroundSize):/m.test(txt),
    }
  })
  if (!chart && lastHead !== null && r.head === lastHead && r.chars === lastChars) {
    console.log(`\n(stopped at ${Number(t) - 1}: slide ${t} clamps to the same content)`)
    break
  }
  if (!chart) {
    lastHead = r.head
    lastChars = r.chars
  }
  const kind = chart ? 'CHART' : r.iframe ? 'chart' : r.img ? 'img  ' : 'text '
  const flags = [
    r.leaked && 'FRONTMATTER-LEAK',
    r.overflow > 4 && `OVERFLOW ${r.overflow}px`,
    !r.iframe && !r.img && r.chars < 12 && 'BLANK',
  ].filter(Boolean)
  console.log(`${t.padStart(14)} ${kind} ${r.head.padEnd(48)} ${flags.join(' ') || ''}`)
  if (chart) {
    const named = r.legend.filter((x) => /^[A-Za-z+]/.test(x) && x.length > 2)
    console.log(`               labels: ${[...new Set(named)].join(', ')}`)
  }
  await page.screenshot({ path: join(OUT, `${t.replace(':', '-').padStart(2, '0')}.png`) })
}

console.log('\nerrors:', errors.length ? [...new Set(errors)].join(' | ') : 'none')
console.log('shots:', OUT)
await browser.close()
server.close()
