// Numbers transcribed from ~/projects/blog/data/blog/if-splade.mdx, which is the
// published write-up of this benchmark: BEIR scifact (5,183 docs, 300 queries),
// Qdrant with native float sparse scoring, doc encoding on a Modal A10G.
//
// Palette follows the talks convention: grey for what we are comparing against,
// Qdrant Amaranth for the thing being recommended. SPLADE-IF is the recommendation,
// so full SPLADE and BM25 both stay neutral.
const GREY_L = '#8a9099'
const GREY_D = '#5d6573'
const AMARANTH = '#dc244c'
const AMARANTH_L = '#ef5a7c'

// naver/splade-v3-doc activations for "heart attack". The first two are the words
// themselves; everything after is vocabulary the document never contained.
export const activations = {
  categories: ['heart', 'attack', 'die', 'cardiac', 'attacks', 'disease', 'stroke', 'chest', 'death', 'illness'],
  values: [1.599, 1.133, 0.773, 0.767, 0.764, 0.669, 0.589, 0.498, 0.361, 0.273],
  // the two original terms read as "already there", the expansions as the new thing
  colors: [GREY_D, GREY_D, AMARANTH, AMARANTH, AMARANTH, AMARANTH, AMARANTH, AMARANTH, AMARANTH, AMARANTH],
}

// [median total latency ms, NDCG@10]
export const frontier = [
  { name: 'SPLADE-Full', color: GREY_D, marker: 'circle', points: [[57.2, 0.7161], [60.4, 0.7093]],
    text: ['naver  0.7161 / 57ms', 'PP  0.7093 / 60ms'], textPositions: ['top left', 'bottom left'] },
  { name: 'SPLADE-IF', color: AMARANTH, marker: 'star', points: [[4.3, 0.7068], [4.29, 0.7021], [3.9, 0.6859]],
    text: ['naver  0.7068 / 4.3ms', 'GTE  0.7021', 'PP-sym  0.6859'], textPositions: ['top right', 'bottom right', 'top left'] },
  { name: 'BM25', color: GREY_L, marker: 'square', points: [[4.0, 0.683]],
    text: ['BM25  0.6830 / 4.0ms'], textPositions: ['bottom right'] },
]

// the 13x is one component, not a diffuse win
export const latencySplit = {
  categories: ['BM25', 'IF (naver)', 'IF (GTE)', 'IF (PP-sym)', 'Full (naver)', 'Full (PP)'],
  embed: [0.1, 0.3, 0.3, 0.3, 50.0, 53.2],
  search: [3.8, 4.0, 4.0, 3.6, 6.6, 7.1],
}

export const throughput = {
  categories: ['BM25', 'SPLADE-Full', 'IF-naver', 'IF-GTE'],
  values: [1439, 98, 83, 58],
  text: ['1,439 (CPU)', '98 (GPU)', '83 (GPU)', '58 (GPU)'],
  colors: [GREY_L, GREY_D, AMARANTH, AMARANTH_L],
}
