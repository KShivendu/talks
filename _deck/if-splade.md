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

Almost SPLADE quality at ~8x faster queries, and ~19x faster at the tail.

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

## What we'll cover

<v-clicks>

- **BM25** and its limits

- **SPLADE**: learned terms and weights

- **Inference-free SPLADE**: taking the model off the query path

- What it costs, where it wins and loses, and how to ship it

</v-clicks>

---

## BM25 and its limits

$$ \text{score}(q,d) = \sum_{t \,\in\, q \cap d} \underbrace{\text{idf}(t)}_{\text{how rare}} \cdot \underbrace{\frac{f(t,d)\,(k_1+1)}{f(t,d) + k_1(1 - b + b\frac{|d|}{\text{avgdl}})}}_{\text{how often, length-normalised}} $$

<v-clicks depth="2">

- Fast, no GPU, and a solid baseline

- Only considers terms that exist in both query and doc. Notice `t ∈ q ∩ d`.

- Users can ask for the same thing in different ways.

    - A query for `sofa` ignores a document saying `couch` 

- **Weights** of those terms buys **precision/ranking** (BM25 handles only this)

- **Which terms** are considered buys **recall** (wider net)

</v-clicks>

<!--
One slide, because the formula is the explanation. Set BM25 up as the thing to
respect, not the strawman.

Point at the summation index. Query "sofa", document "We delivered the couch to
the living room on Tuesday." The intersection is empty, so the score is zero.
Not low. Zero. No amount of clever weighting rescues a term that is not in the
sum. Say it out loud, it carries the rest of the talk.

Checked: those two share no wordpieces at all, so BM25 really does score that
pair 0.000. And splade-v3-doc puts "sofa" in that document's vector at 1.513,
the fourth-heaviest term in a document that never says the word. It also adds
furniture 1.11 and cushions 0.97.

I used cardiac arrest / heart attack here before and it was wrong. Those are
different conditions -- a heart attack is a blocked artery, a cardiac arrest is
an electrical failure -- so the slide was asserting a relevance judgment a
clinician would reject. Do not go back to it.

Then the pair to hold for the next forty minutes: expansion changes WHICH terms
are in the sum and buys recall. Weighting changes what each is worth and buys
precision. Everything after this is about who gets to pull which lever, and
when.
-->

---

## Rewriting and expanding terms is powerful

<v-clicks depth="2">

- Synonym lists, stemming, RM3 pseudo-relevance feedback: all decades old, all buy recall

- All **context-free**, so all are naive. 
    - `apple` expands into `fruit` and `iphone`
    - You bought recall but hurt precision
    - Imagine extreme: expand too much and return all vocab items - it becomes brute force search

- The right expansion and weighting depends on **what the document is about**
    - BERT/transformer models are great at understanding documents

</v-clicks>

<!--
This is the slide that stops SPLADE sounding like magic. Expansion is not new.
Lucene has shipped synonym filters forever, and RM3 has been in the literature
since 2001.

What was always hard is choosing. A static synonym list cannot know that
"apple" in a produce catalogue and "apple" in a phone review need opposite
expansions. So classic expansion is a blunt recall instrument that costs you
precision, which is why most teams tune it down or turn it off.

The pitch for SPLADE in one sentence: a contextual model already solves the
selection problem. It has read the whole document. Let it choose the terms.
-->

---

## Same word, two documents, opposite expansions

<div class="text-sm">

```
"A mouse had got into the flour and chewed through the bag."
    adds   mice 2.06   rodents 1.37   chew 1.29   rat 1.21   bread 1.17

"My mouse stopped scrolling so I replaced the batteries."
    adds   battery 1.69   mice 1.62   scroll 1.41   keyboard 0.96   replacement 0.98
```

</div>

<v-clicks depth="2"> 

- The two expansion sets share **1 of 23** terms, and it is `mice`. 
    - A synonym list could only cover `mouse -> mice`
    - Notice `mice: 2.06` vs `mice: 1.62` depending on context

</v-clicks>

<!--
This is the slide that earns the previous one. "Context-free expansion is
blunt" was an assertion until now; here it is measured. Same word, two ordinary
sentences, and the rodent reading and the peripheral reading share exactly one
term. A synonym dictionary has one entry for "mouse" and has to pick.

Point at "mice" appearing on BOTH sides, at 2.06 and 1.62. That is the honest
detail and it usually gets a laugh: the model thinks the plural of a computer
mouse is mice too, and it is not clear it is wrong.

If you want it starker, spring gives zero overlap and needs no explaining at
all. "The daffodils come up in early spring, before the tulips" adds flower
1.34, bulbs 1.10, bloom 0.95, april 0.78. "The spring in the latch snapped and
the door swung open" adds doors 1.31, hinges 1.18, locks 1.27, swing 1.31.
Nothing in common.

The third bullet is quiet here on purpose. Just plant it: the contextual work
is document-side. You cash it in later, when the query encoder comes off --
that is the slide where this fact stops being trivia and becomes the reason the
whole idea works.

Measured by research/if-splade/contextual_expansion.py.
-->

---

## SPLADE: learned tokens and weights

<div class="text-xs leading-tight">

```
  "heart attack"  →  [CLS]   heart   attack   [SEP]        4 positions, through BERT
                        │       │        │       │
     MLM head ──────────┴───────┴────────┴───────┘
                        ↓       ↓        ↓       ↓
     EVERY position scores ALL 30,522 words.  score = log(1 + ReLU(logit))

                     [CLS]   heart   attack   [SEP]      max    kept from
        heart        0.537   1.599    0.962   0.000  →  1.599   heart
        attack       0.000   0.000    1.133   0.000  →  1.133   attack
        cardiac      0.000   0.767    0.000   0.000  →  0.767   heart
        stroke       0.000   0.323    0.589   0.000  →  0.589   attack ---> not from heart
        disease      0.331   0.000    0.669   0.000  →  0.669   attack
          ⋮            ⋮       ⋮        ⋮       ⋮           ⋮
     words scored:     47      19       25       0      →  71 non-zero of 30,522

  the indexed vector, a bag of weighted words:

     { heart: 1.599, attack: 1.133, die: 0.773, cardiac: 0.767, ...
       card: 0.568, ... ##io: 0.347, ... }            71 entries, 39 of them subwords
                                                      card + ##io spells "cardio"
```

</div>

<v-clicks>

- **Every token scores the whole vocabulary**, then each vocab item keeps its max score

- Original tokens get get higher weight than expansions. Some are dropped

</v-clicks>

<!--
The point of the formula is that the output lives in the same space as BM25's:
a sparse vector over a fixed vocabulary, scored by a dot product. You can put
it in Lucene or Qdrant and nothing downstream changes. That is why this is an
extension of BM25 rather than a replacement for it.

Where the numbers come from: BERT's MLM head is the layer that, during
pre-training, guessed the masked word. It emits a score for all 30,522
wordpieces at every position. SPLADE takes ReLU so only positive evidence
counts, log1p so a word screamed ten times does not swamp everything, and max
over positions so a term counts once at its strongest.

ReLU plus log1p is also what makes it sparse: most of the 30,522 go to exactly
zero. Measured on scifact, 286 survive. That is 0.9%, which is why a normal
inverted index handles it.

Two numbers in the diagram worth pointing at: [CLS] scores 47 words, more than
either real token, and [SEP] scores none. The summary position does its own
expansion.

Do not claim cardiac is a synonym here. A heart attack is a blocked artery, a
cardiac arrest is an electrical failure; they are different conditions. The
row is still a fine MECHANISM demo -- it shows heart scoring a word the text
never contained -- but if anyone in the room does health search, get in first:
splade-v3-doc gives cardiac 0.767 on this document and gives myocardial
exactly 0.000, so it learned the co-occurrence and missed the true synonym.
That is the precision cost of expansion, live. The vocabulary-mismatch claim
itself is made earlier with sofa and couch, which really are synonyms.

The "original tokens outrank expansions" claim is measured, not an impression:
across 40 scifact documents the single highest-weighted term is one the
document actually contains in 40 of 40, and 91% of each top 10 is its own
words. So expansion is genuinely additive here, it does not displace the
literal signal. Note the two framings differ and both are true: expansions lose
on per-term RANK but win on total MASS, 84%, because there are simply far more
of them.

Worth 20 seconds if the room is engaged: 39 of those 71 terms are subword
fragments carrying 35% of the weight, and that is what `card` and `corona` are
doing further down the bag. card + ##io is cardio, corona + ##ry is coronary.
BERT has no single token for those words so the model spells them out. If
anyone asks why sparse vectors are less readable than the "it adds synonyms"
story suggests, that is the answer: a third of the signal is spelling.

If anyone asks how it is trained, do not put it on a slide, just answer:
splade-v3 distills from a cross-encoder with two losses mixed, KL-Div at
lambda 1 and MarginMSE at lambda 0.05, 8 negatives per query. The paper says
"MarginMSE (resp. KL-Div) focused more on Recall (resp. Precision)", so the
two levers from the BM25 slide are literally the two terms of the loss.
Lassance et al., SPLADE-v3, arXiv:2403.06789. I do not have the v3 sparsity
regularizer settings, so say that rather than guess.
-->

---

## Both are a bag of weighted tokens

<div class="text-sm">

> Logitech MX Master 3 Wireless Mouse

</div>

<div class="grid grid-cols-[auto_1fr] gap-x-8 text-sm">
<div>

| token | BM25 | SPLADE |
| --- | ---: | ---: |
| logitech | **12.31** | |
| &nbsp;&nbsp;`log` | | 0.64 |
| &nbsp;&nbsp;`##ite` | | 0.66 |
| &nbsp;&nbsp;`##ch` | | 0.66 |
| mouse | 8.56 | **2.31** |
| wireless | 6.84 | 1.60 |
| *mice* | | **1.99** |
| *keyboard* | | 1.07 |

</div>
<div>

<v-clicks>

- Both BM25 and SPLADE are sparse vectors. **6 tokens** against **66**

- The italic tokens are **expansions**. All **hardware** sense, no rodent

- BM25 ranks by **rarity**. SPLADE puts `mouse` on top &mdash; what the document is **about**

- `logitech` is not a BERT token, so SPLADE stores it as **three wordpieces**. A query for it tokenizes the same way and matches

</v-clicks>

</div>
</div>

<!--
Real Amazon product, real ESCI statistics over 315,663 items.

Both sides are {token: weight} over a vocabulary, so either drops into the same
inverted index. Then the differences.

Second bullet is the callback. Two slides ago "mouse" was ambiguous; here the
model has read "Logitech" and "wireless" and gone entirely to the peripheral
sense -- mice, keyboard, click, peripheral -- with nothing about rodents. That
is the contextual expansion working, on a product listing.

Third bullet is the teaching point. BM25's ordering is driven by rarity, so
"mx" at 11.15 outranks "mouse" at 8.56. SPLADE puts "mouse" first at 2.31,
because that is what the listing is for. Rarity is a proxy for importance and a
model that has read the text does not need the proxy.

Why "logitech" is not a row: it is not a single BERT token, it is log + ##ite +
##ch, so a word-level table cannot show it honestly. The document does carry
those pieces at 0.644, 0.655, 0.656, and a query for "Logitech" scores 1.955
here. Every token in the table above IS a single wordpiece, so the two columns
are comparing the same thing.

Do NOT raise the zeroed-brand problem here. This slide is still explaining what
SPLADE is. It comes back on the limitations slide with the numbers, which is
where it earns its weight.

Measured by research/if-splade/bag_of_words_esci.py.
-->

---

## The catch: a transformer on every query

<v-clicks>

- SPLADE runs a neural network (transformer) at **query** time as well as index time

- That adds **50-100ms** per query on CPU

- BM25 answers in <5ms on CPU

- So you buy relevance at the cost of ~10x latency OR use GPUs

</v-clicks>

<!--
This is the slide that motivates everything after it. 50ms is not fatal on its
own, but it is fatal if you were previously at 4ms, and it needs a GPU sitting
in the query path to be that fast at all.
-->

---

## What if we remove the model from the query path?

```python
def encode_query_inference_free(tokenizer, query: str):
    enc = tokenizer(query, add_special_tokens=False, truncation=True, max_length=512)
    unique_ids = list(set(enc["input_ids"]))
    return SparseVector(indices=unique_ids, values=[1.0] * len(unique_ids))
```

<v-clicks depth="2">

- That is the whole query encoder. One tokenizer call, then a sparse dot product

- The model runs **only on documents**. 

- The SPLADE model is trained to have no query side model

- Weights do not have to be 1.0
  - `naver` sends every query term at exactly **1.0**
  - `os` ships `idf.json`, so `the` gets **0.135** and `cardiac` **6.533** (still zero model calls)

</v-clicks>

<!--
Two slides before this one said the same thing twice: a prose description of
the code, then the code. This is the merge. Let the function speak, it is four
lines.

Worth pausing on: this really is the entire query side. Tokenize, dedupe, set
every weight to 1.0. If someone asks how that can possibly work, the answer is
the next slide -- the document encoder was trained knowing this is all it would
ever get.

The third bullet is the one that defuses the obvious worry, and it is a
callback rather than a new claim: everything clever you saw with "mouse"
happened on the document, at index time, where the model still runs.

Last bullet pre-empts "surely you would at least use idf?". OS does exactly
that and ships the table. But I tested every way of adding weights to naver's
uniform model, holding its document vectors fixed so only the query weighting
changed, and all of them lost:

  uniform 1.0                              60.04
  idf computed from the corpus itself      59.04   -1.01
  OS's shipped idf.json, grafted on        58.83   -1.21
  two-round idf over the returned top-100  52.52   -7.53

splade-v3-doc was trained expecting exactly 1.0, so its document weights are
calibrated to that. Reweighting the query afterwards hands the document encoder
a distribution it never saw in training.
-->

---

## Does it actually hold up?

<iframe :src="chart('quality-latency')" class="w-full border-0" style="height: 356px"
        title="Quality against query latency" />

<div class="text-sm opacity-80 -mt-2">

5,183 docs, 300 queries. **PP** is [Splade_PP_en_v1](https://huggingface.co/prithivida/Splade_PP_en_v1), a *symmetric* model, and **PP-sym** is that same model forced inference-free. **GTE** is [OS doc-v3-gte](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte).

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Let them read it before you talk. Then:

Dropping query-side inference costs 0.93 NDCG@10, 1.3% relative, and saves
53ms. Same model family, naver/splade-v3 against naver/splade-v3-doc, which is
the cleanest apples-to-apples measure available.

Nothing sits above and to the left of SPLADE-IF, because at 4.3ms the only
thing left on the query path is the sparse dot product itself.

PP is prithivida/Splade_PP_en_v1, an independent reproduction of SPLADE++, and
it is SYMMETRIC: one encoder for both sides. So "PP" is that model used as
designed and "PP-sym" is the same model forced to take raw tokens on the query.
It is the control for "can I just switch inference-free on?".

The one that surprised me: PP-sym in IF mode lands at 68.59 against BM25's
68.30. On 300 queries I call that a tie, not a win. Say so before someone
squints at the chart.
-->

---

## SPLADE vs BM25

End to end: encode **and** search, timed together. BEIR scifact, 5,183 docs, the 300 real queries run twice.

| | NDCG@10 | p50 | p90 | p99 | worst |
| --- | ---: | ---: | ---: | ---: | ---: |
| SPLADE-Full (naver) | 71.61 | 57.5ms | 113.0ms | **299.9ms** | 564ms |
| **SPLADE-IF (naver)** | **70.68** | **7.5ms** | 10.6ms | **16.0ms** | 21ms |
| SPLADE-IF (OS) | 70.21 | 5.6ms | 7.8ms | 11.8ms | 16ms |
| BM25 | 68.30 | 2.5ms | 3.3ms | 5.0ms | 6ms |

<v-clicks depth="2">

- Inference-free lands **near BM25's speed** and keeps SPLADE's quality: 
    - 7.5ms against 2.5ms, 70.68 against 68.30

- Full SPLADE is **8x slower at the median and 19x at p99**, for 0.93 more NDCG@10

</v-clicks>

<!--
Everything in this table is one run, one machine, one protocol, so the rows are
comparable to each other. Full BEIR scifact, not NanoBEIR: 5,183 documents and
the real 300-query test set, each query timed twice for 600 samples. The 13-
dataset NanoBEIR numbers later in the deck are a different harness and the
latencies are not comparable to these. Engine is Qdrant with float sparse scoring, but do
not put that on the slide -- you work there and it reads as a plug. Say it only
if someone asks what you measured on. That matters more than any single value.

The headline is the second column against the fourth. At the median full SPLADE
is 7.7x slower. At the 99th percentile it is 18.7x. The advantage GROWS as you
move into the tail, which is the opposite of what people assume, and the tail is
where your SLO lives.

Why: full SPLADE's p99 is 5.2x its own median, 57.5 to 299.9ms, because a BERT
forward on a shared CPU competes with everything else on the box. Inference-free
has nothing to compete with, so its p99 is only 2.1x its median.

Two honest caveats and I would give both.

First, this is a developer laptop with other work running, so the tail is worse
than a dedicated box would show. I would argue that is realistic, a production
server is also shared, but it is not a clean-room number.

Second, the full-SPLADE row is a u8-quantized collection because the float one
no longer exists. Quantization affects search, which is 5ms of that 57.5ms, so
it cannot explain a 300ms p99. The encoder can.

If someone asks why these differ from the blog: same p50 for full SPLADE, 57.5
against the published 57.2, which is the check that the setup matches. The IF
row is higher here, 7.5 against 4.3, because my encode goes through the full
sentence-transformers path and the published one did not.
-->

---

## Latency breakdown

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

Measured search-side p99s, since the chart only shows medians: full SPLADE
14.1ms, IF 6.1ms, BM25 5.0ms. Search has a tail too, it is just a small one.

IF's 0.3ms is a tokenizer call, not a model. BM25's 0.1ms is the same kind of
work, which is exactly why those two bars look alike.

So "inference-free" removes a model relative to full SPLADE. Relative to BM25 it
removes nothing, both are a sparse dot product.
-->

---

## Why does it work at all?

Average non-zero terms per document, BEIR scifact:

| model | training | doc non-zeros |
| --- | --- | ---: |
| [`naver/splade-v3-doc`](https://huggingface.co/naver/splade-v3-doc) | asymmetric, **inference-free** | **325** |
| [`naver/splade-v3`](https://huggingface.co/naver/splade-v3) | asymmetric, full | 286 |
| [`OS doc-v3-gte`](https://huggingface.co/opensearch-project/opensearch-neural-sparse-encoding-doc-v3-gte) | asymmetric, inference-free | 244 |
| [`Splade_PP_en_v1`](https://huggingface.co/prithivida/Splade_PP_en_v1) | symmetric | 205 |

<v-clicks>

- The inference-free model builds the **densest index of the four**

- It is trained knowing every query term arrives at **1.0**, so the document side has to carry the ranking alone

- It expands in **breadth**, not weight: per term full SPLADE is actually *higher*

</v-clicks>

<!--
This is the mechanism slide and the table is the evidence. The inference-free
model has the densest documents of anything measured, 325 against full SPLADE's
286, and that is not a defect. It is where the work went.

The asymmetric ones are all denser than the symmetric one at 205, and the
inference-free asymmetric one is densest of all. The model was trained knowing
the query would arrive as raw tokens at weight 1.0, so there is nobody else to
do the ranking. It front-loads everything into the index.

Third bullet is the precision point, because "over-expands" invites the wrong
reading. It does not shout louder on any given term. On a document where both
models place "car", full SPLADE gives it 1.704 and inference-free 1.236. What
grows is how MANY terms are there.

The trade in one line: you pay for it at index time and in index size, and you
get it back on every query forever.
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

## Your engine matters, and it matters most here

Same models, same corpus. Qdrant scores exact float32; the pyserini impact index rounds weights to integers.

| NDCG@10 | Qdrant | Lucene | cost |
| --- | ---: | ---: | ---: |
| SPLADE-Full (naver) | 71.61 | 71.56 | **-0.05** |
| **SPLADE-IF (naver)** | **70.68** | **69.53** | **-1.15** |
| BM25 | 68.30 | 67.89 | -0.41 |

<v-clicks>

- Careful: **Lucene `FeatureField`** and **ES `sparse_vector`** keep **9 significant bits** (~0.4% error), *not* integers. Only pyserini’s impact index rounds to whole numbers

- Both IF models pay **1.15 to 1.35**. Full SPLADE pays **0.05**. Roughly **27x** more

- Probably because inference-free puts **all** the ranking signal in the doc weights. The query is uniform 1.0

- Not free either way: integer search is **faster** for IF (4.0 &rarr; 3.0ms), **slower** for BM25 (3.8 &rarr; 5.5ms)

</v-clicks>

<!--
Most practically useful slide in the deck for anyone already running
Elasticsearch or OpenSearch.

Get the precision claim right, it is easy to overstate and someone will know.
Verified from primary sources:
  - Lucene FeatureField: "only considers the top 9 significant bits ... stored
    on 16 bits internally", relative precision 2^-8 = 0.39%
  - Elasticsearch sparse_vector: same mechanism, "about 0.4%" relative error
  - pyserini/Anserini impact index: genuinely integers, the fake-documents
    trick, and THAT is what the Lucene column here measured
Right sentence: "pyserini rounds to integers, Lucene and ES keep 9-bit floats,
none of them is exact float32". An earlier version of this slide said "they
store integers" and that was wrong.

It also generates a prediction I have NOT tested: ES should lose much less than
the 1.15 here, because a 9-bit grid is far finer than integers. Say prediction,
not result.

And I could not measure Qdrant's own uint8 sparse setting: querying the f32 and
uint8 collections returns bit-identical scores to four decimals, so that
comparison tests nothing.

The column that matters is the last one. Full SPLADE loses 0.05 to integer
quantization, which is nothing. Inference-free loses 1.15 to 1.55. Same
quantization, same corpus, twenty-seven times the damage.

The explanation in the third bullet is mine and it is a hypothesis, not a
measurement, so say it that way. Full SPLADE has weighted terms on BOTH sides,
so even after you round the document weights the query weights still sort the
results. Inference-free sends every query term at exactly 1.0, so the document
weights are the only thing doing any ranking, and rounding them is rounding
everything. If someone wants it tested, the experiment is one line: quantize D
and rescore.

Practical upshot to say plainly. If you are on Elasticsearch or OpenSearch,
budget about a point and a half for inference-free that you would not pay for
full SPLADE. It is still ahead of BM25 there, 69.53 against 67.89, just by less
than the Qdrant numbers promise.

And the last bullet keeps it honest in the other direction: the integer
arithmetic genuinely is faster for the sparse vectors, 4.0ms down to 3.0ms.
You are buying speed with precision, which is a real trade, not a bug.
-->

---

## Inference-free beats BM25 on 10 of 13

<iframe :src="chart('spread')" class="w-full border-0" style="height: 398px"
        title="Inference-free against BM25 and against full SPLADE" />

<div class="text-sm opacity-80 -mt-1">

Toggle the view. Inference-free beats BM25 by **+5.26** mean, full SPLADE by **+8.59** — same datasets win and lose in both.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Start on the "vs BM25" view and leave it there for a beat, because this is the
question the room actually has: should I run this instead of what I already
ship? Ten of thirteen say yes, and the wins are not marginal -- nq +25.05,
msmarco +18.58, fiqa +14.74.

Then the honest part. Three losses: touche2020 -14.44, climatefever -6.55,
scidocs -3.07. But full SPLADE ALSO loses touche2020 and climatefever, so only
scidocs is a cost of going inference-free. Everything else is a SPLADE problem,
not an inference-free one.

Now flip the toggle. Same datasets, same order, now measured against full
SPLADE. Every bar goes negative except hotpotqa, and the average cost is 3.33.

Two things to say while it is on screen. First, one dataset is one data point:
the penalty runs from -8.24 on arguana to +1.54 on hotpotqa, so a single number
quoted from a single corpus tells you very little. Second, resist the tidy
story. I checked whether inference-free is cheapest where SPLADE's margin is
biggest, and the correlation is only +0.28. ArguAna breaks it outright: an
+8.85 margin over BM25 and the largest inference-free cost on the panel.

NanoBEIR is ~50 queries and a few thousand documents per dataset, scored
brute-force. Do not compare these bars to the scifact numbers earlier in the
deck, which came through Qdrant on the full corpus.
-->

---

## The two ends of that chart

| | full | IF | delta | mean query length |
| --- | ---: | ---: | ---: | ---: |
| **arguana** | 48.91 | 40.67 | **-8.24** | **193 words** |
| hotpotqa | 82.81 | 84.35 | **+1.54** | 15 words |

<v-clicks>

- A 193-word query with every term at weight 1.0 has no way to say which words matter. A 15-word one barely needs to

- Consistent with the fix: learned weights help **arguana most of all**, +7.41

- BM25 is also not beaten everywhere. It wins **touche2020** (72.35 vs full SPLADE's 61.29) and **climatefever** (31.26 vs 31.04)

- Both are stance tasks: a relevant document may *support or refute* the claim, not just share its topic. Expansion finds topically-near documents, which is the wrong target

</v-clicks>

<!--
The query-length row is the one to point at. ArguAna queries average 193 words,
measured on NanoArguAna, against 15 for HotpotQA. Those are the two ends of the
chart and also the two ends of the length range, and the direction is what you
would expect if unweighted terms are the problem.

Do not oversell it as causal from two points. The support is that learned query
weights, which is exactly the fix for "too many equally-loud terms", help
ArguAna more than any other dataset: +7.41.

Then touche2020. SPLADE loses by 0.11, a big loss, and it loses the same way on
climatefever. Both are stance tasks. Touche queries are SHORT, 6.6 words on
average, so this is not a length effect, it is a task effect.

If someone asks "so when is BM25 still the right call": this slide is the
answer, plus anything where you cannot afford a GPU at index time.
-->

---

## Four things to get right

<v-clicks>

- **Pick an asymmetric model.** One trained for raw-token queries. Forcing the symmetric [`Splade_PP_en_v1`](https://huggingface.co/prithivida/Splade_PP_en_v1) into IF mode costs **2.1 NDCG@10** and only ties BM25

- **Re-encode when your vocabulary moves.** New drug names, new products, breaking news: the doc encoder guesses the expansion ahead of time, so a fresh word needs a fresh pass

- **Measure on your own data.** The margin over BM25 runs **+25.59** (nq) to **-11.06** (touche2020), and quora &mdash; where queries and docs already share words &mdash; still gives **+12.75**. "They already match" does not predict it

- **Budget one GPU at index time.** That is the whole bill. After it, every query is free

</v-clicks>

<!--
Frame this as the setup checklist, not a list of caveats. Same four facts a
practitioner needs, but they walk out with something to do rather than a reason
not to. The quora number is the one to dwell on: the obvious intuition about
when SPLADE helps is simply wrong, so run it yourself.
-->

---

## Key takeaways

<v-clicks>

- **Inference-free SPLADE nearly matches full SPLADE.** 0.93 NDCG@10 (1.3%) for a **7.7x** median latency cut, 57.5ms to 7.5ms &mdash; and **18.7x** at p99

- **The saving is one component.** The query encoder, 50ms of it. Search time does not change

- **Use an asymmetric model**, trained for raw-token queries. Forcing a symmetric one into IF mode only ties BM25

- **The cost is index time, and only index time.** 83 docs/sec on an A10G, then queries are free forever

</v-clicks>

<div class="mt-6 text-sm opacity-70">

Full write-up and the Lucene/pyserini numbers: [kshivendu.dev/blog/if-splade](https://kshivendu.dev/blog/if-splade)

</div>

---

## Bonus: which lever is doing the work?

Strip expansion to literal terms only, so every row scores the **same term set** as BM25.

| | nDCG@10 | gain |
| --- | ---: | ---: |
| BM25 | 53.63 | |
| SPLADE weights, no expansion anywhere | **57.93** | **+4.30** |
| &nbsp;&nbsp;+ document expansion | 60.65 | +2.72 |
| &nbsp;&nbsp;+ query expansion as well | 63.37 | +0.88 |

<v-clicks>

- Same terms as BM25, only the weights differ: **+4.30**. The weighting lever is real on its own

- **Document** expansion is worth **3x** query expansion, +2.72 against +0.88

- That ratio is the whole argument: inference-free drops the **cheap** half

</v-clicks>

<!--
This is the slide that turns "expansion buys recall, weights buy precision"
from a framing into a measurement, and it is the best justification for
inference-free in the deck.

The trick is the masking. Every vector is cut down to terms the raw text
actually contains, so the second row and BM25 score over an identical term set:
the intersection of the query's literal wordpieces and the document's. Same
sum, same index, different numbers in the slots. So +4.30 is purely whose
weighting is better, with expansion removed from the picture.

Then add the levers back one at a time. Document expansion +2.72. Query
expansion, on top of that, +0.88. Three to one.

Land the last bullet slowly. Inference-free throws away query-side expansion,
which is the 0.88, and keeps document-side, which is the 2.72. It is not a
compromise between the two, it is dropping the cheaper one. That is why the
measured penalty is small, and why it is small for a reason rather than by luck.

Numbers do not add exactly, 57.93 + 2.72 + 0.88 is 61.53 rather than 63.37.
The missing 1.84 is interaction: the two expansions help each other, since an
expanded query has more chances to hit an expanded document. Say so if anyone
adds it up.

One more thing in the data if it comes up: masking the document to literal
terms drops it to 67 non-zeros, below BM25's 99. The full model carries 232.
Measured by research/if-splade/modal_literal_only.py.
-->

