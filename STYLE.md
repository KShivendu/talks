# Talk Style Guide — KShivendu

Derived from 9 decks in this repo: `qdrant` (Jan 2024), `reranking-fusion` (May 2024),
`chaos-testing` (Feb 2025), `structured-logging` / `time-travel-debugging` (Jul 2025),
`smoldb` (Jul 2025), `django-vector-search` (Nov 2025), `qdrant-db-internals` (Nov 2025),
`tiered-multitenancy` (Dec 2025).

Use this when generating a new deck. The patterns below are observed, not invented —
each one cites the slides it comes from.

Two caveats since this was written. The Marp boilerplate below is still correct for the
Marp decks, but `token-storage` is built with Slidev (`_deck/`) so it can carry live
React charts from the blog; the visual language is ported, the mechanics are not.
And for anything with measured numbers on it, read `STYLE-v3.md` — this file and v2 are
about how a slide reads, v3 is about whether it's true.

---

## 1. Mechanics

**Format:** Marp, `theme: gaia`, `_class: lead`. Build with `marp --server --html .`
(the `--html` flag matters for `<iframe>`/`<img>` tags). One deck = one `index.md` +
one `imgs/` dir. Shared assets live in `../static/`.

**The frontmatter block is copy-paste stable across every deck.** Reuse verbatim:

```yaml
---
theme: gaia
_class: lead
style: |
  :root {
    --color-background: #fff !important;
    --color-foreground: #182b3a !important;
    --color-highlight: #dc244C !important;   /* Qdrant red; older decks use #bc1439 */
    --color-dimmed: #888 !important;
    border-top: 4px solid var(--color-highlight);
  }
  code:not([class^="language-"]) {
      background-color: #282c34 !important;
      color: #abb2bf !important;
      padding: 2px 4px;
      border-radius: 3px;
  }
  pre {
    white-space: pre-wrap;
  }
  /* Previous fragments - make them grey/dimmed */
  li[data-bespoke-marp-fragment="active"]:not([data-bespoke-marp-current-fragment="current"]) {
    color: #182b3a8f;
  }
  li[data-bespoke-marp-current-fragment="current"] {
    color: #182b3a;
  }
marp: true
inlineSVG: true
# paginate: true
---
```

Notes on this block:
- `pre { white-space: pre-wrap }` — code **wraps, never scrolls**. If a snippet needs
  horizontal scroll, the snippet is too long. Shorten it.
- `paginate` is always present and always commented out. Slide numbers never ship.
- The fragment-dimming CSS appears only in the newer decks (`qdrant-db-internals`,
  `tiered-multitenancy`). Include it — it's the current default.
- Newer decks add SEO frontmatter (`title`, `description`, `keywords`, `image`).
  Include when the deck will be published to `kshivendu.dev/talks`.

**Heading levels:** `##` for foundational/reused slides (`## Vectors`, `## What is **Qdrant**`),
`###` for talk-specific slides. Code slides end their title in a colon:
`## Indexing:`, `## Search:`, `### Ingesting:`, `### Querying:`.

**Bullets:** `*` only. Two-space indent. **Max 2 levels deep.** 4–7 bullets per slide.

**Slide budget:** ~1 slide/minute, slightly faster on code slides.

| Format | Observed count |
|---|---|
| Meetup / office hours (20–25 min) | 22–24 (`chaos-testing`, `tiered-multitenancy`) |
| Conference (30–40 min) | 16 slidev / ~28 marp (`django-vector-search`) |
| Guest lecture (45–60 min) | 31 (`qdrant-db-internals`) |
| Focused single-topic (15 min) | 14 (`time-travel-debugging`) |

---

## 2. The fixed skeleton

Every shipped deck has these, in this order:

```
1.  ![bg](imgs/hero.png)                    <- bare full-bleed image, no text on the slide
2.  ## $ whoami                             <- photo on bg right:40%
3.  ## Topics to cover   (or ## Agenda)
    ... body ...
n-2. ### Limitations                        <- when the talk ships a technique
n-1. ### Summary  + "Find me at" + QR
n.   ### References                         <- newer decks only
```

**Slide 1** is always `![bg](imgs/hero.png)` and nothing else. The hero carries the title.

**Slide 2** — `## $ whoami`, and the last bullet is *always the talk title*:

```markdown
## $ whoami

![bg right:40% 80%](../static/shivendu.jpg)

* Kumar Shivendu

* Engineer @ Qdrant

* I ❤️ search, databases, and distributed systems.

* Qdrant: Tiered Multitenancy
```

The `I ❤️ ...` line is re-tuned per talk to foreshadow the topic
(`search, distributed systems, and LLMs` for chaos-testing;
`information retrieval, performance, and building tools` for reranking-fusion).

**Slide 3** — `## Topics to cover`, 5–7 items that **map 1:1 to real slides in order**.
No aspirational agenda items.

**Closing slide** — the summary bullets are *claims*, not a recap of headings:

```markdown
### Summary

* Tiered multitenancy solves for uneven size, traffic, and priority of tenants
* Two-tier architecture: Fallback + dedicated shards
* Seamless promotion without read/write downtime

* Find me at
  * [kshivendu.dev/twitter](kshivendu.dev/twitter)

![bg right:20% 80%](../static/linkedin-qr.png)
```

---

## 3. Layout vocabulary

Split layouts do all the visual work. Ratios are consistent:

| Directive | Used for |
|---|---|
| `![bg right:40% 80%](../static/shivendu.jpg)` | portrait, product logo |
| `![bg right:50% 90%](diagram.png)` | architecture / concept diagram beside bullets |
| `![bg right:55% 95%](screenshot.png)` | dashboards, dense screenshots |
| `![bg 50%](imgs/demo-time.gif)` | full-slide beat (demo transition, meme) |
| `![bg 65%](imgs/architecture.png)` | diagram-only slide, no text |
| `![bg right:20% 80%](../static/linkedin-qr.png)` | QR on the summary slide |

Rule of thumb: **text left, image right.** A diagram that needs the whole slide gets
its own text-free slide with `![bg 65%]`.

---

## 4. What you consistently do

**Earn the solution — never lead with it.**
This is the single strongest pattern. Every deck climbs a ladder of increasingly less-bad
approaches, and each rung is dismissed by a named weakness:

- `django-vector-search`: substring match → GIN index → Elasticsearch → vectors.
  Each of the first three ends in an explicit `* Cons:` list.
- `tiered-multitenancy`: anti-pattern (collection per tenant) → payload partitioning →
  "Works well, but..." → the Pareto problem → tiered multitenancy.
- `chaos-testing`: existing chaos tools → "Why existing solutions weren't enough" → custom.

The transition device is literally `* Cons:` or a slide titled `### Works well, but...`.
The audience should feel the pain before seeing the fix.

**Alternate concept slide → code slide.**
A prose slide states the idea; the very next slide is a real snippet. `tiered-multitenancy`
does this five times in a row (Create collection → Default shards → Dedicated shards →
routing → promotion).

**Code is real, runnable, and teaches through comments.**

```python
client.create_shard_key(
    collection_name="{collection_name}",
    shard_key="user_3",
    initial_state=ReplicaState.Partial, # IMPORTANT to keep it inactive before promotion
)
```

```py
# In simple terms, GIN = A map of term/token -> list of document IDs
# {"toy": [p1, p2], "soft": [p1]}
indexes = [GinIndex(fields=["name"])]
```

Inline `# IMPORTANT` / `# SAME` comments carry the point. Never pseudocode.
Real param names, real API shapes.

**Reuse the foundation library.**
`## Vectors`, `## Vector search`, `## What is **Qdrant**`, `## Indexing:`, `## Search:`
are near-identical across five decks, pulling the same `../static/` images
(`clip-model.png`, `lens-reverse-image.png`, `qdrant.png`, `hnsw-layers.png`).
Deliberate. Copy them, update the GitHub star count and customer names, move on.

**Include one meme or GIF — exactly one, at the emotional beat.**
`drake-no.jpg` on the anti-pattern slide. `demo-time.gif` at the demo transition.
`dog-muffin.webp` on hard negatives. The giphy on "eventually you get more customers."
Never decorative, always punctuating a turn in the argument.

**Numbers are concrete, unitful, and checkable.**
"1000 collections per cluster", "~20K points", "40+ hard-to-reproduce bugs since 10 Feb 2024",
"3 (shards) * 2 (replication) = 6 replicas", "2.4s", "100 points / sec", "~11 QPS (1M / day)".
No "significantly faster", no "massive scale."

**Bold exactly the one word that matters.**
`Compressed **meaning**`, `**multiple tenants**`, `**Anything** can fail`,
`tenant sizes vary **dramatically**`, `sharding_method=**custom**`.
Roughly one bold per slide, never a bolded phrase.

**Ship a Limitations slide, honestly.**
`tiered-multitenancy` lists four real constraints, three annotated
"Will be improved soon in future releases." `django-vector-search` admits vector search
can't match `TOY_XYZ123`. You do not oversell.

**Keep cut material as HTML comments.**
`<!-- FIXME: Should ideally use/create image that exactly shows ColBERT -->`,
`<!-- ToDo: We need a better diagram of raft -->`, whole commented-out slide blocks.
Speaker notes and future work live in the file, not in a separate doc.

**End on a claim, not a courtesy.**
The last content slide is Summary + contact. There is no "Thank you" slide.

**Emoji: only as a section motif, only when the topic is operational.**
`chaos-testing` uses one trailing emoji per heading (`☁️ 🔨 🌪️ 🩺 📊 🚀`) as a consistent
device across its operational slides. No other deck uses them. Never mid-sentence,
never on the skeleton slides.

---

## 5. What you avoid

- **No "Thank you" / "Q&A" / "Any questions?" slide.**
- **No hype framing.** No "The X Revolution", "Market Reality Check", "Future Trends",
  "Why X changes everything."
- **No business-case slides** — market size, TAM, adoption curves. Zero appearances.
- **No prose paragraphs.** No slide in any shipped deck is a block of text.
- **No stock photography.** Images are diagrams, screenshots, product logos, or memes.
- **No pseudocode or `...` placeholder APIs.** If a snippet is shown, it runs.
- **No unattributed numbers.** Every figure names its source or setup.
- **No bullets deeper than 2 levels.**
- **No slide numbers, no transitions, no animations** beyond marp's fragment dimming.
- **No re-teaching what the room knows.** The foundation slides get cut for expert
  audiences and expanded for students — `qdrant-db-internals` (IIT lecture) has a full
  vectors primer; `tiered-multitenancy` (Qdrant office hours) opens straight on
  "What is multitenancy?" with no vector primer at all.

**Repo counter-example:** `rag-on-edge/index.md` is untracked and violates nearly all of
the above — 40 slides, an emoji on every single heading, "📈 Market Reality Check",
"🔮 Future Trends", "🙋 Q&A", four consecutive "Step by Step" slides, and use-case slides
with no code. It reads as machine-generated and is not in your voice. Treat it as the
negative example, not a template.

---

## 6. Generation checklist

When producing a new deck:

- [ ] Copy the frontmatter block from §1 verbatim; set SEO fields if publishing
- [ ] `imgs/hero.png` exists; slide 1 is `![bg](imgs/hero.png)` and nothing else
- [ ] `$ whoami` last bullet = the talk title; `I ❤️` line tuned to the topic
- [ ] `Topics to cover` maps 1:1 to real slides, in order
- [ ] The solution is *earned* — at least one `* Cons:` or "Works well, but..." rung first
- [ ] Concept slides and code slides alternate; no two prose slides back to back
- [ ] Every snippet is real, runnable, and carries a teaching comment
- [ ] Foundation slides calibrated to the audience (cut for experts, expand for students)
- [ ] Exactly one meme/GIF, placed at a turn in the argument
- [ ] One bold per slide, on the single load-bearing word
- [ ] Diagrams use `bg right:50%`; full-slide diagrams get their own text-free slide
- [ ] Numbers have units and a stated setup
- [ ] `### Limitations` slide present and honest
- [ ] `### Summary` bullets are claims; contact + `../static/linkedin-qr.png` on `bg right:20%`
- [ ] `### References` slide if the talk cites papers/docs
- [ ] No "Thank you" slide
- [ ] Slide count matches the slot (~1/min)
- [ ] Add the talk to `README.md`
