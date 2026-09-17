/**
 * Generate data/token-storage.js from the benchmark repo's canonical results.
 *
 * Same rule as charts/make_charts.py in the Marp deck: every number on a slide
 * is read from a result file, never typed by hand. Per token-storage/README.md:
 *
 *   ratios  -> 07_kalcher_baseline/results.json :: table1_full_train_consistent
 *   latency -> 03_latency/latency_grid_results.json   (P-core pinned, serving-cold)
 *
 * Usage:  npm run data
 *         TOKEN_STORAGE_REPO=/path/to/token-storage npm run data
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const REPO = process.env.TOKEN_STORAGE_REPO || resolve(homedir(), 'projects/token-storage')

const ratioPath = resolve(REPO, '07_kalcher_baseline/results.json')
const latPath = resolve(REPO, '03_latency/latency_grid_results.json')
const sweepPath = resolve(REPO, '03_latency/latency_chunksize_sweep_results.json')
const oodPath = resolve(REPO, '06_decorr_ngram_ood/results.json')
for (const p of [ratioPath, latPath, sweepPath, oodPath]) {
  if (!existsSync(p)) {
    console.error(`missing ${p}\nset TOKEN_STORAGE_REPO to the token-storage checkout`)
    process.exit(1)
  }
}

const kalcher = JSON.parse(readFileSync(ratioPath, 'utf8'))
const ratios = kalcher.table1_full_train_consistent.table_median
const chunkRatioRaw = kalcher.chunksize_sweep_ratio.ratio
const lat = JSON.parse(readFileSync(latPath, 'utf8'))
const sweep = JSON.parse(readFileSync(sweepPath, 'utf8')).sweep
const ood = JSON.parse(readFileSync(oodPath, 'utf8'))

/*
 * Qdrant brand palette, with one rule: the byte codecs are the competition, not
 * the subject. They stay neutral grey and carry no markers, so they read as one
 * recessive band. Amaranth is spent only on the token-native methods, which is
 * what makes it mean something when it appears.
 *
 * Every colour clears 3:1 (the WCAG bar for graphical objects) against BOTH
 * white and Qdrant Black #0B0F19, because the deck is colorSchema:'all'. That
 * is a real constraint: neutrals only satisfy it between #606060 and #949494,
 * which is exactly where the grey ramp below sits. Verified by
 * scripts/palette-check.mjs.
 */
const AMARANTH = '#dc244c'
const BLACK = '#0b0f19'

// byte codecs: one recessive band, weakest to strongest. Narrow on purpose --
// they are meant to be read as a group, not told apart at a glance.
const GREY_L = '#8a9099' //  3.2:1 light  5.9:1 dark
const GREY_M = '#7b828d' //  3.9:1        4.9:1
const GREY_D = '#6c7480' //  4.7:1        4.1:1
const GREY_XD = '#5d6573' //  5.9:1        3.3:1

// token-native: the emphasised family. Markers (ring/star/diamond) carry
// identity, so these stay close to the brand hue instead of chasing distance.
const RED_L = '#ef5a7c' //  3.3:1 light  5.9:1 dark
const RED = AMARANTH //  4.8:1        4.0:1
const RED_D = '#a83865' //  6.1:1        3.1:1

const GREY = GREY_M

const CORPORA = [
  ['English', 'prose'],
  ['Code', 'code'],
  ['Hindi', 'hindi'],
]

// The full ladder, in the order the talk climbs it.
const ALL = [
  ['Raw UTF-8', null, GREY],
  ['LZ4', 'LZ4', GREY],
  ['gzip -9', 'gzip-9', GREY],
  ['zstd -19', 'zstd-19', GREY],
  ['brotli q11', 'brotli-q11', GREY],
  ['zstd --train', 'zstd --train', GREY],
  ['r50k raw', 'r50k raw', RED],
  ['o200k raw', 'o200k raw', RED],
  ['o200k +freq', 'o200k +freq', RED],
  ['o200k +ANS', 'o200k +ANS', RED],
]
// Focus: drop the middle byte codecs, keep the comparison that carries the point.
const FOCUS_LABELS = new Set([
  'Raw UTF-8',
  'LZ4',
  'zstd --train',
  'r50k raw',
  'o200k raw',
  'o200k +ANS',
])

const at = (key, corpus) => (key === null ? 1.0 : ratios[key][corpus])

function dataset(label, corpus, rows) {
  const values = rows.map(([, key]) => at(key, corpus))
  return {
    label,
    categories: rows.map(([name]) => name),
    series: [
      {
        name: 'compression ratio',
        values,
        colors: rows.map(([, , c]) => c),
        text: values.map((v) => `${v.toFixed(2)}×`),
        textPosition: 'outside',
      },
    ],
  }
}

const ratioViews = [
  { label: 'All', datasets: CORPORA.map(([l, c]) => dataset(l, c, ALL)) },
  {
    label: 'Focus',
    datasets: CORPORA.map(([l, c]) => dataset(l, c, ALL.filter(([n]) => FOCUS_LABELS.has(n)))),
  },
]

// ── latency, English/o200k, the basis the talk quotes ────────────────────────
const p = lat.grid.prose.o200k
const byte = lat.byte_codecs.prose
const m = p.methods
const round1 = (x) => Math.round(x * 10) / 10

const byteDecode = (k) => round1(byte[k].decompress_us[0])
const mRead = (k) => round1(m[k].read_us[0])

const latency = {
  tokenize: round1(p.tokenize_serving_cold_us[0]),
  detokenize: round1(p.detokenize_serving_cold_us[0]),
  lz4: { compress: round1(byte.LZ4.compress_us[0]), decompress: round1(byte.LZ4.decompress_us[0]) },
  zstd19: {
    compress: round1(byte['zstd-19'].compress_us[0]),
    decompress: round1(byte['zstd-19'].decompress_us[0]),
  },
  raw: { write: round1(m.raw.write_us[0]), read: round1(m.raw.read_us[0]) },
  freq: { write: round1(m['+freq'].write_us[0]), read: round1(m['+freq'].read_us[0]) },
  ans: { write: round1(m['+ANS'].write_us[0]), read: round1(m['+ANS'].read_us[0]) },
}


// ── chunk-size sweep: ratio (native tokenizer per domain, 512..4096) ───────
// Built from the LATENCY sweep, which carries a `ratio` per cell for every
// codec. The kalcher chunksize_sweep_ratio table only has token methods, so
// using it left the byte codecs -- the whole comparison -- off the chart.
// Order-0 token methods are flat because per-token entropy is additive; the
// LZ-family climbs by finding cross-chunk redundancy.
const SIZES = [512, 1024, 2048, 4096]
const NATIVE_TOK = { prose: 'r50k', code: 'cl100k', hindi: 'o200k' }
const RATIO_SERIES = [
  // the real competition: what production stores actually run, plus
  // `zstd --train` as the strongest byte-side comparison. Darker = stronger.
  // Shapes let the lines be told apart where they cross or overlap, and give
  // the token-native trio the eye-catching ones. The star is always +freq, the
  // method being recommended, on every chart in the deck.
  ['LZ4', GREY_L, null],
  ['gzip-9', GREY_M, null],
  ['zstd-19', GREY_D, null],
  ['zstd --train', GREY_XD, 'diamond'],  // keeps one: the real competitor
  ['+freq', RED_L, 'star'],
  ['+ANS', RED, 'ring'],
  // +dict answers "you lose on code": order-0 coders model no repetition, and
  // code repeats constantly. zstd-22 with a 112KB dictionary trained on packed
  // token-ID bytes -- output is still token IDs, so a read still skips
  // tokenizing. Same sweep as every other series here, so no mixing.
  ['+dict', RED_D, 'square'],
]
const sweepCell = (key, n) => sweep[`${NATIVE_TOK[key]}|${key}|${n}`]
const chunkRatio = {
  xTicks: SIZES.map((n) => [n, n.toLocaleString()]),
  views: CORPORA.map(([label, key]) => ({
    label,
    series: RATIO_SERIES.map(([name, color, marker]) => ({
      name,
      color,
      marker,
      showMarkers: marker != null,
      points: SIZES.map((n) => {
        const v = sweepCell(key, n)?.methods?.[name]?.ratio
        return v == null ? null : [n, Math.round(v * 100) / 100]
      }).filter(Boolean),
    })).filter((s) => s.points.length),
  })),
}

// ── chunk-size sweep: encode cost ────────────────────────────────────────────
// Same competition and the same grey ramp as the ratio sweep above, so the two
// slides read as one pair: what you get, then what it costs.
//
// Growth from 512 to 4,096 tokens, against an input that grows 8x:
//   zstd-19  12.1x / 11.7x / 11.3x  (prose / code / hindi)  -- superlinear
//   gzip-9    8.5x /  6.7x /  9.0x   ~linear
//   zstd--tr  8.0x /  7.9x /  8.7x   ~linear
//   +ANS      7.1x /  6.6x /  4.5x   sublinear
//   LZ4       4.3x /  4.0x /  3.4x   sublinear
//   +freq     4.6x /  2.9x /  2.1x   sublinear
// So only zstd-19 genuinely outgrows its input. The slide claims the absolute
// gap instead, stated as the worst case for us: across every corpus and size
// the CHEAPEST byte codec still costs 8.1-17.7x more than the DEAREST token
// method. (Extreme vs extreme would be 526x, true but self-serving.)
// Same colours AND shapes as RATIO_SERIES, so a line means the same thing on
// all three sweep charts.
const ENC_SERIES = [
  ['LZ4', GREY_L, null],
  ['gzip-9', GREY_M, null],
  ['zstd-19', GREY_D, null],
  ['zstd --train', GREY_XD, 'diamond'],  // keeps one: the real competitor
  ['+freq', RED_L, 'star'],
  ['+ANS', RED, 'ring'],
]
const chunkEncode = {
  xTicks: SIZES.map((n) => [n, n.toLocaleString()]),
  views: CORPORA.map(([label, key]) => ({
    label,
    series: ENC_SERIES.map(([name, color, marker]) => ({
      name,
      color,
      marker,
      showMarkers: marker != null,
      points: SIZES.map((n) => {
        const v = sweep[`${NATIVE_TOK[key]}|${key}|${n}`]?.methods?.[name]?.write_us
        return v == null ? null : [n, round1(v)]
      }).filter(Boolean),
    })).filter((s) => s.points.length),
  })),
}

// ── chunk-size sweep: decode cost ────────────────────────────────────────────
// Like for like, and it costs us the headline: a byte codec's `read_us`
// bundles in the mandatory tokenize, which is ~99% of it and identical across
// all four codecs, so plotting that compared a codec against a tokenizer.
// Here every series is decode ALONE -- decompress_us for the byte codecs,
// read_us for the token methods (already token IDs, so read_us IS their pure
// decode; they have no decompress_us field).
//
// On those terms the byte codecs win: English at 512, LZ4 unpacks in 0.9us
// against +freq's 4.2us and +ANS's 30.8us. Concede it. The tokenize tax is
// carried as a line under the chart instead, because that is the honest place
// for it: a cost the byte path pays next, not a codec being slow.
const chunkRead = {
  xTicks: SIZES.map((n) => [n, n.toLocaleString()]),
  views: CORPORA.map(([label, key]) => ({
    label,
    series: ENC_SERIES.map(([name, color, marker]) => ({
      name,
      color,
      marker,
      showMarkers: marker != null,
      points: SIZES.map((n) => {
        const m = sweep[`${NATIVE_TOK[key]}|${key}|${n}`]?.methods?.[name]
        if (m == null) return null
        const v = m.kind === 'byte' ? m.decompress_us : m.read_us
        return v == null ? null : [n, round1(v)]
      }).filter(Boolean),
    })).filter((s) => s.points.length),
  })),
}

// What the byte path owes after decoding: read_us - decompress_us, which is
// one shared constant across the four codecs (identical to the decimal).
const tokenizeTax = Object.fromEntries(
  CORPORA.map(([, key]) => [
    key,
    Object.fromEntries(
      SIZES.map((n) => {
        const m = sweep[`${NATIVE_TOK[key]}|${key}|${n}`].methods.LZ4
        return [n, round1(m.read_us - m.decompress_us)]
      })
    ),
  ])
)

// ── the ratio/decode frontier, as a real scatter ─────────────────────────────
// showLine:false turns LineChart into a scatter; it hit-tests in 2D, so every
// point keeps its own hover tooltip. This was a PNG until the blog's marker
// TDZ was fixed -- a scatter is nothing but markers.
//
// Colours and shapes follow the rest of the deck: grey and recessive for what
// we are competing with, amaranth for token-native, and the star always marks
// +freq, as on every other slide.
// textPosition is per series because +ANS and the Kalcher baseline land almost
// on top of each other at the top right; sending one label left and the other
// down keeps both readable.
const FRONTIER = [
  ['LZ4 (bytes)', GREY_D, 'circle', byteDecode('LZ4'), ratios.LZ4.prose, 'top right'],
  ['+freq+leb+zstd', GREY_M, 'diamond', mRead('Kalcher(zstd)'), ratios['o200k Kalcher(zstd)'].prose, 'bottom left'],
  ['raw IDs', RED_D, 'triangle', mRead('raw'), ratios['o200k raw'].prose, 'bottom right'],
  ['+freq+vbyte', RED_L, 'star', mRead('+freq'), ratios['o200k +freq'].prose, 'top left'],
  ['+ANS', RED, 'ring', mRead('+ANS'), ratios['o200k +ANS'].prose, 'top left'],
]
const frontier = {
  series: FRONTIER.map(([name, color, marker, x, y, textPosition]) => ({
    name,
    color,
    marker,
    showLine: false,
    points: [[x, y]],
    // `text` is the per-point label prop; `labels` is not one and was silently
    // ignored. Name included, since a scatter's legend is easy to lose.
    text: [`${name}  ${y.toFixed(2)}x / ${x}us`],
    textPosition,
  })),
}

// ── the free out-of-distribution gate ────────────────────────────────────────
// The ANS coder already computes -log2 P(token), so a per-chunk bits/token
// score costs nothing. The obvious free alternative, a byte-codec ratio, is
// directionless on repetitive junk.
const oodAuc = {
  categories: Object.keys(ood.ood.auc).map((k) => k.replace('_vs_', ' vs ')),
  values: Object.values(ood.ood.auc).map((v) => Math.round(v * 1000) / 1000),
}
const oodBpt = {
  categories: CORPORA.map(([l]) => l),
  // the prose-trained table scoring each domain: in-domain is far cheaper
  values: CORPORA.map(([, key]) => Math.round(ood.ood.mean_bpt.prose[key] * 10) / 10),
}

// ── the n-gram wall ──────────────────────────────────────────────────────────
const NGRAM = ['unigram', 'bigram', 'trigram']
const ngram = {
  categories: NGRAM,
  views: CORPORA.map(([label, key]) => ({
    label,
    values: NGRAM.map((n) => Math.round(ood.ngram[key][n] * 100) / 100),
  })),
}


// ── agent vs text-consumer, read and write ───────────────────────────────────
// Built from 03_latency/latency_grid_results.json, the same file the ladder
// slide quotes. It used to compose the post's published `latValues`, but that
// table is stale against the repo by a wide margin -- its tokenize is 445.6us
// where the grid measures 235.3, and its LZ4 compress is 11.4us against 2.9 --
// so the deck was contradicting itself: 235us of tokenize on the ladder, 445us
// on this chart. The grid is the source of truth now, and because each bar is
// summed from its own parts, totals and breakdowns cannot disagree.
//
// Composition follows the post's definitions:
//   to token IDs   byte  = decompress + tokenize      (an agent needs IDs)
//                  token = the method's read, nothing else
//   to UTF-8       byte  = decompress, nothing else   (bytes are already text)
//                  token = the method's read + detokenize
// and the mirror image for writes.
const LAT_ROWS = [
  // his competition: what production runs, plus the strongest byte comparison.
  // brotli is measured but off the slide -- its encode is 2,777us, 9x the next
  // bar, and it flattens everything else to nothing.
  ['LZ4', 'byte', 'LZ4', GREY_L],
  ['gzip -9', 'byte', 'gzip-9', GREY_M],
  ['zstd -19', 'byte', 'zstd-19', GREY_D],
  ['zstd --train', 'byte', 'zstd --train', GREY_XD],
  ['r50k raw', 'token', ['r50k', 'raw'], RED_D],
  ['o200k raw', 'token', ['o200k', 'raw'], RED_D],
  ['o200k +freq', 'token', ['o200k', '+freq'], RED_L],
  ['o200k +ANS', 'token', ['o200k', '+ANS'], RED],
]

const NATIVE = { prose: 'r50k', code: 'cl100k', hindi: 'o200k' }
const cell = (corpus, tok) => lat.grid[corpus][tok]
const tokenizeUs = (corpus, tok) => round1(cell(corpus, tok).tokenize_serving_cold_us[0])
const detokenizeUs = (corpus, tok) => round1(cell(corpus, tok).detokenize_serving_cold_us[0])

// segments for one bar; the total is their sum, by construction
function latParts(corpus, row, step, mode) {
  const [, kind, key] = row
  const nat = NATIVE[corpus]
  if (kind === 'byte') {
    const b = lat.byte_codecs[corpus][key]
    if (step === 'read') {
      const seg = [{ label: 'decompress', value: round1(b.decompress_us[0]) }]
      if (mode === 'tokens') seg.push({ label: 'tokenize', value: tokenizeUs(corpus, nat) })
      return seg
    }
    const seg = []
    if (mode === 'tokens') seg.push({ label: 'detokenize', value: detokenizeUs(corpus, nat) })
    seg.push({ label: 'compress', value: round1(b.compress_us[0]) })
    return seg
  }
  const [tok, method] = key
  const m = cell(corpus, tok).methods[method]
  if (step === 'read') {
    const seg = [{ label: 'decode', value: round1(m.read_us[0]) }]
    if (mode === 'text') seg.push({ label: 'detokenize', value: detokenizeUs(corpus, tok) })
    return seg
  }
  const seg = []
  if (mode === 'text') seg.push({ label: 'tokenize', value: tokenizeUs(corpus, tok) })
  seg.push({ label: 'encode', value: round1(m.write_us[0]) })
  return seg
}

function latDataset(label, corpus, step, mode) {
  const breakdown = LAT_ROWS.map((r) => latParts(corpus, r, step, mode))
  const values = breakdown.map((segs) => round1(segs.reduce((a, b) => a + b.value, 0)))
  return {
    label,
    categories: LAT_ROWS.map(([name]) => name),
    series: [
      {
        name: `${step} latency`,
        values,
        colors: LAT_ROWS.map(([, , , c]) => c),
        text: values.map((v) => (v >= 100 ? `${Math.round(v)}us` : `${v.toFixed(1)}us`)),
        textPosition: 'outside',
        // single-segment bars get no stack: there is nothing to break down
        breakdown: breakdown.map((segs) => (segs.length > 1 ? segs : null)),
      },
    ],
  }
}

// Labelled by the OUTPUT FORMAT, not by who is reading. "Human" was a category
// error: a human needs ~90s to read a 512-token chunk, so the detokenize
// charged to that path is ~2 million times smaller than the reader and can
// never be the bottleneck. What the columns differ in is where decoding stops.
const latViews = (step) => [
  { label: 'Token IDs', default: true, datasets: CORPORA.map(([l, c]) => latDataset(l, c, step, 'tokens')) },
  { label: 'UTF-8', datasets: CORPORA.map(([l, c]) => latDataset(l, c, step, 'text')) },
]
const agentRead = latViews('read')
const agentWrite = latViews('write')

const latMax = (views) =>
  Math.max(...views.flatMap((v) => v.datasets.flatMap((d) => d.series[0].values)))

const out = `// GENERATED by scripts/gen-data.mjs -- do not edit by hand.
// Source: ${ratioPath}
//         ${latPath}
// Regenerate with: npm run data

export const ratioViews = ${JSON.stringify(ratioViews, null, 2)}

export const latency = ${JSON.stringify(latency, null, 2)}

export const chunkRatio = ${JSON.stringify(chunkRatio, null, 2)}

export const chunkEncode = ${JSON.stringify(chunkEncode, null, 2)}

export const chunkRead = ${JSON.stringify(chunkRead, null, 2)}

export const tokenizeTax = ${JSON.stringify(tokenizeTax, null, 2)}

export const frontier = ${JSON.stringify(frontier, null, 2)}

export const oodAuc = ${JSON.stringify(oodAuc, null, 2)}

export const oodBpt = ${JSON.stringify(oodBpt, null, 2)}

export const ngram = ${JSON.stringify(ngram, null, 2)}

export const agentRead = ${JSON.stringify(agentRead, null, 2)}

export const agentWrite = ${JSON.stringify(agentWrite, null, 2)}
`

const dest = resolve(here, '../data/token-storage.js')
writeFileSync(dest, out)
console.log(`wrote ${dest}`)
console.log(
  `  ratios: r50k raw English ${at('r50k raw', 'prose').toFixed(2)}x, ` +
    `o200k +ANS Hindi ${at('o200k +ANS', 'hindi').toFixed(2)}x`
)
console.log(`  latency: tokenize ${latency.tokenize}us, +freq read ${latency.freq.read}us`)
console.log(`  chunk sweep: ${SIZES.length} sizes x ${CORPORA.length} corpora`)
{
  const m = sweep['r50k|prose|512'].methods
  console.log(
    `  chunk decode @512 prose: LZ4 ${round1(m.LZ4.decompress_us)}us, ` +
      `+freq ${round1(m['+freq'].read_us)}us, +ANS ${round1(m['+ANS'].read_us)}us` +
      ` | tokenize tax ${tokenizeTax.prose[512]}us`
  )
}
console.log(`  ood: entropy AUC ${Math.min(...oodAuc.values)}-${Math.max(...oodAuc.values)}`)
console.log(`  ngram prose: ${ngram.views[0].values.join(' -> ')}x`)
console.log(
  `  read to token IDs (English): LZ4 ${agentRead[0].datasets[0].series[0].values[0]}us ` +
    `vs r50k raw ${agentRead[0].datasets[0].series[0].values[4]}us`
)
console.log(
  `  write from token IDs (English): LZ4 ${agentWrite[0].datasets[0].series[0].values[0]}us ` +
    `vs r50k raw ${agentWrite[0].datasets[0].series[0].values[4]}us`
)
