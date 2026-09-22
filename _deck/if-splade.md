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

Full SPLADE quality at **4.3ms** instead of **57ms** on CPU, with no GPU on the query path.

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

<v-clicks>

- Kumar Shivendu

- Engineer @ Qdrant

- I ❤️ search, databases, and performance.

- Neural Search at BM25 Latency

</v-clicks>

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

## BM25 is a good baseline

<v-clicks>

- Fast, no GPU, and standard baseline for any dataset

- It matches **terms**, not meaning

- A query for `cardiac arrest` will not retrieve a document that says `heart attack`

- That document might be the best answer in the corpus

</v-clicks>

<!--
Set BM25 up as the thing to respect, not the strawman. Most of the room ships it.
The gap is narrow and specific: vocabulary mismatch. Say the cardiac/heart
example out loud, it carries the rest of the talk.
-->

---

## SPLADE expands the document instead

<iframe :src="chart('activations')" class="w-full border-0" style="height: 356px"
        title="SPLADE token activations for heart attack" />

<div class="text-sm opacity-80 -mt-2">

`naver/splade-v3-doc` on the text **"heart attack"**: 2 words in, **71 terms out**. Grey is what the document says, red is what SPLADE adds. Top 10 whole words; 39 of the 71 are subword pieces.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Point at the two grey bars first: heart 1.60, attack 1.13. The words are still
the top two, so this is addition, not replacement.

Then the red: cardiac 0.77, stroke 0.59, chest 0.50. None of those words are in
the document. A "cardiac arrest" query now hits this document at 0.77 on a word
it never contained.

Two numbers worth saying out loud. 84% of the weight mass is on terms the text
never had, 14.36 against 2.73. And 39 of the 71 terms are subword fragments
carrying 35% of the weight.

That is what `card` and `corona` are doing on this chart, and it is the best
part of the slide. card + ##io is cardio. corona + ##ry is coronary. BERT has
30k wordpieces and no single token for those words, so the model spells them
out. If someone asks why the vectors are less interpretable than they look,
this is the answer: a third of the signal is spelling.
-->

---

## The catch: a transformer on every query

<v-clicks>

- SPLADE runs a neural model at **query** time as well as index time

- That adds **50-100ms** per query

- BM25 answers in ~4ms

- So you buy relevance with the cost of ~10x latency and expensive GPUs

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

<iframe :src="chart('quality-latency')" class="w-full border-0" style="height: 356px"
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

- It saves **53ms**, a **13x** cut &mdash; but that is **CPU against CPU**, see two slides on

- And it still beats BM25 by **+3.5% NDCG@10** at the same 4ms

</v-clicks>

---

## Where the 13x actually comes from

<iframe :src="chart('latency-split')" class="w-full border-0" style="height: 356px"
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

## "13x" is a CPU number

Query encode only, batch size 1, median of 40 runs.

| | CPU<br/>Core Ultra 7 155H | A10G GPU | BERT runs? |
| --- | ---: | ---: | :---: |
| `splade-v3` (full) | 23.1ms | **8.7ms** | yes |
| `splade-v3-doc` (IF) | **2.0ms** | 2.9ms | **no** |

<v-clicks>

- A GPU buys full SPLADE only **2.7x** (23.1 &rarr; 8.7ms). A batch-of-1 BERT forward is latency-bound; there is nothing for the parallelism to do

- Inference-free is **faster on CPU than on the A10G**, 2.0 against 2.9ms. No model to run, so the GPU only adds a round trip

- And **1.8 of that 2.0ms is sentence-transformers overhead.** The tokenizer itself is **0.030ms**. Batched at 64 it drops to 0.111ms

</v-clicks>

<!--
This is the slide to have ready when someone says "but we serve SPLADE on a
GPU". They are right, and the answer is better than the 13x.

The 57ms from the earlier chart was measured end to end through Qdrant on a
CPU. I did not record the device at the time, which is the mistake. These
numbers are torch.cuda.synchronize'd so they measure kernel work, not launch.

The counter-intuitive row is the second one. Inference-free is SLOWER on the
A10G. There is no model, so the GPU contributes nothing and the host-device
round trip costs more than it saves. If you deploy this, do not put it on a
GPU. That is not a disappointment, it is the whole point.

2.7x is the number to remember for full SPLADE: a GPU does much less for
interactive query encoding than people expect, because batch size 1 wastes it.
GPUs earn their keep at INDEX time, where you batch thousands of documents.

The third bullet is the one to be careful with, in both directions. My 2.0ms
for inference-free is 94% Python framework overhead; the actual tokenize is
0.030ms. So do not quote 2.0ms as the floor, a tight implementation is far
under it, and the post's 0.3ms is a realistic deployment number.

But the same overhead sits inside full SPLADE's 23.1ms too. Subtract it from
both and you are comparing about 21ms of BERT against 0.03ms of tokenizing.
The honest summary is that the ratio depends entirely on how much framework
you leave in the measurement, which is exactly why I now report the device and
the batch size on every latency number.
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

<iframe :src="chart('throughput')" class="w-full border-0" style="height: 356px"
        title="Document encoding throughput at index time" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Two honest caveats on this chart, and I would give both.

First, the BM25 bar depends entirely on the tokenizer you give it. A plain word
tokenizer indexes at 13,778 docs/sec, 155x faster than SPLADE. Make BM25 pay
the same BERT wordpiece SPLADE pays and it is 1,809, about 20x. Pick the
comparison that matches what you would actually deploy.

Second, and this corrects the write-up: all three SPLADE models index at the
SAME speed, 89 docs/sec. An earlier version of this slide said inference-free
was dearer to index, 83 against 98, and explained it with the extra expansion.
That was three single passes in three different containers. Re-run properly,
one GPU, alternating order, three repeats: 89.1, 89.4, 89.1. The variation
within one model was bigger than the gap between them.

The explanation was wrong too, which is why I should not have shipped it. They
are the same BERT-base forward over the same tokens. How many non-zeros come
out the other end does not change what the forward pass costs.

A million documents is 3.1 hours on one A10G, once. After that every query is
a sparse dot product.
-->

---

## One dataset is one data point

<iframe :src="chart('spread')" class="w-full border-0" style="height: 430px"
        title="Inference-free penalty per dataset" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
STOP AND SAY THIS FIRST, or the numbers look like they contradict the earlier
slides. This is a different experiment. NanoBEIR is ~50 queries and a few
thousand documents per dataset, scored brute-force on an A10G. The 0.7161 /
0.7068 from before was full BEIR scifact, 300 queries, through Qdrant. Do not
compare a bar here to a number there. Compare bars to bars.

Within this panel: the inference-free penalty averages 0.0333 NDCG@10, and it
runs from -0.0824 on arguana to +0.0154 on hotpotqa, where inference-free
actually wins. That is a 6x spread across thirteen domains.

scifact is red only because it is the dataset every earlier slide used. It
lands at -0.0468, mid-pack. Nothing special about it either way.

The honest version of "inference-free costs about 1%" is: on the one corpus I
measured properly, yes. Across thirteen, the number you get depends heavily on
which one you picked.
-->

---

## The two ends of that chart

| | full | IF | delta | mean query length |
| --- | ---: | ---: | ---: | ---: |
| **arguana** | 0.4891 | 0.4067 | **-0.0824** | **193 words** |
| hotpotqa | 0.8281 | 0.8435 | **+0.0154** | 15 words |

<v-clicks>

- A 193-word query with every term at weight 1.0 has no way to say which words matter. A 15-word one barely needs to

- Consistent with the fix: learned weights help **arguana most of all**, +0.0741

- BM25 is also not beaten everywhere. It wins **touche2020** (0.7235 vs full SPLADE's 0.6129) and **climatefever** (0.3126 vs 0.3104)

- Both are stance tasks: a relevant document may *support or refute* the claim, not just share its topic. Expansion finds topically-near documents, which is the wrong target

</v-clicks>

<!--
The query-length row is the one to point at. ArguAna queries average 193 words,
measured on NanoArguAna, against 15 for HotpotQA. Those are the two ends of the
chart and also the two ends of the length range, and the direction is what you
would expect if unweighted terms are the problem.

Do not oversell it as causal from two points. The support is that learned query
weights, which is exactly the fix for "too many equally-loud terms", help
ArguAna more than any other dataset: +0.0741.

Then touche2020. SPLADE loses by 0.11, a big loss, and it loses the same way on
climatefever. Both are stance tasks. Touche queries are SHORT, 6.6 words on
average, so this is not a length effect, it is a task effect.

If someone asks "so when is BM25 still the right call": this slide is the
answer, plus anything where you cannot afford a GPU at index time.
-->

---

## Most of the penalty is fixable

<iframe :src="chart('nano-means')" class="w-full border-0" style="height: 290px"
        title="Gap to full SPLADE for three systems" />

<div class="text-sm opacity-80 mt-1">

The inference-free penalty drops from **0.0333** to **0.0072** &mdash; **78% of it removed** &mdash; and the query side still runs no model.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Four systems, mean over the same thirteen datasets.

BM25 0.5479. Inference-free with uniform weights 0.6004. Inference-free with
learned weights 0.6265. Full SPLADE 0.6337.

The gap that mattered on the previous slide, 0.0333, drops to 0.0072. That is
78% of the inference-free penalty, removed by a lookup table.
-->

---

## What changed: the query terms got weights

Query `"cardiac arrest in the elderly"`, weights the two models actually emit:

| term | `splade-v3-doc` (uniform) | `splade-v3-lexical` (learned) |
| --- | ---: | ---: |
| elderly | 1.000 | **1.881** |
| arrest | 1.000 | **1.469** |
| cardiac | 1.000 | **1.231** |
| in | 1.000 | *dropped* |
| the | 1.000 | *dropped* |

<v-clicks>

- Same doc encoder, same family. The query weight comes from a **vocab-sized table**, not a network

- Wins on **10 of 13**: arguana +0.0741, scifact +0.0638, climatefever +0.0538. Loses on quora (-0.0283), fiqa (-0.0180), nq (-0.0016)

- Beats *full* SPLADE outright on dbpedia, hotpotqa, msmarco and scifact

- Across the 13 datasets, query non-zeros go **76** (full) &rarr; **21** (uniform) &rarr; **16** (learned). Learned is the *sparsest* of the three

- **But not inference-free as shipped.** Its `modules.json` puts the Router *last*, so `encode_query` runs BERT, discards it, then reads the table. Measured: **1 BERT forward per query**, against 0 for `splade-v3-doc`

</v-clicks>

<!--
This is the part of the talk I would build a project on if I were in the room.
"Inference-free" is usually explained as "throw the query encoder away and use
raw tokens". That is only one design. The query side still gets to have
parameters, as long as they are a table you index into rather than a network
you run.

The weights on the slide are measured, not illustrative:
research/if-splade/query_weights.py runs that exact query through both models.
"in" and "the" come back at exactly zero and drop out, which is why the learned
query is SPARSER than the uniform one, 16 non-zeros against 21.

Worth pointing at "elderly" beating "cardiac". The table is not hand-written
IDF from your corpus, it is learned during distillation, so it can disagree
with your intuition about which word matters.

Caveat to say out loud: uniform-vs-learned here is the naver pair, same family
and same doc encoder, so the weight scheme is the only thing that changed.
OpenSearch ships a learned-weight model too and it lands at 0.6187 on the same
panel, but it is a different model, so I would not read the difference between
0.6187 and 0.6265 as being about weights.

The packaging bug is the honest footnote and it is worth 30 seconds. I counted
BERT forward calls: splade-v3-doc does 0 per query, splade-v3-lexical does 1.
Its modules.json is [MLMTransformer, SpladePooling, Router] with the Router at
the end, so the transformer runs and its output is thrown away.

The QUALITY number is unaffected, 0.6265 is what the table produces and that is
the model working as designed. The LATENCY benefit is simply not there out of
the box: 24.7ms per query on CPU, the same as full SPLADE. Routing to the
Router alone gives 0.47ms, but the vectors do not match yet, so I am not
calling that a fix. It is an open packaging issue, not a result.
-->

---

## Which queries actually break?

scifact, 300 queries, full SPLADE against inference-free:

<div class="grid grid-cols-3 gap-4 my-4 text-center">
<div class="p-3 rounded" style="background: rgba(138,144,153,0.12)">
<div class="text-3xl font-bold">70%</div><div class="text-xs opacity-70">identical ranking</div></div>
<div class="p-3 rounded" style="background: rgba(220,36,76,0.12)">
<div class="text-3xl font-bold" style="color:#dc244c">17%</div><div class="text-xs opacity-70">IF worse</div></div>
<div class="p-3 rounded" style="background: rgba(138,144,153,0.12)">
<div class="text-3xl font-bold">13%</div><div class="text-xs opacity-70">IF better</div></div>
</div>

<v-clicks>

- The worst **10** queries carry **47%** of all the NDCG lost

- All three total failures (1.00 &rarr; 0.00) hinge on words BERT's vocabulary does not have, so they shatter into pieces that each get weight 1.0:
  - *schimmelpenning / feuerstein / mims*, *golli / anergic*, *glycolysis / glycometabolic*

- Query length does **not** predict it: losers average 12.7 words, everyone else 12.5

</v-clicks>

<!--
This is the slide that changes how you'd fix it. "1.3% worse on average" sounds
like every query got slightly worse. It is not what happens. Seven queries in
ten rank identically. The average is made almost entirely by a handful of
catastrophes.

And the catastrophes have a shape. None of those words are in BERT's 30k
wordpiece vocabulary, so each one shatters, and with uniform weight 1.0 every
fragment counts the same as "the". Full SPLADE reads the context and puts
weight back on the rare pieces. Inference-free cannot.

Note glycolysis is not exotic, it is a first-year biology word. It still
shatters. So the failure mode is not "rare jargon", it is "out of vocabulary",
and those are not the same set.

One thing to square with the earlier slide: there I said long queries are where
inference-free struggles, across datasets. Here, WITHIN scifact, length does
not separate winners from losers at all, 12.7 against 12.5 words. Both are
true. Across corpora the length range is 15 to 193 words; inside scifact every
query is about 13. You cannot see a length effect in a sample with no length
variation.

Which is the same diagnosis as the previous slide, from the other direction:
the problem is unweighted query terms, not missing expansion.

If you want a 10-minute version of this talk: it is this slide plus the
previous one.
-->

---

## An idea that mostly did not work

<div class="text-center -mt-2 -mb-1 text-sm">

Put a BM25 floor under every term the document contains:
$$ w_t = \max\left(w_{\text{splade}}(t, d),\; C \cdot \text{bm25}(t, d)\right) $$

</div>

<iframe :src="chart('floor')" class="w-full border-0" style="height: 356px"
        title="BM25 floor sweep" />

<div class="text-xs opacity-70 -mt-1">

Zero is no floor. By **C = 0.20**, the value my earlier post recommends for inference-free, all three curves are already below it.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
The idea is from my own earlier post on full SPLADE: a document term that the
model zeroed out is unrecoverable at query time, so put a floor under it. That
post found the best coefficient was C = 0.31 for full SPLADE and C = 0.20 for
inference-free.

Across thirteen datasets and three inference-free models, the best single C
buys +0.0001, +0.0052 and +0.0007. That is nothing. And by C = 0.20 every one
of the three curves is already below zero: -0.0013, -0.0493, -0.0082. The
coefficient that post recommends actively hurts these models.

Say the caveat honestly: my BM25 is wordpiece counts with k1=1.2, b=0.75 over
small Nano corpora, not the implementation that post tuned C on, so I would
not claim "0.20 is wrong". I would claim there is no C you can hard-code.

Leave this slide up a beat. A negative result reported cleanly is worth more to
this audience than a fourth win.
-->

---

## Except where BM25 was already winning

<v-clicks depth="2">

- Tuning C **per corpus** instead: +0.0156, +0.0129, +0.0187. Still small, and that is an oracle, tuned on the test set

- C\* ranges from **0.0 to 0.65** across the 13. There is no constant to ship

- But the lift is not random. It tracks how far BM25 was ahead of the model:
  - correlation **+0.76**, **+0.73**, **+0.43** for the three models
  - for uniform IF: **touche2020** +0.0686, **climatefever** +0.0476 &mdash; exactly the two BM25 was winning

- One exception worth chasing: learned-weight IF on **quora** jumps **+0.0946** at C=0.31, the biggest lift anywhere, and BM25 was *behind* there

</v-clicks>

<!--
So the floor is not a quality knob, it is a BM25-recovery knob. It buys back
lexical matching on corpora where lexical matching was the better strategy all
along. If you already know your corpus is one of those, you did not need the
floor, you needed BM25 or a hybrid.

The quora outlier is the one I cannot explain and would say so. Note that quora
is also the dataset where learned weights LOST the most to uniform, -0.0283.
The floor gives back +0.0946 there. Something about that corpus interacts badly
with the IDF table and BM25 term frequency repairs it. That is a real open
question, and it is a good one to hand the room.
-->

---

## Who should not use this

<v-clicks>

- **Pick an asymmetric model.** A symmetric one in IF mode costs **0.021 NDCG@10** (3.0% relative) and only ties BM25

- **No query-time adaptation.** New drug names, new products, breaking news: the doc encoder had to guess the expansion in advance

- **Domain matters, but not the way I assumed.** SPLADE's margin over BM25 runs from **+0.2559** (nq) to **-0.1106** (touche2020). Quora, where queries and docs already share words, still gives **+0.1275** &mdash; so "they already match" is not the predictor

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
