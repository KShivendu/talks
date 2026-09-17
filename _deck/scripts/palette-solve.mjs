/*
 * Pick series colours that survive BOTH grounds the deck renders on.
 *
 * The deck is colorSchema:'all', so every series colour must clear 3:1 (the
 * WCAG bar for graphical objects) against white AND against #0b0f19. That rules
 * out a lightness ramp: its light end dies on white and its dark end dies on
 * black. The usable window is a mid-lightness band, so within a family the
 * steps have to separate by hue and chroma instead.
 *
 * Brute-force HSL, keep anything in the window, then greedily pick the set with
 * the largest minimum pairwise dE, anchored on the two brand hues.
 */
const LIGHT = '#ffffff'
const DARK = '#0b0f19'
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (h) => { const [r, g, b] = hx(h).map(srgb); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const lab = (h) => {
  let [r, g, b] = hx(h).map(srgb)
  let [X, Y, Z] = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883]
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  ;[X, Y, Z] = [f(X), f(Y), f(Z)]
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]
}
const dE = (a, b) => { const A = lab(a), B = lab(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) }
const hsl2hex = (h, s, l) => {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255)
}

const ok = (c) => contrast(c, LIGHT) >= 3 && contrast(c, DARK) >= 3

// candidate pools, each family confined to its brand hue neighbourhood
const pool = (h0, h1) => {
  const out = []
  for (let h = h0; h <= h1; h += 2)
    for (let s = 45; s <= 100; s += 5)
      for (let l = 30; l <= 62; l += 2) {
        const c = hsl2hex(h, s, l)
        if (ok(c)) out.push(c)
      }
  return [...new Set(out)]
}

function pick(cands, n, anchors) {
  let best = null
  for (let trial = 0; trial < 4000; trial++) {
    const set = [...anchors]
    while (set.length < n) {
      let bestC = null, bestD = -1
      for (const c of cands) {
        if (set.includes(c)) continue
        const d = Math.min(...set.map((s) => dE(s, c))) + (trial ? Math.random() * 6 : 0)
        if (d > bestD) { bestD = d; bestC = c }
      }
      set.push(bestC)
    }
    let mind = Infinity
    for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) mind = Math.min(mind, dE(set[i], set[j]))
    if (!best || mind > best.d) best = { d: mind, set }
  }
  return best
}

const blues = pool(230, 275)
const reds = pool(330, 365)
console.log(`candidates clearing 3:1 on both grounds -- blue ${blues.length}, red ${reds.length}`)
const B = pick(blues, 4, ['#6047ff'])
const R = pick(reds, 3, ['#dc244c'])
console.log('\nbyte family (4, anchored on Neon Blue):', B.set.join(' '), ` min dE ${B.d.toFixed(1)}`)
console.log('token family (3, anchored on Amaranth):', R.set.join(' '), ` min dE ${R.d.toFixed(1)}`)
const all = [...B.set, ...R.set]
let mind = Infinity
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) mind = Math.min(mind, dE(all[i], all[j]))
console.log(`\nall 7 together: min dE ${mind.toFixed(1)}`)
for (const c of all) console.log(`  ${c}  light ${contrast(c, LIGHT).toFixed(1)}:1   dark ${contrast(c, DARK).toFixed(1)}:1`)
