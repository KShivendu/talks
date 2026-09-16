#!/usr/bin/env python3
"""Build imgs/hero.png for the Token-Native Storage talk.

Same visual language as the other decks' heroes: near-black ground, title in
white with the load-bearing half in Qdrant red, name and site in the corner.

The right-hand figure is not decoration. It is the talk's whole argument in one
example, and the numbers are computed live, not drawn:

    "Token-native storage"  ->  20 UTF-8 bytes
                            ->  4 r50k tokens -> 8 bytes as uint16   (2.5x)

Usage:  uv run python charts/make_hero.py
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import tiktoken
from matplotlib.patches import FancyArrow, FancyBboxPatch

OUT = Path(__file__).resolve().parent.parent / "imgs" / "hero.png"

BG, RED, WHITE, GREY, SLATE = "#0b1220", "#dc244C", "#ffffff", "#94a3b8", "#1e293b"

PHRASE = "Token-native storage"
ENC = tiktoken.get_encoding("r50k_base")


def box(ax, x, y, w, h, face, edge, text, color, size, weight="normal"):
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle="round,pad=0,rounding_size=0.35",
            facecolor=face,
            edgecolor=edge,
            linewidth=1.4,
        )
    )
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", color=color,
            fontsize=size, fontweight=weight, family="DejaVu Sans")


def main():
    ids = ENC.encode(PHRASE)
    pieces = [ENC.decode([i]) for i in ids]
    utf8_bytes = len(PHRASE.encode())
    token_bytes = 2 * len(ids)  # r50k fits in uint16
    ratio = utf8_bytes / token_bytes

    fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 160)
    ax.set_ylim(0, 90)
    ax.axis("off")

    # no red rule here -- the deck CSS already draws border-top on every slide

    # ── left: the title block ────────────────────────────────────────────────
    ax.text(10, 68, "Token-Native", color=RED, fontsize=52, fontweight="bold", va="center")
    ax.text(10, 58, "Storage", color=WHITE, fontsize=52, fontweight="bold", va="center")
    ax.text(10, 48.5, "Read and write in your agent's language",
            color=GREY, fontsize=22, va="center")
    ax.text(10, 32, "Kumar Shivendu", color=WHITE, fontsize=26, fontweight="bold", va="center")
    ax.text(10, 25.5, "Engineer @ Qdrant", color=GREY, fontsize=22, va="center")
    ax.text(10, 9, "kshivendu.dev", color=GREY, fontsize=20, va="center")

    # ── right: the same string, two ways ─────────────────────────────────────
    x0, w, gap = 84, 2.9, 0.5
    ax.text(x0, 70, f'"{PHRASE}"', color=WHITE, fontsize=21, va="center", style="italic")

    # one grey cell per UTF-8 byte
    for i, ch in enumerate(PHRASE):
        box(ax, x0 + i * (w + gap), 57, w, 6, SLATE, "#334155",
            "␣" if ch == " " else ch, GREY, 13)
    ax.text(x0, 51, f"UTF-8  ·  {utf8_bytes} bytes", color=GREY, fontsize=20, va="center")

    ax.add_patch(FancyArrow(x0 + 14, 45, 0, -6, width=0.5, head_width=2.4,
                            head_length=2.2, color=RED, length_includes_head=True))
    ax.text(x0 + 18, 42, "BPE tokenize", color=RED, fontsize=18, va="center")

    # one red cell per token, sized to the text it swallowed
    x = x0
    for tid, piece in zip(ids, pieces):
        cw = max(len(piece), 1) * (w + gap) - gap
        box(ax, x, 28, cw, 8, RED, RED, str(tid), WHITE, 16, "bold")
        # show the leading space -- " storage" being one token is the point
        ax.text(x + cw / 2, 24.5, piece.replace(" ", "\u2423"), ha="center",
                color=GREY, fontsize=13)
        x += cw + gap
    ax.text(x0, 18, f"{len(ids)} token IDs  ·  {token_bytes} bytes as uint16",
            color=WHITE, fontsize=20, va="center")

    ax.text(x0, 10.5, f"{ratio:.1f}x smaller. No compression algorithm.",
            color=RED, fontsize=22, fontweight="bold", va="center")

    fig.savefig(OUT, facecolor=BG)
    plt.close(fig)
    print(f"{PHRASE!r}: {utf8_bytes} B UTF-8 -> {len(ids)} tokens "
          f"-> {token_bytes} B uint16 = {ratio:.2f}x", flush=True)
    print(f"wrote {OUT}", flush=True)


if __name__ == "__main__":
    main()
