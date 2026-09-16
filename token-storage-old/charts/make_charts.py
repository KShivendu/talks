#!/usr/bin/env python3
"""Build the five slide charts for the Token-Native Storage talk.

Every number is read from the benchmark repo's canonical result files, never
typed by hand. Per token-storage/README.md:

  * ratios   -> 07_kalcher_baseline/results.json :: table1_full_train_consistent
                (one harness, seed 9012, every cell in the same setup)
  * latency  -> 03_latency/latency_grid_results.json
                (P-core pinned, tokenize measured serving-cold)

Usage:
    uv run python charts/make_charts.py
    TOKEN_STORAGE_REPO=/path/to/token-storage uv run python charts/make_charts.py

Slide charts, not paper figures: 5-8 bars, ~17pt ticks, value labels always on.
Color carries meaning (STYLE-v2, "muted grey for the baseline, one saturated
color per thing I actually want you looking at"):

    GREY  #94a3b8  byte codec        -- the baseline, deliberately boring
    DARK  #475569  the tokenize step -- the cost token-native storage removes
    RED   #dc244C  token-native      -- the only thing worth looking at
"""

import json
import os
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

REPO = Path(os.environ.get("TOKEN_STORAGE_REPO", Path.home() / "projects/token-storage"))
OUT = Path(__file__).resolve().parent.parent / "imgs"

GREY, DARK, RED, INK = "#94a3b8", "#475569", "#dc244C", "#182b3a"

plt.rcParams.update(
    {
        "font.size": 17,
        "font.family": "DejaVu Sans",
        "axes.edgecolor": INK,
        "axes.labelcolor": INK,
        "text.color": INK,
        "xtick.color": INK,
        "ytick.color": INK,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "savefig.bbox": "tight",
        "savefig.dpi": 200,
    }
)


def load():
    ratio_path = REPO / "07_kalcher_baseline/results.json"
    lat_path = REPO / "03_latency/latency_grid_results.json"
    for p in (ratio_path, lat_path):
        if not p.exists():
            sys.exit(f"missing {p}\nset TOKEN_STORAGE_REPO to the token-storage checkout")
    ratios = json.load(ratio_path.open())["table1_full_train_consistent"]["table_median"]
    lat = json.load(lat_path.open())
    return ratios, lat


def bare(ax, xmax, unit):
    """Strip the chart down to bars + labels. No gridlines, no value axis."""
    ax.set_xlim(0, xmax)
    # drop the ticks but keep the axis label -- the value labels on the bars
    # already carry the numbers, the label still has to say what they mean
    ax.tick_params(bottom=False, labelbottom=False)
    for side in ("top", "right", "bottom"):
        ax.spines[side].set_visible(False)
    ax.spines["left"].set_color(INK)
    ax.invert_yaxis()
    ax.set_xlabel(unit)


def label(ax, bars, values, fmt, xmax, ends=None):
    """Write each value just past the end of its bar.

    `ends` matters for stacked bars: a bar's own width is only its last
    segment, so the label has to be placed past the stack total instead.
    """
    ends = values if ends is None else ends
    for bar, v, end in zip(bars, values, ends):
        ax.text(
            end + xmax * 0.012,
            bar.get_y() + bar.get_height() / 2,
            fmt(v),
            va="center",
            fontsize=16,
            color=INK,
        )


# ── 1. Does the napkin math hold? ────────────────────────────────────────────
# English only. The ladder from the talk, in order, ending on raw token IDs.
def chart_ratio_english(ratios):
    rows = [
        ("Raw UTF-8", 1.00, GREY),
        ("LZ4", ratios["LZ4"]["prose"], GREY),
        ("gzip -9", ratios["gzip-9"]["prose"], GREY),
        ("zstd -19", ratios["zstd-19"]["prose"], GREY),
        ("brotli q11", ratios["brotli-q11"]["prose"], GREY),
        ("zstd --train", ratios["zstd --train"]["prose"], GREY),
        ("r50k token IDs\n(no compression)", ratios["r50k raw"]["prose"], RED),
    ]
    names, vals, cols = zip(*rows)
    fig, ax = plt.subplots(figsize=(10.5, 5.4))
    bars = ax.barh(names, vals, color=cols, height=0.68)
    xmax = 3.1
    label(ax, bars, vals, lambda v: f"{v:.2f}x", xmax)
    # the napkin math predicted 2.25x before any measurement
    ax.axvline(2.25, color=RED, linestyle=":", linewidth=2, alpha=0.55)
    ax.text(2.29, -0.72, "napkin math said 2.25x", fontsize=15, color=RED)
    bare(ax, xmax, "compression ratio vs raw UTF-8  (higher is better)")
    ax.set_title(
        "Raw token IDs beat the codecs databases actually ship\nEnglish (C4), 512-token chunks",
        fontsize=18, color=INK, pad=16, loc="left")
    fig.savefig(OUT / "ratio-english.png")
    plt.close(fig)


# ── 2. Does it hold across languages? ────────────────────────────────────────
# Includes the honest failure: r50k on Hindi is 0.84x, worse than UTF-8.
def chart_ratio_corpora(ratios):
    methods = [
        ("LZ4", "LZ4", GREY),
        ("zstd --train", "zstd --train", GREY),
        ("r50k raw", "r50k raw", RED),
        ("o200k raw", "o200k raw", RED),
        ("o200k +ANS", "o200k +ANS", RED),
    ]
    corpora = [("English", "prose"), ("Code", "code"), ("Hindi", "hindi")]
    fig, axes = plt.subplots(1, 3, figsize=(14.5, 4.9), sharex=True)
    xmax = 7.0
    for ax, (title, key) in zip(axes, corpora):
        names = [m[0] for m in methods]
        vals = [ratios[m[1]][key] for m in methods]
        cols = [m[2] for m in methods]
        bars = ax.barh(names, vals, color=cols, height=0.66)
        label(ax, bars, vals, lambda v: f"{v:.2f}x", xmax)
        # 1.0x is the break-even line: below it, you have made the file bigger
        ax.axvline(1.0, color=INK, linewidth=1.2, alpha=0.45)
        ax.set_title(title, fontsize=19, color=INK, pad=10)
        bare(ax, xmax, "")
        if ax is not axes[0]:
            ax.set_yticklabels([])
            ax.spines["left"].set_visible(False)
            ax.tick_params(left=False)
    axes[1].set_xlabel("compression ratio vs raw UTF-8")
    fig.suptitle(
        "A tokenizer only compresses a script it has merges for"
        "   (grey line = 1.0x, break-even)",
        fontsize=19, color=INK, x=0.09, ha="left", y=1.06)
    fig.savefig(OUT / "ratio-corpora.png")
    plt.close(fig)


# ── 3. What each lever buys: ratio vs decode speed ───────────────────────────
# Token-native methods only (they all skip tokenize), with LZ4 as a grey anchor.
def chart_frontier(ratios, lat):
    prose = lat["grid"]["prose"]["o200k"]["methods"]
    byte = lat["byte_codecs"]["prose"]
    # Kalcher(zstd) sits at 3.22x / 29.3us, right on top of +ANS -- true, and
    # in the paper, but two overlapping dots read as a smudge from row 20.
    pts = [
        ("LZ4 (bytes)", byte["LZ4"]["decompress_us"][0], ratios["LZ4"]["prose"], GREY),
        ("raw IDs", prose["raw"]["read_us"][0], ratios["o200k raw"]["prose"], RED),
        ("+freq+vbyte", prose["+freq"]["read_us"][0], ratios["o200k +freq"]["prose"], RED),
        ("+ANS", prose["+ANS"]["read_us"][0], ratios["o200k +ANS"]["prose"], RED),
    ]
    fig, ax = plt.subplots(figsize=(10.5, 5.4))
    for name, x, y, c in pts:
        ax.scatter(x, y, s=340, color=c, zorder=3)
        ax.annotate(
            f"{name}\n{y:.2f}x  /  {x:.1f}µs",
            (x, y),
            textcoords="offset points",
            xytext=(0, 26),
            ha="center",
            fontsize=15,
            color=c if c == RED else INK,
        )
    ax.set_xscale("log")
    ax.set_xlim(0.6, 60)
    ax.set_ylim(1.0, 4.3)
    ax.set_xlabel("decode time per 512-token chunk (µs, log scale)")
    ax.set_ylabel("compression ratio")
    ax.set_xticks([1, 3, 10, 30])
    ax.set_xticklabels(["1µs", "3µs", "10µs", "30µs"])
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.set_title(
        "Ratio vs decode speed: the store can sit anywhere on this curve\n"
        "English, o200k, 512-token chunks",
        fontsize=18, color=INK, pad=16, loc="left")
    fig.savefig(OUT / "frontier.png")
    plt.close(fig)


# ── 4 & 5. The agent flip ────────────────────────────────────────────────────
# A byte store makes the model translate on every access. Split that step out
# so the audience sees it is the whole bar.
def chart_agent(lat, ratios, step):
    prose = lat["grid"]["prose"]["o200k"]
    byte = lat["byte_codecs"]["prose"]
    tok = prose["tokenize_serving_cold_us"][0]
    detok = prose["detokenize_serving_cold_us"][0]
    m = prose["methods"]

    if step == "read":
        translate, tname = tok, "tokenize"
        rows = [
            ("UTF-8 + LZ4", byte["LZ4"]["decompress_us"][0], "decompress"),
            ("UTF-8 + zstd -19", byte["zstd-19"]["decompress_us"][0], "decompress"),
        ]
        native = [
            ("token IDs, raw", m["raw"]["read_us"][0]),
            ("token IDs +freq", m["+freq"]["read_us"][0]),
            ("token IDs +ANS", m["+ANS"]["read_us"][0]),
        ]
        title = "Agent read: every byte-store read re-tokenizes text the model just decoded"
        out = "agent-read.png"
    else:
        translate, tname = detok, "detokenize"
        rows = [
            ("UTF-8 + LZ4", byte["LZ4"]["compress_us"][0], "compress"),
            ("UTF-8 + zstd -19", byte["zstd-19"]["compress_us"][0], "compress"),
        ]
        native = [
            ("token IDs, raw", m["raw"]["write_us"][0]),
            ("token IDs +freq", m["+freq"]["write_us"][0]),
            ("token IDs +ANS", m["+ANS"]["write_us"][0]),
        ]
        title = "Agent write: the model already produced the IDs"
        out = "agent-write.png"

    names = [r[0] for r in rows] + [n[0] for n in native]
    trans = [translate] * len(rows) + [0.0] * len(native)
    codec = [r[1] for r in rows] + [n[1] for n in native]
    codec_cols = [GREY] * len(rows) + [RED] * len(native)
    totals = [t + c for t, c in zip(trans, codec)]
    xmax = max(totals) * 1.30

    fig, ax = plt.subplots(figsize=(11.5, 5.2))
    ax.barh(names, trans, color=DARK, height=0.66, label=tname)
    bars = ax.barh(names, codec, left=trans, color=codec_cols, height=0.66, label="codec")
    label(ax, bars, totals, lambda v: f"{v:.1f}µs", xmax, ends=totals)
    # name the dominant segment inside the bar, so nobody has to read a legend
    ax.text(
        translate / 2,
        0,
        tname,
        ha="center",
        va="center",
        fontsize=15,
        color="white",
        fontweight="bold",
    )
    bare(ax, xmax, f"median {step} latency per 512-token chunk (µs, lower is better)")
    ax.set_title(title, fontsize=18, color=INK, pad=14, loc="left")
    fig.savefig(OUT / out)
    plt.close(fig)


def main():
    OUT.mkdir(exist_ok=True)
    ratios, lat = load()
    chart_ratio_english(ratios)
    chart_ratio_corpora(ratios)
    chart_frontier(ratios, lat)
    chart_agent(lat, ratios, "read")
    chart_agent(lat, ratios, "write")

    # Print every number the slides quote, so prose and charts can't drift.
    p = lat["grid"]["prose"]
    print("\n== numbers quoted on slides (English / prose, 512-token chunks) ==", flush=True)
    print(f"  o200k tokenize (serving-cold)  {p['o200k']['tokenize_serving_cold_us'][0]:7.1f} us")
    print(f"  o200k detokenize               {p['o200k']['detokenize_serving_cold_us'][0]:7.1f} us")
    for name, key in [("LZ4", "LZ4"), ("zstd-19", "zstd-19"), ("zstd --train", "zstd --train")]:
        b = lat["byte_codecs"]["prose"][key]
        print(
            f"  {name:14s} ratio {ratios[key]['prose']:.2f}x   "
            f"comp {b['compress_us'][0]:8.1f} us   decomp {b['decompress_us'][0]:6.1f} us"
        )
    for name, key in [("raw", "raw"), ("+freq", "+freq"), ("+ANS", "+ANS")]:
        mm = p["o200k"]["methods"][key]
        print(
            f"  o200k {name:8s} ratio {ratios['o200k ' + ('raw' if key == 'raw' else key.replace('+', '+'))]['prose']:.2f}x   "
            f"write {mm['write_us'][0]:6.2f} us   read {mm['read_us'][0]:6.2f} us"
        )
    print(f"  r50k raw ratio {ratios['r50k raw']['prose']:.2f}x  (Hindi {ratios['r50k raw']['hindi']:.2f}x)")
    print(f"\nwrote 5 charts to {OUT}", flush=True)


if __name__ == "__main__":
    main()
