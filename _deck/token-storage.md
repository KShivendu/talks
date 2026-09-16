---
theme: default
title: 'Token-Native Storage'
info: |
  Read and write in your agent's language.
  Kumar Shivendu (kshivendu.dev) · arXiv 2608.02376
# 'all' lets the audience-facing deck start light and toggle with `d`
colorSchema: all
# GitHub Pages has no SPA fallback and only honours a site-root 404.html, so
# history URLs like /token-storage/10 hard-404. Hash routing needs no server
# support: /token-storage/#/10 works on any static host.
routerMode: hash
# Slidev disables text selection by default so click-to-advance never
# selects prose instead. We want people to copy from the slides.
selectable: true
layout: cover
class: 'text-left'
---
<img :src="$asset('imgs/hero.png')" class="absolute inset-0 w-full h-full object-contain" alt="Token-Native Storage" />

<!-- Slide 1: the hero carries the title, nothing else on it. -->

---

# $ whoami

<div class="grid grid-cols-[1fr_auto] gap-8 items-start">
<div>

- Kumar Shivendu

- Engineer @ Qdrant

- I ❤️ search, databases, and performance.

- Token-Native Storage

</div>
<img :src="$asset('shivendu.jpg')" class="h-64 rounded-lg" />
</div>

---

# Topics to cover

<v-clicks>

- The payload nobody compresses

- The compression ladder, and why every step on it falls short

- Tokens as the storage format: free compression

- An easy win in every BPE tokenizer

- The second win: the agent read/write flip

- What breaks, and what the ecosystem needs

</v-clicks>

---

## The payload nobody compresses

<v-clicks>

- A vector DB record is a **vector** plus a text payload

- We compress the vector obsessively: product quantization, binary quantization, Matryoshka

- The text payload gets raw UTF-8, or LZ4 if you're lucky. On English, 1.27x

- Text is the heavy field: thousands of characters, one byte each

</v-clicks>

---

## The compression ladder

| | English | encode | decode | why it falls short |
| --- | ---: | ---: | ---: | --- |
| LZ4 (Qdrant, ES, Postgres) | 1.27x | 2.9us | 1.0us | barely compresses |
| gzip `-9` | 1.92x | 26us | 8.0us | still a byte codec |
| zstd `-19` | 1.94x | 209us | 4.5us | slow for what it buys |
| brotli `q11` | 2.57x | **2,777us** | 9.5us | ~1,000x LZ4 to encode |
| `zstd --train` | 2.72x | 359us | 3.2us | dictionary ships with your data |
| LZ4 over 16KB **blocks** | 1.43x | 7.8us | 7.6us | one read decompresses the whole block |

<v-clicks>

- Decode is cheap, but it returns **bytes**: add **~235us** of tokenizing to every row

- The one that gets close, `zstd --train`, needs a vocabulary **you** train and ship. The tokenizer's is already standard, and your model already loaded it

</v-clicks>

<!--
The 2x2 is in 07_kalcher_baseline/read_latency_2x2_results.json, ES/Lucene-style
blocks (<=16KB or 128 docs, whole block compressed, one doc read decompresses it).

Do NOT reinstate the old "every copy pays it again: snapshots, WAL, replicas,
egress" bullet here. That line is from token-storage-extra.mdx:1360 ("The
Multiplier Hits Every Copy of the Bytes"), where it is a PAYOFF of token
storage -- every copy gets 3.35x smaller -- not a criticism of the ladder.
Better byte compression helps those copies too, and nothing re-tokenizes a
snapshot or a WAL, so there is no second payment to point at.

The vocabulary bullet is from token-storage.mdx:234: zstd --train does learn a
vocab from the corpus, and it IS shared across documents in a domain
(token-storage.mdx:590, one 112KB global dictionary). What it is not is
STANDARDIZED FOR REUSE -- that is the actual asymmetry against a tokenizer
vocabulary the serving model has already loaded.

Decode column = byte_codecs.prose[c].decompress_us from 03_latency/latency_grid_
results.json. The block row instead comes from 07_kalcher_baseline/block_codecs_
results.json :: block_meta['512|prose|LZ4'] -- encode 7.8us is the per-doc
AMORTIZED cost of compressing a whole 16KB block (~7 docs), decode 7.6us is the
full-block cost one reader pays. Same 512-token prose chunks and seed as the
other rows, but a separate run (lz4.frame, single-shot) vs the grid's warm
median-of-30 lz4 point calls -- so treat the encode column as same-order, not
same-harness. If asked why block encode > point encode: frame headers plus a
cold single-shot measurement.

None of the decode numbers include tokenizing (~235us for r50k prose), which is
the point of the next bullet.

             byte/doc  byte/block  token/doc  token/block
  prose         287.9       304.8       89.5         39.8
  code          217.2       231.6       76.8         79.1
  hindi         158.7       173.9       85.7         67.9

Blocking slows the byte store (decompress the block, then still tokenize) and
speeds the token store (decode amortises, nothing to tokenize). Prose is the
clean 2.2x win; code is a wash, Hindi improves modestly. Say that if pushed.
-->

---

## What if we stored the model's own format?

<v-clicks>

- Every option on that ladder packs the **same UTF-8 bytes** tighter. Same contents, smaller box

- But nothing downstream reads UTF-8. The model turns it into token IDs first, on **every read**

- So what if we **store token IDs directly**?

</v-clicks>

---

## The napkin math

```text
avg English word = 5 chars + 1 space = 6 bytes/word

UTF-8:  6 bytes/word x 3/4 word/token = 4.5 bytes/token
Tokens: 1 r50k token ID as uint16     = 2.0 bytes/token

ratio: 4.5 / 2.0 = ~2.25x
```

<v-clicks>

- One BPE token covers about **3/4 of a word**

- r50k's vocabulary is 50,257 tokens, which fits in a `uint16`

- This is the whole idea. Everything after this slide is checking it

</v-clicks>

---

# Tokens

<v-clicks>

- BPE (Byte Pair Encoding) starts from raw bytes and repeatedly merges the most frequent adjacent pair

- `"storage"` is **one** token. `"Token-native"` is three: `Token` + `-` + `native`

- Every word carries its leading space into the token: `" cat"` is 4 bytes of UTF-8, but 1 token

- r50k 50,257 (2 bytes) · cl100k 100,277 · o200k 200,019 (3 bytes)

</v-clicks>

---

## Does the napkin math hold?

<iframe :src="chart('ratio')" class="w-full border-0" style="height: 400px"
        title="Does the napkin math hold?" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
// BASE_URL is '/' in dev, '/token-storage/' in the build. A root-absolute path
// resolves to the site root and 404s once deployed.
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
The blog's own BarChart, live. Toggle All/Focus, hover a bar.
I predicted 2.25x on a napkin and measured 2.25x, with no algorithm running.
brotli (2.57x) and zstd --train (2.72x) still beat raw token IDs, but cost
2,777us and 359us to encode. Packing a uint16 costs 5.3us.
-->

---

## Does it hold beyond English?

<iframe :src="chart('corpora')" class="w-full border-0" style="height: 400px"
        title="Does it hold beyond English?" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
// BASE_URL is '/' in dev, '/token-storage/' in the build. A root-absolute path
// resolves to the site root and 404s once deployed.
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Switch to Hindi mid-sentence: r50k drops to 0.84x, under the break-even line.
It never learned Devanagari merges, so the Hindi word for India (12 UTF-8 bytes)
becomes 7 token IDs = 14 bytes. o200k, which has the merges, gets 2.55x raw.
-->

---

## Does it hold at every chunk size?

<iframe :src="chart('chunk-ratio')" class="w-full border-0" style="height: 400px"
        title="Does it hold at every chunk size?" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
// BASE_URL is '/' in dev, '/token-storage/' in the build. A root-absolute path
// resolves to the site root and 404s once deployed.
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Order-0 token methods are flat because per-token entropy is additive: doubling
the chunk gives them nothing new. LZ-family methods climb by finding cross-chunk
repeats, so the gap narrows as chunks grow. The advantage is largest at the
realistic 512-token chunk, which is the one people actually use.

Against what production actually runs -- LZ4, gzip, zstd-19 -- +ANS wins at
every chunk size on prose (3.38x vs 1.95x best) and Hindi (5.90x vs 2.45x).

`zstd --train` is the honest comparison, and the Code tab is where it wins:
3.34x vs +ANS 3.05x at 512, widening to 4.78x vs 2.94x at 4,096. Code is highly
repetitive, so a dictionary plus an LZ window spanning many chunks beats
per-token entropy coding. Two answers if pushed: the dictionary has to be
trained on your corpus and then shipped and versioned alongside it, and its
output is still bytes you have to tokenize on every read.
-->

---

## Encode cost grows faster than the input

<iframe :src="chart('chunk-encode')" class="w-full border-0" style="height: 400px"
        title="Encode cost grows faster than the input" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
// BASE_URL is '/' in dev, '/token-storage/' in the build. A root-absolute path
// resolves to the site root and 404s once deployed.
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
brotli's quality-11 search does not amortise: 8x the input costs it ~18-35x
the time. The token-native coders stay close to linear. So the smaller the
chunk -- the more realistic the RAG scenario -- the worse brotli looks.
-->

<!--
Hindi with o200k is 2.55x raw and 5.90x with ANS. Hindi with r50k is 0.84x,
bigger than the original. r50k never learned to merge Devanagari, so the Hindi
word for India (12 UTF-8 bytes) becomes 7 token IDs = 14 bytes.
-->

---

## An easy win in every BPE tokenizer

<v-clicks>

- Two ways to squeeze the IDs: an entropy coder (**ANS**, frequent tokens get fewer bits), or re-rank by frequency and pack with `streamvbyte`

- Running the frequency histogram, I found BPE hands out IDs in **merge-discovery order**, not by how often a token is used

- A token you use constantly can sit at ID 40,000. A rare one sits at ID 12

- Re-ranking on English: 2.13x → 2.60x. Half of `+freq`'s gain is the remap alone

</v-clicks>

---

## Fixing it:

```python {all|3-8|10-15|12}
# BPE numbers tokens by merge order. streamvbyte pays for big integers.
# So renumber once, by real-world frequency, and every document gets smaller.
corpus_ids = np.array(enc.encode(corpus_text), dtype=np.int64)
counts  = np.bincount(corpus_ids, minlength=VOCAB)
order   = np.argsort(-counts)                        # most -> least frequent
rank_of = np.empty(VOCAB, dtype=np.uint32)
rank_of[order] = np.arange(VOCAB, dtype=np.uint32)   # token id   -> freq rank
token_of_rank  = order                               # freq rank  -> token id

def compress(text):
    ids   = np.array(enc.encode(text), dtype=np.int64)
    ranks = rank_of[ids]                    # SAME tokens, new numbers
    out = np.zeros(len(ranks) * 2 + 1024, dtype=np.uint32)
    n = codec.encodeArray(ranks, len(ranks), out, len(out))       # streamvbyte
    return len(ranks).to_bytes(4, "big") + out[:n].tobytes()
```

---

<img :src="$asset('imgs/frontier.png')" class="absolute inset-0 w-full h-full object-contain" alt="frontier" />

<!--
Still a PNG: a scatter needs markers, and the blog's LineChart throws a TDZ on
any series with markers (onCrosshairLeave used at line 603, declared at 864).

All o200k here, so raw is 1.59x, not the 2.25x from earlier: o200k IDs need
3 bytes, r50k's fit in 2.
-->

---

## Two representations, paid for twice

```text
  WRITE (agent)                   READ (agent)

  ╭────────────╮                  ╭────────────╮
  │ token IDs  │                  │ token IDs  │
  ╰─────┬──────╯                  ╰─────┬──────╯
        │                               ▲
        │  detokenize  50 µs            │  tokenize  237 µs
        ▼                               │
  ╭─────┴──────╮                  ╭─────┴──────╮
  │ UTF-8 text │                  │ UTF-8 text │
  ╰─────┬──────╯                  ╰─────┬──────╯
        │                               ▲
        │  LZ4 compress  2.9 µs         │  LZ4 decompress  1.0 µs
        ▼                               │
  ╭─────┴───────────────────────────────┴──────╮
  │                    DISK                    │
  ╰────────────────────────────────────────────╯
```

- Stored once, kept in **two** forms, translated on every access

---

## After: one representation

```text
  WRITE (agent)                   READ (agent)

  ╭────────────╮                  ╭────────────╮
  │ token IDs  │                  │ token IDs  │
  ╰─────┬──────╯                  ╰─────┬──────╯
        │                               ▲
        │  +freq encode  2.7 µs         │  +freq decode  3.6 µs
        ▼                               │
  ╭─────┴───────────────────────────────┴──────╮
  │                    DISK                    │
  ╰────────────────────────────────────────────╯

        detokenize once at the edge, only for a human:  50.3 µs
```

- The UTF-8 boxes are gone from the loop. **Nothing translates** on a read

<!--
Same layout as the previous slide so the difference is the missing middle row.
Before: token IDs -> UTF-8 -> disk, and back again on every access.
After: the IDs are the stored form, so a read hands them straight to the model.
Numbers are o200k +freq: 2.7us to encode, 3.6us to decode, against 237us to
re-tokenize. Detokenize survives, but once, at the edge, for a human.
-->

---

<img :src="$asset('imgs/agent-read.png')" class="absolute inset-0 w-full h-full object-contain" alt="agent-read" />

---

## Agent read

<v-clicks>

- LZ4 decompresses in 1.0us, then spends **236.7us** tokenizing text the model will immediately consume as IDs

- Token-native serves the IDs directly: 3.6us with `+freq`, 28.8us with `+ANS`

- That's ~66x on the fastest token-native path

- Read is where it compounds: it happens on every retrieval, forever. Writing happens once

</v-clicks>

<!--
The model already produced the IDs. A byte store throws them away, detokenizes
(50.3us), then compresses. zstd-19 costs 259.5us a write, 209us the compressor.
-->

---

## Detokenize, then tokenize again on every read

<div class="flex justify-center mt-2">
  <img :src="$asset('imgs/drake-no.jpg')" class="h-72 rounded-lg" />
</div>

---

## Writes are free, humans read once

<v-clicks>

- The model **already produced the IDs**. A byte store throws them away, detokenizes (50.3us), then compresses

- Token-native just stores what it was handed: 2.7-5.3us

- Generated text is the clean case: chat logs, summaries, agent traces persist at **zero encode cost**

- Humans still need characters, but a search returns 10 chunks and the agent reads all of them. Detokenize once, at the edge

</v-clicks>

---

## Works well, but... tokenizers got faster

<v-clicks>

- My whole read argument assumes tokenizing costs ~237us. I measured that with `tiktoken`

- [gigatoken](https://github.com/marcelroed/gigatoken) encodes the same chunk in 13.3us, 13.9x faster. Decode barely moves, 1.19x

- My blog post said a 30M-request/month workload wastes 42 hours/month re-tokenizing

- With a fast tokenizer that becomes **~1.1 hours/month**. I was off by 38x

</v-clicks>

---

## So which claims actually survive?

| Claim | Verdict | With gigatoken as the baseline |
| --- | --- | --- |
| Compression | Intact | 1.66-1.90x vs today's JSON+LZ4 |
| Write latency | Intact | 27.6 → 2.5us (11x) |
| Hot read | Large | 16.5 → 0.17us (95x) |
| Sequential cold read | Modest | 28.9 → 13.9us (2.1x) |
| Random cold read | Small | 652.9 → **498.4us (1.3x)** |

- The compression and write arguments never depended on a slow tokenizer. Part of the read argument did

---

## Limitations

<v-clicks>

- Pays off end to end only if reader and writer share a tokenizer. Anthropic and Google (except Gemma) haven't published theirs

- Hosted LLM APIs take text and return text, so you need to own the inference stack

- My frequency table is corpus-specific. Point it at a corpus it wasn't built on and the ratio drops

- `mxbai-embed-large-v1` compresses better at 3.56x, but **80.4%** of articles decode corrupted. BERT lowercases: `"Qdrant"` becomes `"qdrant"`

</v-clicks>

---

## Interface

```js {all|1-3|4-7|8-11}
// One-time: register the tokenizer for a field.
PUT /collections/documents/index
{ "schema": { "text": { "type": "token", "tokenizer": "o200k" } } }
// Write: hand over the IDs the model just produced. A plain string also works.
PUT /collections/documents/points
{ "points": [{ "id": 123, "vector": [0.12, -0.34],
    "payload": { "text": [1858, 6427, 20272, 318, 257] } }] }
// Read: ask per field. Default stays "text", existing clients see no change.
POST /collections/documents/points/search
{ "vector": [0.1], "limit": 10, "with_payload": { "text": "tokens" } }
```

- Ask for `"tokens"` to skip detokenization. Swapping codec is **not a data migration**

---

## Two asks for the AI labs

<v-clicks>

- Sort the vocabulary by corpus frequency before you publish it. It costs **one sort**, and it hands every downstream user free compression

- Publish the tokenizers. We need a UTF-8-like standard for tokens, so a stored payload isn't locked to one vendor's model version

- You don't have to wait for either of these. Remap on your own corpus and you'll beat the vendor's ordering anyway

</v-clicks>

---

## Summary

<div class="grid grid-cols-[1fr_auto] gap-8 items-start">
<div>

- A tokenizer that covers your script is **free compression**: 2.25x raw, 3.40x with a coder

- The gain is the tokenizer, not the coder. And BPE's merge-order IDs leave more on the table

- A byte store re-tokenizes on every read. Store what the model speaks

- Find me at
  - [kshivendu.dev/twitter](https://kshivendu.dev/twitter)

- Paper [arXiv 2608.02376](https://arxiv.org/abs/2608.02376) · [post](https://kshivendu.dev/blog/token-storage) · [benchmarks](https://github.com/KShivendu/token-storage)

</div>
<img :src="$asset('linkedin-qr.png')" class="h-48" />
</div>

<!--
Q&A backup: six-tokenizer generality (3.30-3.40x band); decorrelation (order-0
tokens 2.44 vs order-1 bytes 3.68 bits/byte); the n-gram wall (3.28 -> 3.97 ->
4.01x); the free OOD gate (AUC 0.97-1.00); cost at scale (1B docs: 6.0 TB raw,
4.7 TB LZ4, 2.2 TB +freq+vbyte); Qdrant shipping cost (~34 files, ~1,900 LOC).

Measurement caveat: single-core, P-core pinned. Tokenize is serving-cold with a
64 MB cache sweep before each shot; a back-to-back loop reports ~HALF the cost.
-->
