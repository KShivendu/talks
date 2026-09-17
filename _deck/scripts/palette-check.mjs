/*
 * Check a chart palette for two things the eye cannot verify by squinting:
 *   1. every pair of series colours is perceptually distinct (CIE76 dE on Lab)
 *   2. every series colour is legible on BOTH grounds the deck renders on
 *
 * Thresholds: dE >= 15 for "tellable apart at a glance across a room", and a
 * 3:1 contrast ratio against the ground, which is the WCAG bar for graphical
 * objects (not the 4.5:1 text bar -- a 2px line is not body copy).
 */
const LIGHT = '#ffffff'
const DARK = '#0b0f19'

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = (h) => { const [r, g, b] = hex(h).map(srgb); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const lab = (h) => {
  let [r, g, b] = hex(h).map(srgb)
  let [X, Y, Z] = [
    (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883,
  ]
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  ;[X, Y, Z] = [f(X), f(Y), f(Z)]
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)]
}
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]))

export function check(name, series) {
  console.log(`\n== ${name}`)
  console.log('series'.padEnd(16) + 'hex'.padEnd(10) + 'on light'.padStart(10) + 'on dark'.padStart(10))
  let bad = []
  for (const [label, c] of series) {
    const cl = contrast(c, LIGHT), cd = contrast(c, DARK)
    const flag = cl < 3 || cd < 3 ? '  <- low' : ''
    if (cl < 3) bad.push(`${label} invisible on light (${cl.toFixed(1)}:1)`)
    if (cd < 3) bad.push(`${label} invisible on dark (${cd.toFixed(1)}:1)`)
    console.log(label.padEnd(16) + c.padEnd(10) +
      (cl.toFixed(1) + ':1').padStart(10) + (cd.toFixed(1) + ':1').padStart(10) + flag)
  }
  console.log('  closest pairs:')
  const pairs = []
  for (let i = 0; i < series.length; i++)
    for (let j = i + 1; j < series.length; j++)
      pairs.push([dE(series[i][1], series[j][1]), series[i][0], series[j][0]])
  pairs.sort((a, b) => a[0] - b[0])
  for (const [d, a, b] of pairs.slice(0, 4)) {
    const flag = d < 15 ? '  <- TOO CLOSE' : ''
    console.log(`    dE ${d.toFixed(1).padStart(5)}  ${a} / ${b}${flag}`)
  }
  if (bad.length) console.log('  PROBLEMS: ' + bad.join('; '))
  return pairs[0][0]
}
