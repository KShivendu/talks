---
theme: default
title: 'Inference-Free SPLADE'
colorSchema: all
routerMode: hash
# Marp decks let you copy from the slide. Slidev's default drag-to-pan selects
# the deck instead of the prose, and people do copy from these.
selectable: true
class: 'text-left'
---

<h1 class="!text-3xl !mb-1 !leading-tight">Inference-Free SPLADE</h1>

<div class="text-base opacity-70 mb-4">Neural search at BM25 latency</div>

<div class="text-sm opacity-60">Kumar Shivendu &middot; Engineer @ Qdrant</div>

<div class="mt-8 text-sm opacity-70">

Full SPLADE quality at **4.3ms** instead of **57ms**, with no GPU on the query path.

</div>

<!--
Lecture for Doug Turnbull's course. The whole talk is one claim: you can have
SPLADE's quality at BM25's latency, and the only thing you give up is index time.

Everything here is BEIR scifact (5,183 docs, 300 queries) on Qdrant with native
float sparse scoring. Doc encoding on a Modal A10G. Write-up:
kshivendu.dev/blog/if-splade
-->

---

# $ whoami

<div class="grid grid-cols-[1fr_auto] gap-8 items-start">
<div>

- Kumar Shivendu

- Engineer @ Qdrant

- I ❤️ search, databases, and performance.

- Blog: [kshivendu.dev/blog](https://kshivendu.dev/blog)

</div>
<img :src="$asset('shivendu.jpg')" class="h-64 rounded-lg" />
</div>

---

## Topics to cover

<v-clicks>

- What BM25 gets right, and the one thing it can't do

- What SPLADE adds, and what it costs you

- Inference-free SPLADE: moving the model off the query path

- The benchmark: six setups, two backends

- The catch, and who shouldn't use this

</v-clicks>

---

## BM25 is hard to beat

<v-clicks>

- Fast, no GPU, and competitive on most retrieval benchmarks

- It matches **terms**, not meaning

- A query for `cardiac arrest` will not retrieve a document that says **heart attack**

- That document might be the best answer in the corpus

</v-clicks>

<!--
Set BM25 up as the thing to respect, not the strawman. Most of the room ships it.
The gap is narrow and specific: vocabulary mismatch. Say the cardiac/heart
example out loud, it carries the rest of the talk.
-->

---

## SPLADE expands the document instead

<iframe :src="chart('activations')" class="w-full border-0" style="height: 400px"
        title="SPLADE token activations for heart attack" />

<div class="text-sm opacity-80 -mt-2">

`naver/splade-v3-doc` on the text **"heart attack"**. Grey is what the document says. Red is what SPLADE adds.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Point at the two grey bars first: heart 1.60, attack 1.13. The words are still
the top two, so this is addition, not replacement.

Then the red: cardiac 0.77, stroke 0.59, chest 0.50, death 0.36. None of those
words are in the document. The cardiac-arrest query now hits at 0.77.

Weights fall off fast, 1.60 down to 0.27 across ten terms. The tail contributes
but does not win the match.
-->

---

## The catch: a transformer on every query

<v-clicks>

- SPLADE runs a neural model at **query** time as well as index time

- That adds **50-100ms** per query

- BM25 answers in ~4ms

- So you buy relevance with an order of magnitude of latency

</v-clicks>

<!--
This is the slide that motivates everything after it. 50ms is not fatal on its
own, but it is fatal if you were previously at 4ms, and it needs a GPU sitting
in the query path to be that fast at all.
-->

---

## What if the model never sees the query?

<v-clicks>

- Run the model **only at index time**, on documents

- At query time, just tokenize: `cardiac arrest` becomes token IDs `[3684, 6295]`, each weight 1.0

- No model, no GPU, no inference on the query path

- Pay once, upfront. Queries stay fast

</v-clicks>

---

## The whole query encoder

```python
def encode_query_inference_free(tokenizer, query: str):
    enc = tokenizer(query, add_special_tokens=False,
                    truncation=True, max_length=512)
    unique_ids = list(set(enc["input_ids"]))
    return SparseVector(indices=unique_ids,
                        values=[1.0] * len(unique_ids))
```

<v-clicks>

- One tokenizer call, then one sparse dot product

- Every weight is 1.0. There is nothing to learn at query time

</v-clicks>

<!--
Worth pausing on: this is the entire query side. If someone asks how it can
possibly work, the answer is on the next slide, the doc encoder was trained
knowing this is all it would get.
-->

---

## Does it actually hold up?

<iframe :src="chart('quality-latency')" class="w-full border-0" style="height: 400px"
        title="Quality against query latency" />

<div class="text-sm opacity-80 -mt-2">

BEIR scifact, 5,183 docs, 300 queries. Three models, full and inference-free, plus BM25.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Let them read it before you talk. Then:

Dropping query-side inference costs 0.0093 NDCG@10, 1.3% relative, and saves
53ms. Same model family, naver/splade-v3 against naver/splade-v3-doc, which is
the cleanest apples-to-apples measure available.

Nothing sits above and to the left of SPLADE-IF, because at 4.3ms the only
thing left on the query path is the sparse dot product itself.

The one that surprised me: PP-sym in IF mode lands at 0.6859 against BM25's
0.6830. On 300 queries I call that a tie, not a win. Say so before someone
squints at the chart.
-->

---

## 13x faster, 1.3% worse

| | NDCG@10 | median latency |
| --- | ---: | ---: |
| SPLADE-Full (naver) | 0.7161 | 57.2ms |
| **SPLADE-IF (naver)** | **0.7068** | **4.3ms** |
| BM25 | 0.6830 | 4.0ms |

<v-clicks>

- Dropping query-side inference costs **0.0093 NDCG@10**, 1.3% relative

- It saves **53ms**, a **13x** cut

- And it still beats BM25 by **+3.5% NDCG@10** at the same 4ms

</v-clicks>

---

## Where the 13x actually comes from

<iframe :src="chart('latency-split')" class="w-full border-0" style="height: 400px"
        title="Query latency split into embed and search" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Point at the red segment. Query embed is 50.0ms for full SPLADE and 0.3ms for
IF. Search barely moves, 3.6 to 7.1ms for everything on the chart.

IF's 0.3ms is a tokenizer call, not a model. BM25's 0.1ms is the same kind of
work, which is exactly why those two bars look alike.

So "inference-free" removes a model relative to full SPLADE. Relative to BM25 it
removes nothing, both are a sparse dot product.
-->

---

## Why does it work at all?

<v-clicks>

- `naver/splade-v3-doc` is an **asymmetric** model: trained knowing queries will be raw tokens with no weighting

- So the doc encoder over-expands to compensate

- Avg non-zeros per doc: **325** for the IF model against **286** for full SPLADE

- The densest index in the benchmark is the inference-free one. That is not an accident, it is the trade

</v-clicks>

<!--
This is the mechanism slide and it is the answer to "surely dropping the query
encoder must hurt". It does not hurt much because the work moved rather than
disappeared. Front-loaded into the index.

Sparsity table from the post: splade-v3-doc 325, splade-v3 286, opensearch GTE
244, Splade_PP 205.
-->

---

## The bill: free queries, expensive index

<iframe :src="chart('throughput')" class="w-full border-0" style="height: 400px"
        title="Document encoding throughput at index time" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
BM25 indexes 17-25x faster, on a CPU. 1,439 docs/sec against 58-83 for the IF
models, which need a GPU at all.

The one people get wrong: inference-free is not cheaper to index than full
SPLADE, it is slightly dearer. 83 docs/sec against 98, because the asymmetric
model expands harder to cover the missing query expansion.

A million documents is 3.3 to 4.8 hours, once. After that every query is a
sparse dot product.
-->

---

## Who should not use this

<v-clicks>

- **Pick an asymmetric model.** A symmetric one in IF mode costs **0.021 NDCG@10** (3.0% relative) and only ties BM25

- **No query-time adaptation.** New drug names, new products, breaking news: the doc encoder had to guess the expansion in advance

- **Domain matters.** Best where vocabulary bridging is the problem (scientific, medical, legal). On e-commerce, titles already match queries and the gap narrows

- **You need a GPU at index time**, and a re-encoding pipeline if the corpus churns

</v-clicks>

<!--
Ship the limitations slide. This is where the credibility comes back after four
slides of wins, and in a course full of practitioners it is the slide they will
actually use to decide.
-->

---

## Key takeaways

<v-clicks>

- **Inference-free SPLADE nearly matches full SPLADE.** 0.0093 NDCG@10 (1.3%) for a **13x** latency cut, 57ms to 4.3ms

- **The saving is one component.** The query encoder, 50ms of it. Search time does not change

- **Use an asymmetric model.** Trained for raw-token queries. A symmetric one only ties BM25

- **The cost is index time, and only index time.** 83 docs/sec on an A10G, then queries are free forever

</v-clicks>

<div class="mt-6 text-sm opacity-70">

Full write-up and the Lucene/pyserini numbers: [kshivendu.dev/blog/if-splade](https://kshivendu.dev/blog/if-splade)

</div>
