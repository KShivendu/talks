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

// Palette: grey for byte codecs, Qdrant red for token-native. Same meaning as
// the Marp charts, so the two decks read identically.
const GREY = '#94a3b8'
// A ramp for the byte codecs when several share one chart: weakest is lightest,
// so the family reads as one group but the individual lines stay separable.
const GREY_L = '#cbd5e1'
const GREY_M = '#94a3b8'
const GREY_D = '#64748b'
const GREY_XD = '#475569'
const RED_L = '#f4768f'
const RED = '#dc244C'

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
  ['LZ4', GREY_L],
  ['gzip-9', GREY_M],
  ['zstd-19', GREY_D],
  ['zstd --train', GREY_XD],
  ['+freq', RED_L],
  ['+ANS', RED],
]
const sweepCell = (key, n) => sweep[`${NATIVE_TOK[key]}|${key}|${n}`]
const chunkRatio = {
  xTicks: SIZES.map((n) => [n, n.toLocaleString()]),
  views: CORPORA.map(([label, key]) => ({
    label,
    series: RATIO_SERIES.map(([name, color]) => ({
      name,
      color,
      // blog LineChart bug: a series with markers references onCrosshairLeave
      // (const, declared ~260 lines later) during render and throws a TDZ.
      showMarkers: false,
      points: SIZES.map((n) => {
        const v = sweepCell(key, n)?.methods?.[name]?.ratio
        return v == null ? null : [n, Math.round(v * 100) / 100]
      }).filter(Boolean),
    })).filter((s) => s.points.length),
  })),
}

// ── chunk-size sweep: encode cost ────────────────────────────────────────────
// brotli's quality-11 search does not amortise: 8x the input costs ~18-35x the
// time, while the token-native coders stay close to linear.
const ENC_SERIES = [
  ['brotli-q11', GREY, 'triangle'],
  ['zstd --train', GREY, 'square'],
  ['+ANS', RED, 'diamond'],
  ['+freq', RED, 'circle'],
]
const chunkEncode = {
  xTicks: SIZES.map((n) => [n, n.toLocaleString()]),
  views: CORPORA.map(([label, key]) => ({
    label,
    series: ENC_SERIES.map(([name, color, marker]) => ({
      name,
      color,
      marker,
      showMarkers: false,
      points: SIZES.map((n) => {
        const cell = sweep[`${NATIVE_TOK[key]}|${key}|${n}`]
        const v = cell?.methods?.[name]?.write_us
        return v == null ? null : [n, round1(v)]
      }).filter(Boolean),
    })).filter((s) => s.points.length),
  })),
}

// ── the ratio/decode frontier, as a real scatter ─────────────────────────────
// LineChart draws markers only when showLine is false, and hit-tests in 2D.
const FRONTIER = [
  ['LZ4 (bytes)', GREY, byteDecode('LZ4'), ratios.LZ4.prose],
  ['raw IDs', RED, mRead('raw'), ratios['o200k raw'].prose],
  ['+freq+vbyte', RED, mRead('+freq'), ratios['o200k +freq'].prose],
  ['+ANS', RED, mRead('+ANS'), ratios['o200k +ANS'].prose],
  ['+freq+leb+zstd', GREY, mRead('Kalcher(zstd)'), ratios['o200k Kalcher(zstd)'].prose],
]
const frontier = {
  series: FRONTIER.map(([name, color, x, y]) => ({
    name,
    color,
    showLine: false,
    marker: 'circle',
    points: [[x, y]],
    labels: [`${name}  ${y.toFixed(2)}x / ${x}us`],
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

const out = `// GENERATED by scripts/gen-data.mjs -- do not edit by hand.
// Source: ${ratioPath}
//         ${latPath}
// Regenerate with: npm run data

export const ratioViews = ${JSON.stringify(ratioViews, null, 2)}

export const latency = ${JSON.stringify(latency, null, 2)}

export const chunkRatio = ${JSON.stringify(chunkRatio, null, 2)}

export const chunkEncode = ${JSON.stringify(chunkEncode, null, 2)}

export const frontier = ${JSON.stringify(frontier, null, 2)}

export const oodAuc = ${JSON.stringify(oodAuc, null, 2)}

export const oodBpt = ${JSON.stringify(oodBpt, null, 2)}

export const ngram = ${JSON.stringify(ngram, null, 2)}
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
console.log(`  ood: entropy AUC ${Math.min(...oodAuc.values)}-${Math.max(...oodAuc.values)}`)
console.log(`  ngram prose: ${ngram.views[0].values.join(' -> ')}x`)
