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
class: 'text-left'
---
<h1 class="!text-3xl !mb-1 !leading-tight">Token-Native Storage</h1>

<div class="text-sm opacity-70 !-mt-1 mb-2">Read and Write in your Agent's Language</div>

<iframe :src="chart('hero')" class="w-full border-0" style="height: 430px"
        title="The same text down two pipelines: LZ4 over bytes, and token IDs" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
The blog's animated hero, live rather than a screenshot of itself. It runs the
same input down two pipelines at once -- LZ4 over bytes on top, the token path
below -- so the argument is on screen before the first word.

Retinted to the deck's language: token path Amaranth, byte path recessive grey.
The site's version is green and amber, which would say something else.

It loops on its own, so let it run while you introduce yourself. Toggle the
preset (English / code / Hindi) if the room wants to see the Hindi case early.
-->

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

- Why is text compression important?

- Different compression algorithms

- Tokens as the storage format: free compression

- Token ID compression techniques

- Agent read/write

- Limitations and what the ecosystem needs

- Future and cost savings impact

</v-clicks>

---

## Why is text compression important?

<v-clicks>

- A vector DB record is a **vector** plus a text payload

- We compress the vector obsessively: Turboquant, binary quantization, Matryoshka

- The text payload gets raw UTF-8, or LZ4. On English: 1.27x

- Text: thousands of characters, 1 byte each. Numeric fields: 2-4 bytes

</v-clicks>

---

## Text compression for humans

| | English | encode | decode | remarks |
| --- | ---: | ---: | ---: | --- |
| **LZ4 (Most engines use this)** | 1.27x | 2.9us | 1.0us | barely compresses |
| gzip `-9` | 1.92x | 26us | 8.0us | still a byte codec |
| zstd `-19` | 1.94x | 209us | 4.5us | slow for what it buys |
| brotli `q11` | 2.57x | **2,777us** | 9.5us | ~1,000x LZ4 to encode |
| `zstd --train` | 2.72x | 359us | 3.2us | dictionary ships with your data |
<!-- | LZ4 over 16KB **blocks** | 1.43x | 7.8us | 7.6us | **7 docs** share a block, so one read decodes all 7 | -->

<v-clicks>

- 512 token chunk (~2.25KB of English)

- LZ4 is most common in DBs due to speed but gives you only 1.3x compression

- DBs avoid zstd despite 1.94x compression because it takes `200us`+ to encode/write

</v-clicks>

<!--
The 2x2 is in 07_kalcher_baseline/read_latency_2x2_results.json, ES/Lucene-style
blocks (<=16KB or 128 docs, whole block compressed, one doc read decompresses it).

Why 7: a block caps at 16 KB or 128 docs, whichever comes first, and a
512-token English chunk is ~2,344 UTF-8 bytes. 16,384 / 2,344 = 7.0, so byte
size always binds and the 128-doc cap never does. That is why decode is 7.6us
against LZ4's 1.0us point decode -- almost exactly 7x, because one reader
decompresses all 7 documents to get one. Denser corpora pack more per block and
pay more: code 14 docs/block, Hindi 18 (block_codecs_results.json ::
block_meta). At 256 tokens it is 13 / 28 / 37.

Do NOT reinstate the old "every copy pays it again": snapshots, WAL, replicas,
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

## But what about agents?

<!-- depth="2" reveals the nested points one at a time as well. It has to be
     per-tag: overriding the builtin's default in setup/main.ts re-registers the
     component and breaks click accounting -- the slide opens with 4 of 7 items
     already shown. -->

<v-clicks depth="2">

- Decode (Read) is much slower for the models. Why?

- Because models (LLM Agents, Re-rankers, or Embedders) don't read UTF-8.
    - They must turn it into tokens first, on **every read**
    - Add ~235us on every agent read. (decode+tokenize). With LZ4 decode: 1us -> 236us
    - Add ~50us on every agent write (detokenize+encode). With LZ4 encode: 3us -> 53us

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

<v-clicks depth="2">

- This napkin math was my original motivation for the experiment.

- Looks like we can get higher compression than zstd (1.94x)!
    - and much higher than standard LZ4 1.27x

- OpenAI `r50k` tokenizer has 50,257 token vocab, which fits in a `uint16` (65k)

- Lossless compression. 
    - Unknown terms are split into existing vocab: `tokenization -> token | #ization`

</v-clicks>

---

# Tokens

<v-clicks>

- BPE (Byte Pair Encoding) starts from raw bytes and repeatedly merges the most frequent adjacent pair

- `"storage"` is **one** token. `"Token-native"` is three: `Token` + `-` + `native`

- Words often carry the leading space into the token: `" cat"` is 4 bytes of UTF-8, but 1 token

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


<v-clicks>

- We got exactly 2.25x. Napkin math was right!
- With some compression algorithms on top (+freq, +ANS) you reach 2.7-3.4x!

</v-clicks>

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

<v-clicks>

- raw token IDs work out of the box when the tokenizer knows your language. 
- r50k doesn't know Hindi, but o200k does. raw: 2.5x, +freq: 4.5x, +ANS: 5.9x

</v-clicks>
---

## Token ID Compression Mechanisms

<v-clicks depth="2">

- +ANS achieves high compression (o200k: 1.6x -> 3.4x) but is slow (30us) to read.

- I discovered that BPE assigns IDs in **merge-discovery order**, not by how often a token is used
- Sorting token IDs by frequency o200k on English (+freq): 1.6x → 2.7x
- Why this works? 
    - The most frequent token can vary. For example with o200k:
    - English: ` the`: 290 -> 0 (most common. 2 -> 1 byte)
    - English: `{`: 90 -> 200_018 (last slot because never used)
    - Code: `␣␣␣` (3 spaces):  262 -> 2
    - Hindi: `भारत`:  29_292 -> 73

- We covered two methods:
    - +ANS: an entropy coder (**ANS**, frequent tokens get fewer bits)
    - +freq: re-rank by frequency and pack with `streamvbyte` (recommended)

</v-clicks>

---

## Pick your compression

<iframe :src="chart('frontier')" class="w-full border-0" style="height: 400px"
        title="Compression ratio against decode cost" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Live scatter now, not a PNG. It was a PNG because a scatter is nothing but
markers and the blog's LineChart threw a TDZ on any series with markers; that
is fixed, so every point is hoverable and the room can ask about any one of
them.

Up and to the LEFT is better: more compression, less time to decode.

All o200k here, so raw IDs are 1.59x rather than the 2.25x quoted earlier --
o200k needs 3 bytes per ID where r50k fits in 2. Say that before someone spots
the mismatch with the napkin-math slide.

The shape of the argument: LZ4 is bottom-left (cheap, barely compresses),
+ANS is top (best ratio) but the dearest token method to decode, and
+freq+vbyte sits in the corner most people want -- nearly the ratio, a
fraction of the decode.
-->

---

## Before: Translate on every read/write

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

<v-clicks>

- Models don't understand UTF-8. So you translate on every read/write

</v-clicks>

---

## After: Zero translation cost

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

<v-clicks>

- The UTF-8 boxes are gone. **No translation required** on read/write

</v-clicks>

<!--
Same layout as the previous slide so the difference is the missing middle row.
Before: token IDs -> UTF-8 -> disk, and back again on every access.
After: the IDs are the stored form, so a read hands them straight to the model.
Numbers are o200k +freq: 2.7us to encode, 3.6us to decode, against 237us to
re-tokenize. Detokenize survives, but once, at the edge, for a human.
-->

<!--

Agent read


- LZ4 decompresses in 1.0us, then spends **263us** tokenizing text for the model

- Token-native serves the IDs directly: 3.6us with `+freq`, 28.8us with `+ANS`

- That's ~66x on every single read

- Read is where it compounds: it happens on every retrieval, forever. Writing happens once

- Why bother about `us` optimizations?
    - Low level optimizations compound very fast due to millions/billions of repetitions
    - Machines need faster interfaces. Humans don't feel `ms` but not the case with agents.
    - We don't choose zstd because it takes `209us` but here we are okay with `1+263us`.

The model already produced the IDs. A byte store throws them away, detokenizes
(50.3us), then compresses. zstd-19 costs 259.5us a write, 209us the compressor.
-->

---
 
## Agent reads

<iframe :src="chart('agent-read')" class="w-full border-0" style="height: 400px"
        title="Agent and human read latency" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<v-clicks>

- LZ4+tokenize: 236us -> 3.6us is **66x faster**
- Agents read hundreds of chunks for a single query

</v-clicks>

<!--
Toggle Agent/Human on the right, corpus on the left. Numbers are the post's own
`latValues`, pulled out of token-storage.mdx at build time so the deck cannot
drift from the blog.

Numbers come from 03_latency/latency_grid_results.json, the same file the
ladder slide quotes. They used to come from the post's published table, which
is stale against the repo -- it has tokenize at 445.6us where the grid measures
235.3 -- so this chart used to say 450us while the ladder said 235us.

TOKEN IDs, English: LZ4 236.3us, gzip-9 243.3, zstd-19 239.8, zstd --train
238.5. They differ by 3% because decompress is 1.0-8.0us and the other 235.3 is
the tokenize, identical for all of them. That flat wall IS the slide. Token
side: r50k raw 0.3us, o200k raw 4.6, o200k +freq 3.6, o200k +ANS 28.8. The
fastest path is ~790x, the +freq one 66x.

UTF-8 is the honest other side: there the byte codecs win outright, LZ4 at
1.0us against +freq's 53.9, because now somebody has to detokenize (45.5us) and
nobody has to tokenize. Say it before the room does -- and then say that a
human needs ~90 seconds to read the chunk, so 54us on that path is ~2 million
times smaller than the reader it serves.
-->

---

## Agent writes

<iframe :src="chart('agent-write')" class="w-full border-0" style="height: 400px"
        title="Agent and human write latency" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>


<v-clicks>

- The model **already produced the IDs**. 
- A byte store throws them away, detokenizes (50.3us), then compresses

</v-clicks>

<!--
LOG axis, unlike the read chart: this spans 0.5us to 405us, and on a linear
axis every token bar vanishes into the baseline.

TOKEN IDs, English: r50k raw 0.5us against LZ4's 48.4us, gzip-9 71.6, zstd-19
254.8, zstd --train 405.0. The model already emitted the IDs, so a token store
just packs them; a byte store has to detokenize first (45.5us) and then
compress.

UTF-8 flips it: LZ4 2.9us against r50k raw's 235.8, because a text writer hands
you characters and somebody has to tokenize them. Real cost, rarer path -- in
an agentic system the agent does most of the writing.

AGENT write, English: r50k raw 1.9us against LZ4 35.1us, gzip 130.8, zstd-19
727.9, zstd --train 960.2. The model emitted the IDs, so a token store just
packs them; a byte store has to detokenize first and then compress.

HUMAN write: r50k raw 439.8us, LZ4 11.4us -- flipped, because a human hands you
text and somebody must tokenize it. That is a real cost and worth naming. In an
agentic system it is also the rarer path: the agent does most of the writing.
-->


<!--
This slide concedes the counter-case, so lead with the table and let the room
see both directions before you argue. Symmetric on purpose: nobody can say the
cost was hidden.

Numbers are English/o200k serving-cold from 03_latency/latency_grid_
results.json: tokenize 236.7us, detokenize 50.3us, a 4.7x gap. o200k to match
the diagrams and the rest of the deck; r50k would be 235.3 / 45.5, a 5.2x gap,
same story. Confirmed independently by 09_cold_tokenize, which measures 267.0 /
50.8 for o200k on the same chunks.

The gap holds across corpora with their native tokenizers -- prose 5.2x, code
5.3x (267.6 / 50.2), Hindi 4.7x -- and widens warm to 10-16x, because
detokenize benefits more from a hot table than tokenize does.

Detokenize did NOT get faster at any point; 45 and 50 are r50k and o200k, not
an old and a new number. Only tokenize moved, from the post's stale 445.6.

Why it is structural, which also pre-answers the next slide: detokenize is one
lookup per token and a concat. Tokenize has to FIND the tokens first -- regex
pre-split, then a merge loop against a 50-200k vocabulary. A faster
implementation moves both, not the gap between them.

If asked "what about a text-heavy workload with no models at all": the last
bullet. The compression is 2.3-3.4x regardless of who reads.

## Someone always converts

| you store | a model reads | a screen reads |
| --- | --- | --- |
| UTF-8 — today | **tokenize 237us** | free |
| token IDs | free | **detokenize 50us** |

- You don't get to skip the conversion. You choose **which direction** to pay it

- Detokenize is a **table lookup**; tokenize is a **search**: regex split, then merge against a 50-200k vocabulary. **5x cheaper**, and structural rather than an implementation detail

- It is also the rarer direction: an agent reads hundreds of chunks per query, a person reads one summary at the end

- Generated text never converts at all. The model already emitted the IDs

- And if you never serve an agent, the **compression still holds**

-->


---
hide: true
---

## Bold idea: Translate at the client

| | today | at the client |
| --- | --- | --- |
| upload | UTF-8 on the wire | token IDs, **2.3x less** |
| server write | tokenize every doc | nothing to do |
| agent read | tokenize every read | hand over the IDs |

<v-clicks>

- Your browser already decodes UTF-8 on every character for rendering. Hindi character `भ` is **3 bytes** with no glyph in ASCII. Token `455` to `cat` is the same idea.

- Detokenize **7.9us** against UTF-8's **0.8us**. Ten times a step nobody has ever called a cost

</v-clicks>

<!--
2.3x is raw packed IDs -- what a client can do with only the tokenizer, no
frequency table. The server re-encodes at rest for more: +freq 2.7x, +ANS 3.4x.
Do not quote 3.4x as the wire number; a browser will not be running ANS.

The multiplier lands on egress at $0.09/GB, replication traffic, cross-region
sync and page-cache density, not just the disk bill.

Say the limit before the room does: UTF-8 is frozen and universal, tokenizers
are neither. Client-side tokenizing means shipping a ~2MB vocabulary and
pinning both ends to one version. Same "no shared vocabulary" problem as the
Limitations slide, and the honest ceiling on the browser analogy.

Measured on a 512-token English chunk (~2,288 bytes): UTF-8 decode 0.8us warm /
3.9us serving-cold, detokenize 7.9us / 37.1us. 3 GB/s against 290 MB/s.
-->

---
hide: true
---

## What if tokenizers get faster?

<v-clicks depth="2">

- My original argument assumes tokenizing costs ~237us. I measured that with `tiktoken`

- If tokenization gets faster (they will), 

- However tokenization cost can never be 0.

- Compression win is the real win! It saves you more money than latency does. Less RAM, Disk, Network Egress cost
    - The effects are amplified due to replication, WAL, etc.

</v-clicks>

---

## Current limitations

<v-clicks>

- Pays off end to end only if reader and writer share a tokenizer. Anthropic and Google (except Gemma) haven't published theirs

- vLLM accepts token IDs. But private LLM APIs (OpenAI, Anthropic) don't

- Frequency tables should be corpus/language specific or compression could be hurt (same for existing compressors)

</v-clicks>

---
hide: true
---

## Interface

```js {all|1-3|4-8|9-12}
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

- Ask for `"tokens"` to skip detokenization. 
- NOT available in Qdrant for now. 


---

## Future and impact

<v-clicks depth="2">

- In agentic products, agents read and write more than humans (ChatGPT, Claude Code, Perplexity)
    - A question can trigger a search that reads hundreds of chunks before answering your question
    - LLMs are also very verbose while replying. They also produce lots of thinking tokens

- Agents produce massive amounts of data. Compression saves you a lot on RAM, Disk, Network Egress, etc. 
    - Storing 1 TB data costs you 6k$ / year at 0.50$ / GB / month for Disk
    - Compression of 1.27x (LZ4) gets you to 4.7k$ / year
    - If it's 2.73x (o200k+freq) instead, gets you to 2.2k$ / year

- Tokenization should be made faster (gigatoken) and it makes it easier to achieve the compression we want

- I believe LLM, Embedding Model, and Reranker tokenizers should converge to common standards like we agreed for UTF-8
    - Already happening with new embedding models that inherit LLM base (Qwen -> Jina)

</v-clicks>

---

## Summary

<div class="grid grid-cols-[1fr_auto] gap-8 items-start">
<div>

<v-clicks depth="2">

- Tokenizers that know your language can achieve higher compression than popular algorithms (LZ4, gzip, zstd) on UTF-8 bytes

- BPE token IDs can be sorted by frequency in your corpus so you get more compression

- Agentic products can benefit from database that supports reading and writing Token IDs instead of UTF-8 text bytes

- Links
  - [kshivendu.dev/x](https://kshivendu.dev/x)
  - [kshivendu.dev/linkedin](https://kshivendu.dev/linkedin)
  - [talks.kshivendu.dev](https://talks.kshivendu.dev)

- Paper [arXiv 2608.02376](https://arxiv.org/abs/2608.02376) · [post](https://kshivendu.dev/blog/token-storage) · [benchmarks](https://github.com/KShivendu/token-storage)

</v-clicks>

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
