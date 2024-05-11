---
theme: gaia
_class: lead
style: |
  :root {
    --color-background: #fff !important;
    --color-foreground: #182b3a !important;
    --color-highlight: #bc1439 !important;
    --color-dimmed: #888 !important;
    border-top: 4px solid var(--color-highlight);
  }

marp: true
inlineSVG: true
# paginate: true
---

<!-- ![bg](./imgs/cover-foss-united-jan-2024.png) -->
![bg](./imgs/intro-bg.png)


---

## $ whoami

![bg right:40% 80%](./imgs/shivendu.jpg)

* Kumar Shivendu

* Software Engineer @ Qdrant

* I ❤️ information retrieval, performance, and data mining.

* First talk!

* Qdrant: Future of search and beyond

<!-- ---

## Topics to cover

* Evolution of search
  * Traditional approaches and drawbacks
  * Vectors search and how it harnesses ML models

* Qdrant
  * Building HNSW index and vector search
  * Beyond similarity search:
    * Recommendations
    * Discovery
  * Sparse vectors -->

---

## Traditional ways to build search

* Approaches:
  * Keyword match, Regex, Boolean operators
  * Extracting metadata using NLP and CV
  * Knowledge graphs, Vocabs

* Challenges:
  * Extra work required to maintain the knowledge
  * Growing amount of unstructured data everywhere
  * Multimodal search remains hard: Text, Image, Audio, Video

---

## Vectors

* Points in an N-dimensional space
* Anything -> Vector
* Generated from:
  * ML models
  * Metric learning
* CLIP

<!-- Replace search space image -->
![bg vertical right:50% 90%](./imgs/search-space.png)
![bg right:50% 90%](./imgs/clip-model.png)


---

## Vector search


![bg right:50% 50%](./imgs/lens-reverse-image.png)

* Nearest points
* Example: Google Lens
* But this is expensive and not easy to scale
* Solution: Indexing and approximation

<!-- Image showing vector search -->

<!-- FIX this image. The arrows are broken -->


---

## What is **Qdrant**

![bg right:40% 50%](./imgs/logo.png)

* Vector Search Engine (aka Vector DB)

* 15k+ stars on Github

* Written in Rust 🦀

* SDKs for Python, JS, Go, Java, etc

* Twitter, Canva, Meesho, Flipkart

---

## The HNSW Index

![bg right:50% 100%](./imgs/hnsw-layers.png)

* Skip Lists + Graphs
* Approximate and Tunable
* Filter during search
* Quantization

---

## Running search:

```js
POST /collections/rentals/points/search
{
  "query": [0.2, 0.3, 0.4, 0.5], // vector generated from image/text/video
  "filter": { "must": [{"key": "locality", "match": {"value": "Indiranagar"}}] },
  "limit": 10
}
```

* ```js
  [
    {"id": 4, "score": 0.56, "payload": {...}},
    {"id": 2, "score": 0.40, "payload": {...}},
    {"id": 5, "score": 0.23, "payload": {...}},
  ]
  ```

---

## Beyond search: Recommendations

* Realtime addition of points is possible.
* `average_vector` and `best_score`
* ```js
  POST /collections/rentals/points/recommend
  {
    "positive": [100, 231], // vector ids
    "negative": [718, [0.2, 0.3, 0.4, 0.5]], // vector id and vector
    "filter": { "must": [{"key": "locality", "match": {"value": "Indiranagar"}}] },
    "strategy": "best_score",
  }
  ```
* DailyMotion (Qdrant), Spotify (Annoy)

---
## How to find this thing on the internet?

![bg right:35%](./imgs/anti-pattern-3.jpg)

* No reverse image search
* No known name

---
## Strategy One

* Describe the thing
  * "Combination of human, dragon and chicken"
  * "Mythology creature of human and dragon"

![bg right:50%](./imgs/dragon-search.png)

---
## Strategy Two

* Search for similar images
  * Similarity bubble

![bg right:60%](./imgs/reverse-image-search-1.png)
![bg](./imgs/reverse-image-search-2.png)

---

## Beyond search: Discovery API

* Unique iterative search by Qdrant
* Combine multi-modal vectors in single query

* ```js
  POST collections/my-collection/points/discover
  {
    "target": [0.63, 0.10, 0.91, 0.55],
    "context": [
      {
        "positive": 7125, // <-- ID of the example
        "negative": 122   // <-- This can also be a vector
      }
    ],
  }
  ```

---
<!-- ---

## How discovery uses that?

##### Remember Metric Learning?


![bg 80%](./imgs/triplet-loss.png)

---
-->


<!-- ![bg 95%](./imgs/discovery-context.png)

![bg 90%](./imgs/context-pairs.png)

![bg 90%](./imgs/context-with-target.png)

--- -->

<!--
## How multi-modal embeddings look like?


![bg 90%](./imgs/cross-modal-space.png)



---

![bg](./imgs/clip-discovery.png)


---


![bg](./imgs/complex-context-search.png)

--- -->

<!-- ## Sparse vectors

* VS text search
* BM25 & TF-IDF
* Transformer's attention weights
* SPLADE

![bg right:60% 90%](./imgs/sparse-vectors.png)

--- -->

# Summary

* Anything => vector

* Vectors >> similarity search

* Thousands of use-cases with Qdrant

<!-- * Navigating search (read vector) space is powerful! -->

* Find me at
  * kshivendu.dev/bio
  * kshivendu.dev/twitter

![bg right:50% 50%](./imgs/linkedin-qr.png)

<!-- * Thank you! -->

