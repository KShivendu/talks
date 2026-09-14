# Token-Native Storage — talk plan

**Slot:** conference, 30–40 min · **Audience:** mixed developer · **Slides:** 36 (~35 min)

Built from three sources:

| Source | What it contributes |
| --- | --- |
| `~/projects/blog/data/blog/token-storage.mdx` | The napkin math, the agent/human latency split, the interface proposal, the asks to AI labs |
| `~/projects/research/token-native-storage/token_native.tex` (arXiv 2608.02376) | Canonical Table 1, Related Work positioning, the o200k latency basis |
| `~/projects/token-storage/` + `qdrant-integration-findings.md` | The gigatoken correction and the Qdrant integration cost — **neither is in the blog post** |

## The spine

Every rung of the compression ladder dies of the same weakness, and the refrain is the talk:

| Rung | English ratio | Why it dies |
| --- | --- | --- |
| Raw UTF-8 | 1.00x | 4.5 bytes/token. *And still re-tokenizes.* |
| LZ4 (Qdrant, Elasticsearch, Postgres) | 1.27x | Barely compresses. *And still re-tokenizes.* |
| gzip / zstd-19 / brotli-q11 | 1.92x / 1.94x / 2.57x | brotli costs 2,777us to encode. *And still re-tokenizes.* |
| `zstd --train` | 2.72x | Dictionary ships with your data, no shared standard. *And still re-tokenizes.* |
| **Store the token IDs** | **2.25x, no algorithm running** | — |

By rung four the room says the refrain with you, and the reveal lands twice: free
compression *and* the translation cost gone.

## Act structure

1. **Skeleton** (3) — hero, `$ whoami`, `Topics to cover`
2. **The problem** (6) — who reads the DB now, the two-representation diagram, the three ladder rungs, "so what does the model want?"
3. **Free compression** (6) — napkin math, BPE primer, ratio chart + reading, corpora chart + reading (including r50k Hindi at 0.84x)
4. **The BPE bug** (3) — merge-order IDs, the rank-remap code, the ratio/decode frontier
5. **The agent flip** (7) — who is reading, agent read chart, agent write chart, the Drake beat, humans at the edge
6. **Honesty** (3) — gigatoken, limitations, what shipping would cost
7. **The ask** (5) — interface x2, two asks for the labs, summary, references

## Charts

`charts/make_charts.py` reads the canonical result files and writes five PNGs.
No number is typed by hand.

* ratios ← `token-storage/07_kalcher_baseline/results.json :: table1_full_train_consistent`
* latency ← `token-storage/03_latency/latency_grid_results.json` (P-core pinned, serving-cold tokenize)

Palette: grey `#94a3b8` for byte codecs, dark `#475569` for the tokenize step,
Qdrant red `#dc244C` for token-native. One saturated color per chart.

`charts/make_hero.py` builds `imgs/hero.png`. Its numbers are computed live from
`tiktoken`: `"Token-native storage"` = 20 UTF-8 bytes → 4 r50k tokens → 8 bytes = 2.5x.

Rebuild both:

```bash
uv run python charts/make_charts.py
uv run python charts/make_hero.py
marp --html index.md
```

## Two things to check before presenting

1. **Number conflict with the blog.** The post says r50k English raw is 2.27x; the paper
   and `results.json` say 2.25x. The deck uses 2.25x throughout. Worth fixing the post.
2. **The gigatoken slide softens the post's headline.** "42 hours wasted/month" becomes
   ~1.1 hours/month with a fast tokenizer. Compression and write latency are unaffected;
   part of the read argument is. The deck says this out loud rather than hiding it.

## Cut material

Speaker notes at the bottom of `index.md` hold the cut-for-time order, the results that
did not make the deck (six-tokenizer generality, decorrelation, the n-gram wall, the free
OOD gate, cost at scale, the chunk-size sweep), and the measurement caveat to quote if
anyone asks how latency was measured.
