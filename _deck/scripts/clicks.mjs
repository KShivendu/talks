/*
 * Step a slide through its clicks and report what is revealed at each one.
 *
 * The full-deck screenshotter uses ?clicks=99, which shows everything, so it
 * cannot tell a slide that reveals in seven steps from one that dumps all
 * seven at once. This walks the steps.
 *
 * Usage:  node scripts/clicks.mjs <slide> [maxClicks]
 */
import { chromium } from '/home/kshivendu/projects/blog/node_modules/playwright-core/index.mjs'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const ROOT = new URL('../../token-storage/', import.meta.url).pathname
const PORT = 8862
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
if (!existsSync(ROOT)) throw new Error(`no build at ${ROOT} -- run: npm run build`)

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])
  if (!path.startsWith('/token-storage/')) return res.writeHead(404).end('404')
  const raw = path.slice('/token-storage/'.length)
  const rel = !raw || raw.endsWith('/') ? raw + 'index.html' : normalize(raw)
  try {
    const body = await readFile(join(ROOT, rel))
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] || 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('404')
  }
}).listen(PORT)

const slide = process.argv[2] || '1'
const max = Number(process.argv[3] || 12)
const browser = await chromium.launch({
  executablePath: '/home/kshivendu/.cache/ms-playwright/chromium-1181/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

let prev = -1
for (let c = 0; c <= max; c++) {
  await page.goto(`http://localhost:${PORT}/token-storage/#/${slide}?clicks=${c}`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(400)
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.slidev-page')].find((x) => {
      const b = x.getBoundingClientRect()
      return b.width > 0 && b.left > -50 && b.left < 100
    })
    const items = [...(el?.querySelectorAll('li') || [])]
    // an item still waiting its turn is hidden or fully transparent
    const shown = items.filter((n) => {
      const cs = getComputedStyle(n)
      return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05
    })
    return {
      total: items.length,
      shown: shown.length,
      last: shown.length ? shown[shown.length - 1].innerText.trim().slice(0, 52) : '',
      depth: shown.length ? (shown[shown.length - 1].closest('li li') ? 'sub' : 'top') : '',
    }
  })
  const mark = r.shown === prev ? '   (no change)' : ''
  console.log(`clicks=${String(c).padStart(2)}  ${String(r.shown).padStart(2)}/${r.total} shown  ` +
    `${r.depth.padEnd(3)} ${r.last}${mark}`)
  if (r.shown === r.total && prev === r.total) break
  prev = r.shown
}
await browser.close()
server.close()
