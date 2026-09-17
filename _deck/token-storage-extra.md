<!--
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

`zstd --train` is the honest comparison, and on the Code tab it beats +ANS:
3.34x vs 3.05x at 512, widening to 4.78x vs 2.94x at 4,096. But it does not
beat +dict, which is the point of that seventh line -- 3.39x at 512, ahead of
zstd --train, and 4.48x at 4,096, just behind it. And +dict reads in 7.2us
against 228.3us, because its output is still token IDs. Code is highly
repetitive, so a dictionary plus an LZ window spanning many chunks beats
per-token entropy coding. Two answers if pushed: the dictionary has to be
trained on your corpus and then shipped and versioned alongside it, and its
output is still bytes you have to tokenize on every read.
-->


And what does that compression cost to write?

<iframe :src="chart('chunk-encode')" class="w-full border-0" style="height: 400px"
        title="Encode cost across chunk sizes" />

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
// BASE_URL is '/' in dev, '/token-storage/' in the build. A root-absolute path
// resolves to the site root and 404s once deployed.
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
Same competition and the same grey ramp as the ratio sweep, so the pair reads
as one thought: what you get, then what it costs.

The claim is the worst case for us, so nobody can argue the choice of
opponent: across all three corpora and all four sizes, the CHEAPEST byte codec
still costs 8.1-17.7x more than the DEAREST token method. Extreme against
extreme would be 526x -- true, but that is picking your rival.

Do NOT say "encode cost grows faster than the input", which this slide used to
claim. Against an input that grows 8x (512 -> 4,096), only zstd-19 outgrows it
(11.3-12.1x). gzip-9 and zstd --train are about linear (6.7-9.0x), and LZ4
(3.4-4.3x), +freq (2.1-4.6x), +ANS (4.5-7.1x) are all sublinear. brotli, which
the old note singled out at "18-35x", is 5.9-7.5x -- sublinear too.
-->

<!--
Hindi with o200k is 2.55x raw and 5.90x with ANS. Hindi with r50k is 0.84x,
bigger than the original. r50k never learned to merge Devanagari, so the Hindi
word for India (12 UTF-8 bytes) becomes 7 token IDs = 14 bytes.
-->

---

## And to read back, at every chunk size?

<iframe :src="chart('chunk-read')" class="w-full border-0" style="height: 370px"
        title="Decode cost across chunk sizes" />

<div class="text-sm opacity-80 -mt-1">

Decode only. A byte codec must then **tokenize**: +307us at 512 tokens, +1,569us at 4,096 (English). Token IDs need none.

</div>

<script setup>
import { useDarkMode } from '@slidev/client'
const { isDark } = useDarkMode()
const chart = (n) => `${import.meta.env.BASE_URL}charts/${n}.html${isDark.value ? '?dark' : ''}`
</script>

<!--
The one that matters: a write happens once, a read happens on every retrieval
forever.

Decode ALONE here, on equal terms: decompress_us for the byte codecs, read_us
for the token methods (already token IDs, so read_us is their pure decode).

Concede the chart out loud -- the byte codecs win it. English at 512: LZ4 0.9us,
zstd --train 2.9, zstd-19 4.2, gzip-9 7.4, against +freq 4.2 and +ANS 30.8.
+ANS is the slowest thing on the slide and that is fine, say so.

Then the line under the chart. The byte path is not finished at decode; it has
to tokenize before a model can read a word, and that is one shared constant,
identical to the decimal across all four codecs:

  English prose, r50k       512      4,096
    tokenize tax          306.7     1569.2
    (LZ4 decode)            0.9        7.0

So 0.9us of work buys you a 306.7us bill. The token path's 4.2us is the whole
cost. Hindi 161.3us at 512, code 227.1us.

Watch out for the code corpus at 1,024: the tax reads 2016.0us, out of line
with 227.1 / 594.2 / 1099.0 either side of it. That is a measurement artifact
in this sweep, not a real cliff. Use English if anyone drills in.

Why this differs from the earlier `read_us` framing: bundling the tokenize into
the codec's bar compared a codec against a tokenizer, and made all four byte
codecs overlap. Separating them is fairer and still wins.

The gap, stated as the worst case for us: 6.6-17.0x against the CHEAPEST byte
codec, up to 119x against the dearest. English at 512 is +freq 4.2us against
307.7us.

Growth is sublinear for the byte codecs (5.1-5.2x for an 8x input), so do not
claim it explodes. +ANS grows fastest of the token methods at 7.7x, +freq
slowest at 3.3x.
-->

---

<!--
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

-->

