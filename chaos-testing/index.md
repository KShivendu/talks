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
  pre {
    white-space: pre-wrap;
  }
marp: true
inlineSVG: true
# paginate: true
---

![bg](imgs/hero.png)

---

## $ whoami

![bg right:40% 80%](../static/shivendu.jpg)

* Kumar Shivendu

* Engineer @ Qdrant

* I ❤️ search, distributed systems, and LLMs.

* Chaos testing: Breaking a database on purpose

<!-- * RAG = Retreival Augment Generation -->
---

## Topics to cover

* Intro to vectors and vector search
* Overview of Qdrant
* Why we needed chaos testing?
* Different components of chaos testing
* Results

---

## Vectors

* Points in an N-dim space
* Compressed **meaning**
* Anything -> Vector
* Popular ways to generate:
  * Language/vision models
  * Metric learning
    * CLIP

![bg right:50% 90%](../static/clip-model.png)

---

## Vector search

![bg right:40% 50%](../static/lens-reverse-image.png)

* Things, not strings
* Keyword search
  * Doc miss (low recall)
  * Can't do img, audio, etc
* Nearest points
* Indexing and approximation
* Problem: Hard to scale and manage.

<!-- Image showing vector search -->
---

## What is **Qdrant**

![bg right:40% 50%](../static/qdrant.png)

* Open Source Vector Search Engine (aka Vector DB)

* 21k+ stars on Github

* Written in Rust 🦀

* SDKs for Python, JS, Go, Java, etc

* X.com, Perplexity, Meesho, Flipkart

---

## Indexing:

```js
PUT /collections/rentals/points
{
  "batch": {
    "ids": [1, 2],
    "vectors": [
      [0.9, -0.5, ..., 0.0], // generated from rental1.jpg using ML model
      [0.1, 0.4, ..., 0.3],
    ],
    "payload": [
      {"city": "Bangalore", "sqft": 990, "img_url": "example.com/rental1.jpg", "tags": ["..."]},
      {"city": "Hyderabad", "sqft": 1550, "img_url": "example.com/rental2.jpg", "description": "..."},
    ]
  }
}
```

---

## Search:

```js
POST /collections/rentals/points/search
{
  "query": [0.2, 0.3, ..., 0.4], // generated from user query (text) using same model
  "filter": { "must": [{"key": "city", "match": {"value": "Bangalore"}}] },
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

### Workflow

![bg 65%](imgs/vector-db-architecture.png)

---


### Data persistence

![bg 65%](imgs/segments.png)

----

### Cluster mode

![bg 65%](imgs/sharding-raft.png)

<!-- ToDo: We need a better diagram of raft -->

<!-- ---
### What kind of tests we run already?

- Unit tests
- Integration tests
- Misc.
    - Storage compatibility
    - API
    -
- Crasher
- Most of these tests run on linux, mac, and windows -->

---

### Why chaos testing?

* Moving parts of a distributed system:
    * Consensus, segments,  sharding, storage, WAL, HNSW index, etc.
    * When deployed: k8s, operator, disk, backward compatibility, etc.
* **Anything** can fail. We must prepare for the worse
* Catch/fix bugs before users.
* Impossible to write tests for every possible scenario
* 💡 Test Qdrant in some of the worst possible scenarios

---

### Why existing solutions weren't enough

* Most solutions felt limited for a DB use case while being bloated
* Needed custom cluster setup, checks, and more.
* Simplicity >>>
* Already built tools like `bfb` in-house

---

### Qdrant cluster ☁️

* Cloud-like env using k8s.
* Build and deploy container for every merge to `dev`
* Operator -> Cluster Manager -> Qdrant cluster
* Qdrant cluster: 3-5 nodes each with 0.5CPU, 2GB RAM
* Qdrant k8s operator + Cluster manager (CM)
    * Scale, Replicate, Re-shard, and Balance shards.
    * Only CM knows about Qdrant internals
        * consensus, sharding, indexing, etc

---

### Load generator 🔨

* Custom tool: `bfb`
* **Constantly** hammering the cluster
* Runs in both modes:
    * Upserts: Overrides same 200K points at 100 points / sec
    * Search: ~11 QPS / sec (1M / day)
* Example:
  ```c
  bfb -n 1000000000 --dim 300 --search --retry 3 --retry-interval 1 --delay 1000 --timeout 30
  ```

---

### Chaos crons 🌪️

* Bring chaos:
    * Kill:
        * every 5 mins; triggers shard recovery
    * Scale up/down:
        * adds/removes nodes; triggers shard movement
    * Snapshot:
        * import/export data in bulk; Slows down the nodes
    * Resharding:
        * splits/merges shards; Migration of data

---

### Healthcheck crons 🩺

* Check for degradations:
    * Points are present
    * Vectors and payloads are consistent between replicas
    * Nodes and shards are healthy, readable, and writable
* All this happens in presence of rolling updates, snapshots, resharding, node restarts, and horizontal scaling
* Persist results to Postgres and logs to Loki

---

### Testing eventual consistency 🔄

* 3 (shards) * 2 (replication) = 6 replicas on 3-5 nodes
* 2 (Replication) * 200K points (~1.2GB) compared within 2.4s
* BFB upload overrides 100 points every second
* Retry only previously inconsistent points (10 attempts max)
<!-- (2.4s is warm on cloud. Local is ~10x faster, 0.7s for cold, 0.2s for warm) -->

---

### Monitoring 📊

* Integrate data from Loki, Prometheus, Postgres, etc
* Monitor uptime, data consistency checks, system resources, etc.

![bg right:55% 95%](./imgs/chaos-testing.png)

---

### Results 🚀

* Fixed 30+ hard-to-reproduce / critical bugs since we started (10 Feb 2024)
* Chaos testing is technically the "production" for the core team.
* What doesn't kill you, makes you stronger!
<!-- * If Qdrant thrives here, it's very much ready for the real world! -->

---


### Summary

* Complex systems can have some critical bugs that are reproduced when multiple conditions meet.
* It's impossible to test every possible scenario by writing tests for each combination.
* Chaos engineering is about embracing randomness and proactively simulating failures to avoid issues in prod.

* Find me at
  * [kshivendu.dev/twitter](kshivendu.dev/twitter)

![bg right:22% 80%](../static/linkedin-qr.png)
