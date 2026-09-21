# My Talk Style Guide (v3) — getting the numbers right

`STYLE.md` (v1) is the mechanical one: boilerplate, layout ratios, slide skeleton.
`STYLE-v2.md` is the opinionated one: voice, structure, what I do and don't do.
Both are about how a slide should *read*.

This one is about whether what's on it is *true*.

It comes out of building the Token-Native Storage deck, where the writing was never
really the problem. Eleven wrong numbers reached a pushed slide. I caught five of them;
I had to be told about six. Every single one came from the same small set of mistakes,
so they're worth writing down.

(Claude drafted this from that session. Same deal as v2 — correct anything that isn't me.)

---

## The one rule

**A number on a slide is a claim I am making to a room full of people who can check it.**

Everything below is a corollary.

---

## Where numbers actually go wrong

Not arithmetic. Never once arithmetic. Every failure was one of these five:

### 1. The source was stale

The agent-latency charts said tokenize cost **445.6µs**. The ladder slide, three slides
earlier, said **235µs**. Same quantity, same corpus, same deck. The charts were composed
from my blog post's published table; the blog post predates the last benchmark re-run.

Worse, the benchmark results file itself had been re-run and never committed, so the
deck was quoting numbers the repo could not reproduce. `git log` said the results were
current. The file mtime said otherwise.

> **Committed does not mean current, and current does not mean committed.** Before
> quoting a result file, check it against a second file that measures the same thing.
> If two experiments disagree by more than a few percent, one of them is stale and I
> need to find out which before it goes on a slide.

The tell that saved me: `latency_grid_results.json` measured LZ4 compress at 2.9µs where
the blog said 11.4µs, and decompress at 1.0µs where the blog said 4.1µs. A consistent
3-4x offset across every codec is not noise, it's two different measurement conditions.

### 2. One chart, two experiments

The corpora chart reads `07_kalcher_baseline`. The chunk-size charts read
`03_latency`. They disagree by up to 4.5% on methods they both measure — code `+ANS`
is 3.19x in one and 3.05x in the other.

I nearly put a `+dict` bar from the sweep next to an `+ANS` bar from kalcher. The gap
would have looked like +6% when the truth inside either experiment is +11%.

> **One chart, one source.** If a method is missing from the source a chart already
> uses, either put it on a different chart that uses the right source, or don't show
> it. Never borrow one bar from somewhere else.

### 3. The number measured something other than the label

Three separate times:

- The ladder quoted **305µs** to read an LZ4 block. That figure was
  `decompress + slice + tokenize`. The column was headed "decode".
- The same row quoted **2.9µs** to encode a 16KB block. That's the cost of encoding
  *one document*. A block is seven of them.
- The agent-read chart plotted `read_us`, which for a byte codec is
  `decompress + tokenize`. The tokenize is ~99% of it and identical across all four
  codecs, so the chart was comparing a codec against a tokenizer and calling the
  flatness a finding.

> **Read the config string, not the field name.** Every one of these was caught by a
> line of JSON sitting next to the number:
> `"read": "agent read = to token IDs; byte = decompress + tokenize(serving-cold)"`.
> If the result file doesn't say what a field contains, go read the benchmark that
> wrote it.

### 4. The claim outran the evidence

Slide title: **"Encode cost grows faster than the input."** Against an input that grows
8x from 512 to 4,096 tokens, exactly one codec outgrows it (zstd-19, 11-12x). gzip and
`zstd --train` are linear. LZ4, `+freq`, `+ANS` and *brotli* are all **sublinear** —
and brotli was the one the speaker note singled out as "18-35x".

Another: a chart titled **"Ratio holds at every chunk size"** that was false the moment
anyone clicked the Code tab.

And one of mine, right after I'd flagged the same sin in someone else's line: I titled a
chart **"~100x cheaper"** when the honest floor was **8.1x**. 100x was true only against
the slowest codec.

> **State the claim as the worst case for my own argument.** "Token IDs encode 8-18x
> cheaper than even the fastest byte codec" cannot be attacked. "~100x" invites someone
> to find the 8x and stop listening.
>
> **A title is a claim.** Check it against every tab, every corpus, every chunk size the
> chart can show. If it's only true on the default view, it's the wrong title.

### 5. The example was an artifact

Looking for tokens that move furthest under frequency remapping, I surfaced `'Ipv'`
(ID 81,756 → rank 121, ~970 uses per million in Python). Gorgeous example. Completely
fake — it appears 970/M in the first 3M tokens of the corpus and **0.0/M** in the last
3M. The sample was a contiguous slice dominated by a handful of networking repos.

> **Before an example becomes a slide, re-measure it on a different slice.** One line of
> work. It would also have caught `'controls'` (945/M → 1.2/M) and `''):'`
> (1,006/M → 9.9/M) in the same pass.

Related, same experiment: my first ranking sorted by *raw ID distance*, which surfaced
tokens that moved 2,000 places and saved **zero bytes**, because they stayed inside the
same varint width. **Rank by the thing that matters** — bytes saved, not positions moved.

---

## Verification that actually verifies

### grep is not verification

I rejoined slides with `"\n---\n"`, which turns the preceding line into a Markdown setext
H2. It silently destroyed most of the deck, including slide 1. I "verified" it two ways:
`grep -c '^---$'` and a Python re-split. **Both count `---` as text. Neither renders it.**
Then I pushed it live.

> **If a change can affect rendering, verify by rendering.** Load the built page in a
> browser, read the DOM, screenshot it. A regex over source proves nothing about output.

### Screenshot the state the audience sees

My slide screenshotter loads `?clicks=99`, which reveals everything. It cannot tell a
slide that reveals in seven steps from one that dumps all seven at once — so it happily
passed a `v-clicks` change that did nothing. Stepping the clicks is a different script
and a necessary one.

Same class of error: my test server had SPA fallback and stripped the path prefix, so it
served pages that 404'd on GitHub Pages. **Make the test server fail the way production
fails** — no fallback, no prefix rewriting.

### Measure in the units the layout uses

I sized the animated hero three times and it clipped three times, because I was measuring
**rendered pixels** while Slidev scales a 980x552 canvas. Every measurement was 1.3-1.8x
too generous depending on window size.

> **Ask what unit the layout is in before measuring anything.** And then: don't hand-pick
> a size at all if the content's height varies — measure it and scale to fit. The
> hand-picked number is right for exactly one frame of one preset.

### Trust the browser over the framework

Two failed auto-fit attempts before one worked. `ResizeObserver` lagged content that grew
during an animation. `requestAnimationFrame` **never fired at all** inside that iframe —
verified by scheduling one and watching it not run. A 100ms interval worked.

> When a callback "should" fire, check that it fired.

### Look at the real browser

I debugged a layout overflow for several rounds against my own headless browser at 16:9,
where it fit fine. It was broken on the actual laptop the whole time. I had a tool that
drives the real browser and didn't reach for it until told.

> **If the complaint is "it looks wrong on my screen", go look at their screen.**

### Reported errors need the same scrutiny as numbers

I told him a build error was real. It was a stale hot-reload overlay from my own rapid
rebuilds; the file on disk was fine and the build was passing. **Reload before believing
a dev-server error.**

And I reported the blog repo had zero unpushed commits by running `git log origin/main..main`
on a repo that was **on a different branch**. Two commits were sitting there. **Check the
branch before reporting the state.**

---

## Composed numbers

Half this deck's numbers are sums: a byte-codec read is `decompress + tokenize`, a write
is `detokenize + compress`.

> **Build the total from the parts, in code, and assert they agree.**

When I switched the agent charts to summing their own segments, two things happened: the
totals could no longer disagree with the stacked bars, and an assertion immediately found
**18 bars in my published blog post** where the segment table and the total table
contradict each other by up to 62%. That bug had been live for months and no reader had
caught it.

If the parts and the total come from different places, an assertion is the only thing
standing between me and a chart whose segments don't add up to its own bar.

---

## Reuse, and when to stop

Default: **extract, don't reimplement.** The deck pulls chart components, palettes and
even a composition function straight out of the blog repo, so there is one definition of
each and editing the post updates the slides.

But I inverted that rule once and was right to: the moment the post's *data* turned out to
be stale, "single source of truth" stopped pointing at the post and started pointing at
the benchmark repo. Reuse is a means to consistency, not the goal.

> Extract when the source is canonical. Switch when it isn't, and say in the commit why
> the earlier decision reversed.

Two related rules I got told off for:

- **Never hand-edit generated or minified files.** If the output is wrong, the generator
  is wrong. Fix it there.
- **Don't fork a component to retheme it.** Add a prop. `BarChart`, `LineChart` and the
  animated hero all now take a theme override, which is nine lines each and leaves the
  blog rendering identically.

---

## Scope

- **"Port the talk" means all of it.** I shipped three slides of twenty-eight as a
  proof of concept and called it progress. Nobody asked for a proof of concept.
- **One thing at a time.** When four things are wrong, fix the one that was named and
  show it working before starting the next.
- **Don't quietly widen.** Applying a marker or colour change to every chart is usually
  right, because inconsistency reads as a bug — but say that's what I did and how to
  scope it back.
- **Flag, don't silently fix, someone else's prose.** Typos yes. Wording, no.

---

## When the framing is wrong, say so

The best change in that deck came from him asking what "agent vs human latency" even
means. It doesn't mean anything: a human reads a 512-token chunk in ~90 seconds, so the
50µs detokenize charged to that path is **two million times** smaller than the reader.
Nothing about a human was ever measured. The two columns differ in *output format* —
token IDs or characters — which is a property of the interface.

That reframe retired a whole slide, renamed two chart toggles, and produced a better one.

> **When a label can't survive being asked what it measures, the label is wrong, not the
> measurement.** Worth auditing every axis title and toggle for this before a talk ships.

---

## Checklist before a deck goes out

- [ ] Every number traceable to a result file, named in a speaker note or code comment
- [ ] No chart mixes two experiments; if the deck quotes two sources for one quantity,
      they agree, or the disagreement is explained in the notes
- [ ] Each result file cross-checked against a second measurement of the same thing
- [ ] Every claim in a title checked against every tab and corpus the chart offers
- [ ] Claims stated as the worst case for my own argument
- [ ] Every named example re-measured on a different slice of the corpus
- [ ] Composed numbers asserted against the sum of their parts
- [ ] Deck rendered and screenshotted, not grepped
- [ ] Click states stepped through, not `?clicks=99`
- [ ] Viewed in a real browser at the size it'll be presented at
- [ ] Speaker notes carry the counter-argument and the number that answers it
