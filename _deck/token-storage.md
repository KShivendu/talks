---
theme: default
title: 'Token-Native Storage'
info: |
  Read and write in your agent's language.
  Kumar Shivendu (kshivendu.dev) · arXiv 2608.02376
# 'all' lets the audience-facing deck start light and toggle with `d`
colorSchema: all
# Slidev disables text selection by default so click-to-advance never
# selects prose instead. We want people to copy from the slides.
selectable: true
layout: cover
background: /imgs/hero.png
class: 'text-left'
---

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
<img src="/shivendu.jpg" class="h-64 rounded-lg" />
</div>

---

# Topics to cover

<v-clicks>

- The payload nobody compresses

- The compression ladder, and why every rung falls short

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

## What our engines actually do

<v-clicks depth="2">

- Qdrant, Elasticsearch, Postgres: the payload gets an LZ-family codec, usually LZ4

- On English, 512-token chunks: **1.27x**

- Cons:
  - Barely compresses. 100 GB of text becomes 79 GB
  - Every copy pays it again: snapshots, backups, WAL, replicas, network egress

</v-clicks>

---

## Compress harder? Train a dictionary?

<v-clicks depth="2">

- gzip `-9` 1.92x · zstd `-19` 1.94x · brotli `q11` 2.57x

- `zstd --train` learns a 112 KB dictionary from your corpus: **2.72x** on English, 4.52x on Hindi. The fairest competitor in this talk

- Cons:
  - brotli takes 2,777us to encode one 512-token chunk, ~1,000x LZ4's 2.9us
  - The dictionary is yours alone. It ships with your data, nobody else can read it
  - Neither vocabulary is shared or standard

</v-clicks>

---

## What if we stored the model's own format?

<v-clicks>

- Every rung optimizes the **container** and never questions the contents

- Whatever we store, the model turns it into token IDs before it can read a word

- So what if the token IDs were the stored form?

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

<iframe :src="chartSrc" class="w-full border-0" style="height: 400px"
        title="Compression ratio by method" />

<script setup>
import { computed } from 'vue'
import { useDarkMode } from '@slidev/client'

// The chart runs in its own document, so it cannot inherit Slidev's `.dark`
// class. Pass the mode in the URL; changing it reloads the frame, and
// ratio.jsx sets the class before React mounts.
const { isDark } = useDarkMode()
const chartSrc = computed(() => `/charts/ratio.html${isDark.value ? '?dark' : ''}`)
</script>

<!--
This is the blog's own BarChart, live, not a screenshot. It runs in an iframe on
purpose: Slidev scales each slide with a CSS transform, and a transformed
ancestor becomes the containing block for `position: fixed` children, so the
chart's cursor-following tooltip landed ~1.3x off. An iframe is its own
browsing context, so clientX and fixed positioning work normally.

Toggle All/Focus and English/Code/Hindi live, hover a bar for its breakdown.

I predicted 2.25x on a napkin and measured 2.25x, with no algorithm running.
brotli (2.57x) and zstd --train (2.72x) do still beat raw token IDs, but they
cost 2,777us and 359us to encode. Packing a uint16 costs 5.3us.
-->

---
layout: image
image: /imgs/ratio-corpora.png
backgroundSize: contain
---

<!--
Hindi with o200k is 2.55x raw and 5.90x with ANS. Hindi with r50k is 0.84x,
bigger than the original. r50k never learned to merge Devanagari, so the Hindi
word for India (12 UTF-8 bytes) becomes 7 token IDs = 14 bytes.
-->

---

## Two levers on top of the IDs

<v-clicks>

- Asymmetric Numeral Systems (ANS) is an entropy coder: frequent tokens get shorter codes. `"the"` is ~40x more common than `"embeddings"`, so it earns fewer bits

- Or re-rank the IDs by frequency and pack them with `streamvbyte`, a **variable-length** integer codec

- One table, trained once on a corpus, reused for every document. Not per-document, or you would ship ~900 bytes of table with each 512-token chunk

</v-clicks>

---

## An easy win in every BPE tokenizer

<v-clicks>

- Running the frequency histogram, I found BPE hands out IDs in **merge-discovery order**, not by how often a token is used

- A token you use constantly can sit at ID 40,000. A rare one sits at ID 12

- Variable-length integer codecs pay for big numbers, so this ordering leaves compression on the table for everyone downstream

- Re-ranking by frequency on English: 2.13x → 2.60x. Half of `+freq`'s gain is the remap alone

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
layout: image
image: /imgs/frontier.png
backgroundSize: contain
---

<!--
All o200k here, so raw is 1.59x, not the 2.25x from earlier. o200k IDs need
3 bytes, r50k's fit in 2.
-->

---

## Two representations, paid for twice

```text
   WRITE (agent)                    READ (agent)
   +------------+                   +------------+
   | token IDs  |                   | token IDs  |
   +------------+                   +------------+
         | detokenize  50us               ^ tokenize  237us
         v                                |
   +------------+                   +------------+
   | UTF-8 text |                   | UTF-8 text |
   +------------+                   +------------+
         | LZ4 compress  2.9us            ^ LZ4 decompress  1.0us
         v                                |
   +----------------[ DISK ]-----------------+
```

- Stored once, kept in **two** forms, translated on every access

---
layout: image
image: /imgs/agent-read.png
backgroundSize: contain
---

---

## Agent read

<v-clicks>

- LZ4 decompresses in 1.0us, then spends **236.7us** tokenizing text the model will immediately consume as IDs

- Token-native serves the IDs directly: 3.6us with `+freq`, 28.8us with `+ANS`

- That's ~66x on the fastest token-native path

- Read is where it compounds: it happens on every retrieval, forever. Writing happens once

</v-clicks>

---
layout: image
image: /imgs/agent-write.png
backgroundSize: contain
---

<!--
The model already produced the IDs. A byte store throws them away, detokenizes
(50.3us), then compresses. zstd-19 costs 259.5us a write, 209us the compressor.
-->

---

## Detokenize, then tokenize again on every read

<div class="flex justify-center mt-2">
  <img src="/imgs/drake-no.jpg" class="h-72 rounded-lg" />
</div>

---

## But humans still read this data

<v-clicks>

- True cost: token-native pays ~50us to detokenize before a human sees anything

- But in a RAG or agent loop, a search returns 10 chunks and the agent reads all of them

- The human sees one answer, once, at the end

- So detokenize **once**, at the edge. Maybe in the frontend

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

</div>
<img src="/linkedin-qr.png" class="h-48" />
</div>

---

## References

- Paper: [Token-Native Storage](https://arxiv.org/abs/2608.02376) (arXiv 2608.02376)

- Post: [kshivendu.dev/blog/token-storage](https://kshivendu.dev/blog/token-storage)

- Benchmarks: [github.com/KShivendu/token-storage](https://github.com/KShivendu/token-storage)

- [tiktoken](https://github.com/openai/tiktoken) · [constriction](https://github.com/bamler-lab/constriction) (ANS) · [streamvbyte](https://github.com/lemire/streamvbyte) · [gigatoken](https://github.com/marcelroed/gigatoken)

- Kalcher, *Compressing token IDs with frequency ordering* (2026) · NVIDIA [Megatron-Core](https://github.com/NVIDIA/Megatron-LM) tokenized `.bin` corpora

<!--
Q&A backup: six-tokenizer generality (3.30-3.40x band); decorrelation (order-0
tokens 2.44 vs order-1 bytes 3.68 bits/byte); the n-gram wall (3.28 -> 3.97 ->
4.01x); the free OOD gate (AUC 0.97-1.00); cost at scale (1B docs: 6.0 TB raw,
4.7 TB LZ4, 2.2 TB +freq+vbyte); Qdrant shipping cost (~34 files, ~1,900 LOC).

Measurement caveat: single-core, P-core pinned. Tokenize is serving-cold with a
64 MB cache sweep before each shot; a back-to-back loop reports ~HALF the cost.
-->
