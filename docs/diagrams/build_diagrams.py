"""Generate the SVG diagrams in docs/diagrams.

Follows the diagram-design skill conventions (https://github.com/cathrynlavery/diagram-design):
4px grid, orthogonal connectors, masked arrow labels, at most two accent elements,
legend strip at the bottom, and an accessible <svg> (role, title, desc).

Deviation by request: output is standalone SVG for Markdown embedding, not HTML.
The skin is a GitHub-like neutral palette with system font stacks, so the files
render on github.com without loading web fonts.

Usage: python docs/diagrams/build_diagrams.py
"""

from __future__ import annotations

import html
from pathlib import Path

OUT = Path(__file__).resolve().parent

# --- Skin: GitHub-like neutral (Primer light) -------------------------------
PAPER = "#f6f8fa"
PAPER_2 = "#eff2f5"
WHITE = "#ffffff"
INK = "#1f2328"
MUTED = "#59636e"
RULE = "rgba(31,35,40,0.15)"
RULE_SOLID = "#d1d9e0"
ACCENT = "#bc4c00"
ACCENT_TINT = "rgba(188,76,0,0.08)"
LINK = "#0969da"

SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
SERIF = "Georgia, 'Times New Roman', serif"

BOX_STYLES = {
    "backend": (WHITE, INK, None),
    "focal": (ACCENT_TINT, ACCENT, None),
    "external": ("rgba(31,35,40,0.03)", "rgba(31,35,40,0.40)", None),
    "optional": ("rgba(31,35,40,0.02)", "rgba(31,35,40,0.45)", "4,3"),
}


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def r4(v: float) -> int:
    """Round up to the 4px grid."""
    return int(-(-v // 4) * 4)


class Diagram:
    def __init__(self, slug: str, w: int, h: int, eyebrow: str, title: str, desc: str):
        self.slug, self.w, self.h = slug, w, h
        self.eyebrow, self.title, self.desc = eyebrow, title, desc
        self.parts: list[str] = []

    # primitives ------------------------------------------------------------
    def add(self, s: str) -> None:
        self.parts.append(s)

    def text(self, x, y, s, size=12, fill=INK, font=SANS, weight=None, anchor=None,
             ls=None, italic=False):
        a = [f'x="{x}"', f'y="{y}"', f'fill="{fill}"', f'font-size="{size}"',
             f'font-family="{font}"']
        if weight:
            a.append(f'font-weight="{weight}"')
        if anchor:
            a.append(f'text-anchor="{anchor}"')
        if ls:
            a.append(f'letter-spacing="{ls}"')
        if italic:
            a.append('font-style="italic"')
        self.add(f'<text {" ".join(a)}>{esc(s)}</text>')

    def eyebrow_text(self, x, y, s, fill=MUTED, anchor=None, weight=None, size=8):
        self.text(x, y, s.upper(), size=size, fill=fill, font=MONO, anchor=anchor,
                  ls="0.16em", weight=weight)

    def rect(self, x, y, w, h, fill, stroke=None, sw=1, rx=0, dash=None):
        a = f'x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"'
        if rx:
            a += f' rx="{rx}"'
        if stroke:
            a += f' stroke="{stroke}" stroke-width="{sw}"'
        if dash:
            a += f' stroke-dasharray="{dash}"'
        self.add(f"<rect {a}/>")

    def marker(self, kind: str) -> str:
        return f"url(#{self.slug}-{kind})"

    def path(self, pts, color=MUTED, sw=1.2, marker="arrow", dash=None, r=8):
        """Orthogonal polyline with rounded r=8 elbows."""
        d = f"M {pts[0][0]} {pts[0][1]}"
        for i in range(1, len(pts) - 1):
            (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
            dx0, dy0 = (x1 > x0) - (x1 < x0), (y1 > y0) - (y1 < y0)
            dx1, dy1 = (x2 > x1) - (x2 < x1), (y2 > y1) - (y2 < y1)
            d += f" L {x1 - dx0 * r} {y1 - dy0 * r} Q {x1} {y1} {x1 + dx1 * r} {y1 + dy1 * r}"
        d += f" L {pts[-1][0]} {pts[-1][1]}"
        a = f'd="{d}" fill="none" stroke="{color}" stroke-width="{sw}"'
        if dash:
            a += f' stroke-dasharray="{dash}"'
        if marker:
            a += f' marker-end="{self.marker(marker)}"'
        self.add(f"<path {a}/>")

    def label(self, cx, cy, s, fill=MUTED):
        """Arrow label on an opaque paper mask, centred at (cx, cy)."""
        w = r4(len(s) * 5.6 + 12)
        self.rect(cx - w / 2, cy - 6, w, 12, PAPER, rx=2)
        self.text(cx, cy + 3, s.upper(), size=8, fill=fill, font=MONO, anchor="middle",
                  ls="0.08em")

    def node(self, x, y, w, h, name, sub=None, kind="backend", rx=6):
        fill, stroke, dash = BOX_STYLES[kind]
        self.rect(x, y, w, h, PAPER, rx=rx)  # opaque mask under translucent fills
        self.rect(x, y, w, h, fill, stroke, 1, rx, dash)
        cx = x + w / 2
        if sub:
            self.text(cx, y + h / 2 - 2, name, weight=600, anchor="middle")
            self.text(cx, y + h / 2 + 12, sub, size=9, fill=MUTED, font=MONO, anchor="middle")
        else:
            self.text(cx, y + h / 2 + 4, name, weight=600, anchor="middle")

    def diamond(self, cx, cy, hw, hh, name, sub=None):
        pts = f"{cx},{cy - hh} {cx + hw},{cy} {cx},{cy + hh} {cx - hw},{cy}"
        self.add(f'<polygon points="{pts}" fill="{PAPER}"/>')
        self.add(f'<polygon points="{pts}" fill="{WHITE}" stroke="{INK}" stroke-width="1"/>')
        if sub:
            self.text(cx, cy - 2, name, weight=600, anchor="middle")
            self.text(cx, cy + 12, sub, size=9, fill=MUTED, font=MONO, anchor="middle")
        else:
            self.text(cx, cy + 4, name, weight=600, anchor="middle")

    def legend(self, items, note=None):
        """Horizontal legend strip in the bottom 60px. items: (swatch_fn, label)."""
        y0 = self.h - 56
        self.add(f'<line x1="40" y1="{y0}" x2="{self.w - 40}" y2="{y0}" stroke="{RULE}" stroke-width="0.8"/>')
        self.eyebrow_text(40, y0 + 16, "Legend")
        x = 40
        for draw, lab in items:
            draw(x, y0 + 28)
            self.text(x + 32, y0 + 38, lab, size=9, fill=MUTED)
            x += 32 + r4(len(lab) * 5.2) + 28
        if note:
            self.text(self.w - 40, y0 + 38, note, size=9, fill=MUTED, anchor="end", italic=True)

    # legend swatches ---------------------------------------------------------
    def sw_box(self, kind):
        def f(x, y):
            fill, stroke, dash = BOX_STYLES[kind]
            self.rect(x, y, 24, 12, fill, stroke, 1, 2, dash)
        return f

    def sw_oval(self, x, y):
        self.rect(x, y, 24, 12, "rgba(31,35,40,0.03)", "rgba(31,35,40,0.40)", 1, 6)

    def sw_diamond(self, x, y):
        self.add(f'<polygon points="{x},{y + 6} {x + 12},{y} {x + 24},{y + 6} {x + 12},{y + 12}" '
                 f'fill="{WHITE}" stroke="{INK}" stroke-width="1"/>')

    def sw_line(self, color, marker=None, dash=None, sw=1.2):
        def f(x, y):
            a = f'x1="{x}" y1="{y + 6}" x2="{x + 24}" y2="{y + 6}" stroke="{color}" stroke-width="{sw}"'
            if dash:
                a += f' stroke-dasharray="{dash}"'
            if marker:
                a += f' marker-end="{self.marker(marker)}"'
            self.add(f"<line {a}/>")
        return f

    def sw_dot(self, color, r=4):
        def f(x, y):
            self.add(f'<circle cx="{x + 12}" cy="{y + 6}" r="{r}" fill="{color}"/>')
        return f

    # output -----------------------------------------------------------------
    def render(self) -> str:
        s = self.slug
        out = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" '
            f'width="{self.w}" height="{self.h}" role="img" aria-labelledby="{s}-title {s}-desc">',
            f'<title id="{s}-title">{esc(self.title)}</title>',
            f'<desc id="{s}-desc">{esc(self.desc)}</desc>',
            "<defs>",
        ]
        for kind, color in (("arrow", MUTED), ("arrow-accent", ACCENT), ("arrow-link", LINK)):
            out.append(f'<marker id="{s}-{kind}" markerWidth="8" markerHeight="6" refX="7" refY="3" '
                       f'orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{color}"/></marker>')
        out += [
            "</defs>",
            f'<rect width="100%" height="100%" fill="{PAPER}"/>',
            f'<text x="40" y="44" fill="{MUTED}" font-size="8" font-family="{MONO}" '
            f'letter-spacing="0.16em">{esc(self.eyebrow.upper())}</text>',
            f'<text x="40" y="76" fill="{INK}" font-size="28" font-family="{SERIF}" '
            f'letter-spacing="-0.01em">{esc(self.title)}</text>',
        ]
        return "\n".join(out + self.parts + ["</svg>", ""])

    def save(self) -> Path:
        p = OUT / f"{self.slug}.svg"
        p.write_text(self.render(), encoding="utf-8", newline="\n")
        return p


# --- 1. Cost levers: effort vs savings (quadrant) ---------------------------
def cost_levers() -> Diagram:
    d = Diagram("cost-levers-quadrant", 960, 600, "Quadrant · cost levers",
                "Cost levers: effort vs savings",
                "Ten token-cost levers positioned by implementation effort and savings potential, "
                "numbered in the recommended adoption order.")
    x0, x1, y0, y1 = 120, 880, 112, 496
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    d.rect(x0, y0, cx - x0, cy - y0, "rgba(188,76,0,0.04)")
    d.add(f'<line x1="{x0}" y1="{cy}" x2="{x1}" y2="{cy}" stroke="rgba(31,35,40,0.40)" stroke-width="1"/>')
    d.add(f'<line x1="{cx}" y1="{y0}" x2="{cx}" y2="{y1}" stroke="rgba(31,35,40,0.40)" stroke-width="1"/>')
    d.eyebrow_text(x1, y1 + 20, "More effort / complexity →", anchor="end")
    d.eyebrow_text(x0, y1 + 20, "← Less effort")
    d.eyebrow_text(cx + 12, y0 + 12, "↑ More savings potential")
    d.eyebrow_text(cx + 12, y1 - 4, "↓ Less savings potential")
    d.eyebrow_text(x0 + 16, y0 + 24, "Start here", fill=ACCENT, weight=600, size=9)
    d.eyebrow_text(x1 - 16, y0 + 24, "Strategic programs", anchor="end", size=9)
    d.eyebrow_text(x0 + 16, y1 - 16, "Hygiene: do anyway", size=9)
    d.eyebrow_text(x1 - 16, y1 - 16, "Reconsider", anchor="end", size=9)

    # (number, label, effort 0..1, savings 0..1, label side)
    items = [
        (1, "Stop unnecessary generation", 0.06, 0.30, "r"),
        (2, "Auto cost-oriented tier", 0.12, 0.18, "r"),
        (3, "Right-size model + effort", 0.20, 0.86, "r"),
        (4, "Deterministic tools", 0.26, 0.72, "r"),
        (5, "Trim context and output", 0.26, 0.58, "r"),
        (6, "Selective instructions + skills", 0.56, 0.44, "r"),
        (7, "Prompt-cache reuse", 0.58, 0.70, "r"),
        (8, "Evaluate managed orchestration", 0.42, 0.36, "l"),
        (9, "Evaluated routing + bounded agents", 0.88, 0.90, "l"),
        (10, "Local models", 0.80, 0.60, "l"),
    ]
    for n, lab, e, s, side in items:
        px = round(x0 + 24 + e * (x1 - x0 - 48))
        py = round(y1 - 32 - s * (y1 - y0 - 64))
        focal = n == 3
        txt = f"{n}  {lab}"
        d.add(f'<circle cx="{px}" cy="{py}" r="{6 if focal else 4}" fill="{ACCENT if focal else INK}"/>')
        d.text(px + 12 if side == "r" else px - 12, py + 4, txt, size=11,
               fill=INK if focal else MUTED, weight=600 if focal else None,
               anchor=None if side == "r" else "end")
    d.legend([(d.sw_dot(ACCENT, 6), "Best first move"), (d.sw_dot(INK), "Lever (number = adoption order)")],
             note="Positions are qualitative judgments, not measurements.")
    return d


# --- 2. Prompt-cache prefix layout (layer stack) -----------------------------
def cache_layers() -> Diagram:
    d = Diagram("prompt-cache-layers", 960, 560, "Layer stack · prompt caching",
                "Order context from stable to volatile",
                "Five context layers ordered from most stable to most volatile; the first four form a "
                "reusable cached prefix and the new turn is not reused.")
    x, w, top, rh = 200, 560, 112, 64
    rows = [
        ("L1", "Tool definitions", "consistent schemas and order"),
        ("L2", "System / developer instructions", "same text every request"),
        ("L3", "Fixed reference material", "only if genuinely reused"),
        ("L4", "Conversation history", "append-only, original order"),
        ("L5", "New turn", "user request · retrieval · timestamps"),
    ]
    for i, (tag, name, sub) in enumerate(rows):
        y = top + i * rh
        focal = i == 4
        d.rect(x, y, w, rh, ACCENT_TINT if focal else (WHITE if i % 2 == 0 else PAPER_2),
               ACCENT if focal else RULE, 1)
        d.eyebrow_text(x + 16, y + 36, tag, fill=ACCENT if focal else MUTED, weight=600)
        d.text(x + 56, y + 38, name, size=14, weight=600)
        d.text(x + w - 16, y + 37, sub, size=9, fill=MUTED, font=MONO, anchor="end")
    d.rect(x, top, w, rh * 4, "none", MUTED, 1)
    # left axis
    d.add(f'<line x1="168" y1="{top + 16}" x2="168" y2="{top + rh * 5 - 16}" stroke="{MUTED}" '
          f'stroke-width="1.2" marker-end="{d.marker("arrow")}"/>')
    d.eyebrow_text(156, top + 12, "Stable", anchor="end")
    d.eyebrow_text(156, top + rh * 5 - 8, "Volatile", anchor="end")
    # right bracket over L1-L4
    bx, b0, b1 = x + w + 16, top + 4, top + rh * 4 - 4
    d.add(f'<path d="M {bx} {b0} L {bx + 8} {b0} L {bx + 8} {b1} L {bx} {b1}" fill="none" '
          f'stroke="{MUTED}" stroke-width="1"/>')
    d.eyebrow_text(bx + 20, top + rh * 2 - 2, "Cacheable prefix")
    d.text(bx + 20, top + rh * 2 + 12, "read at the cache rate", size=9, fill=MUTED, font=MONO)
    d.eyebrow_text(bx + 20, top + rh * 4 + 36, "Not reused", fill=ACCENT, weight=600)
    d.text(x, top + rh * 5 + 36,
           "The cache matches an exact prefix. A timestamp in L2 breaks reuse for L2 through L4.",
           size=14, font=SERIF, italic=True, fill=INK)
    d.legend([(d.sw_box("focal"), "Changes every request"), (d.sw_box("backend"), "Reusable layer")],
             note="Stability hierarchy, not a reason to mislabel message roles.")
    return d


# --- 3. Multi-turn cumulative input (line chart) -----------------------------
def multi_turn() -> Diagram:
    d = Diagram("multi-turn-cache-growth", 960, 576, "Line chart · multi-turn cost",
                "Multi-turn input grows quadratically",
                "Cumulative input cost over 20 turns: about 580,000 ordinary-token equivalents without "
                "caching versus about 113,000 with a warm cache.")
    S, h, n = 10_000, 2_000, 20
    raw, cached, tot_r, tot_c = [], [], 0, 0.0
    for t in range(1, n + 1):
        tot_r += S + (t - 1) * h
        # warm cache: read the previous request's prefix, write only the new tokens
        tot_c += S * 1.25 if t == 1 else 0.1 * (S + (t - 2) * h) + 1.25 * h
        raw.append(tot_r)
        cached.append(tot_c)
    assert tot_r == 580_000 and round(tot_c) == 113_200, (tot_r, tot_c)

    x0, x1, y0, y1, vmax = 120, 880, 128, 432, 600_000

    def X(t):
        return round(x0 + (t - 1) * (x1 - x0) / (n - 1), 1)

    def Y(v):
        return round(y1 - v / vmax * (y1 - y0), 1)

    for v in range(0, vmax + 1, 100_000):
        d.add(f'<line x1="{x0}" y1="{Y(v)}" x2="{x1}" y2="{Y(v)}" stroke="{RULE if v else RULE_SOLID}" '
              f'stroke-width="{0.8 if v else 1}"/>')
        d.text(x0 - 12, Y(v) + 3, f"{v // 1000}k", size=9, fill=MUTED, font=MONO, anchor="end")
    for t in (1, 5, 10, 15, 20):
        d.text(X(t), y1 + 16, str(t), size=9, fill=MUTED, font=MONO, anchor="middle")
    d.eyebrow_text(x0 - 40, y0 - 16, "Cumulative input, ordinary-token equivalents")
    d.eyebrow_text(x1, y1 + 32, "User turn →", anchor="end")

    def line(vals, color, sw):
        pts = " ".join(f"{X(t)},{Y(v)}" for t, v in enumerate(vals, 1))
        d.add(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{sw}" '
              f'stroke-linejoin="round"/>')
        d.add(f'<circle cx="{X(n)}" cy="{Y(vals[-1])}" r="3.5" fill="{color}"/>')

    line(raw, MUTED, 1.6)
    line(cached, ACCENT, 2)
    d.text(X(n) + 8, Y(raw[-1]) + 4, "580k", size=11, fill=INK, weight=600)
    d.text(X(n) + 8, Y(cached[-1]) + 4, "113k", size=11, fill=ACCENT, weight=600)
    d.text(X(12) - 8, Y(raw[11]) - 12, "No caching", size=11, fill=MUTED, anchor="end", weight=600)
    d.text(X(12), Y(cached[11]) - 12, "Warm cache every turn", size=11, fill=ACCENT, weight=600,
           anchor="middle")
    bx = X(n) - 16
    d.add(f'<line x1="{bx}" y1="{Y(raw[-1]) + 8}" x2="{bx}" y2="{Y(cached[-1]) - 8}" stroke="{MUTED}" '
          f'stroke-width="1" stroke-dasharray="3,3"/>')
    d.label(bx - 44, round((Y(raw[-1]) + Y(cached[-1])) / 2), "about -80%", fill=ACCENT)
    d.text(x0 - 40, y1 + 56,
           "S = 10,000 stable prefix · h = 2,000 new tokens per turn · reads 0.1× · writes 1.25× · "
           "every turn inside cache lifetime · output excluded",
           size=9, fill=MUTED, font=MONO)
    d.legend([(d.sw_line(MUTED, sw=1.6), "No caching"), (d.sw_line(ACCENT, sw=2), "Warm cache")],
             note="Caching cuts the slope; only compaction or a fresh session resets growth.")
    return d


# --- 4. Token use by workload (bar chart) ------------------------------------
def workload_tokens() -> Diagram:
    d = Diagram("workload-token-multipliers", 960, 400, "Bar chart · workload shape",
                "Agents multiply token use",
                "Anthropic reported agents using about 4 times and multi-agent systems about 15 times "
                "the tokens of chat interactions.")
    rows = [("Chat interaction", 1, "1× baseline"), ("Single agent", 4, "≈ 4×"),
            ("Multi-agent system", 15, "≈ 15×")]
    bx, unit, top = 240, 40, 120
    d.add(f'<line x1="{bx}" y1="{top - 8}" x2="{bx}" y2="{top + 152}" stroke="{RULE_SOLID}" stroke-width="1"/>')
    for i, (name, v, lab) in enumerate(rows):
        y = top + i * 56
        focal = i == 2
        d.text(bx - 16, y + 20, name, size=11, weight=600, anchor="end")
        d.rect(bx, y, v * unit, 32, ACCENT_TINT if focal else WHITE, ACCENT if focal else INK, 1, 2)
        d.text(bx + v * unit + 12, y + 20, lab, size=11, fill=ACCENT if focal else MUTED,
               weight=600 if focal else None, font=MONO)
    d.text(40, top + 196,
           "Source: Anthropic, \u201cHow we built our multi-agent research system\u201d. "
           "Their systems and workloads; not universal multipliers.",
           size=9, fill=MUTED, font=MONO)
    d.legend([(d.sw_box("focal"), "Orchestration / research fan-out"), (d.sw_box("backend"), "Other workload")],
             note="Cost scales with calls × context, not with one call's price.")
    return d


# --- 5. Routing layers (layer stack) -----------------------------------------
def routing_layers() -> Diagram:
    d = Diagram("routing-layers", 960, 576, "Layer stack · model routing",
                "Five different things called routing",
                "Five routing layers from manual model selection to post-answer escalation; only the "
                "last one inspects an answer before deciding.")
    x, w, top, rh = 200, 680, 112, 64
    rows = [
        ("01", "Manual selection", "a person picks the model", "small model for extraction"),
        ("02", "Application-defined routing", "your rules or classifier", "task contract → model tier"),
        ("03", "Semantic model routing", "learned router, before generation",
         "RouteLLM · OpenRouter Auto · Foundry"),
        ("04", "Provider / deployment routing", "same model, different host", "LiteLLM · OpenRouter providers"),
        ("05", "Post-answer escalation", "checks the answer, then escalates", "cascade with a test gate"),
    ]
    for i, (tag, name, sub, ex) in enumerate(rows):
        y = top + i * rh
        focal = i == 4
        d.rect(x, y, w, rh, ACCENT_TINT if focal else (WHITE if i % 2 == 0 else PAPER_2),
               ACCENT if focal else RULE, 1)
        d.eyebrow_text(x + 16, y + 36, tag, fill=ACCENT if focal else MUTED, weight=600)
        d.text(x + 56, y + 28, name, size=14, weight=600)
        d.text(x + 56, y + 46, sub, size=9, fill=MUTED, font=MONO)
        d.text(x + w - 16, y + 37, ex, size=9, fill=INK if focal else MUTED, font=MONO, anchor="end")
    d.add(f'<line x1="168" y1="{top + 16}" x2="168" y2="{top + rh * 5 - 16}" stroke="{MUTED}" '
          f'stroke-width="1.2" marker-end="{d.marker("arrow")}"/>')
    d.eyebrow_text(156, top + 12, "Before", anchor="end")
    d.eyebrow_text(156, top + 24, "answer", anchor="end")
    d.eyebrow_text(156, top + rh * 5 - 20, "After", anchor="end")
    d.eyebrow_text(156, top + rh * 5 - 8, "answer", anchor="end")
    d.text(x, top + rh * 5 + 36,
           "Only layer 05 sees an answer. A timeout fallback is not a quality gate.",
           size=14, font=SERIF, italic=True)
    d.legend([(d.sw_box("focal"), "Decides after an answer"), (d.sw_box("backend"), "Decides before an answer")],
             note="Products can combine layers.")
    return d


# --- 6. Cascade (flowchart) --------------------------------------------------
def cascade() -> Diagram:
    d = Diagram("cascade-flow", 960, 600, "Flowchart · execution shape",
                "Cascade: cheap first, escalate on failure",
                "A cheap model answers first; a deterministic gate accepts the answer or escalates "
                "to a strong model, with the break-even condition for cost.")
    cx = 400
    # arrows first, then labels, then nodes
    d.path([(cx, 160), (cx, 192)])
    d.path([(cx, 240), (cx, 264)])
    d.path([(500, 312), (600, 312)], color=ACCENT, sw=1.4, marker="arrow-accent")
    d.path([(cx, 360), (cx, 400)])
    d.path([(480, 424), (680, 424), (680, 336)])
    d.label(550, 296, "Yes", fill=ACCENT)
    d.label(428, 380, "No")
    d.node(320, 112, 160, 48, "Request", "task + acceptance", kind="external", rx=20)
    d.node(320, 192, 160, 48, "Cheap model answers", "cost: cheap")
    d.diamond(cx, 312, 100, 48, "Gate passes?", "tests · schema")
    d.node(600, 288, 160, 48, "Accept", kind="focal", rx=20)
    d.node(320, 400, 160, 48, "Strong model answers", "cost: strong")
    px, py = 560, 472
    d.eyebrow_text(px, py, "Expected cost")
    d.text(px, py + 16, "cheap + gate + P(escalate) × strong", size=9, font=MONO, fill=INK)
    d.eyebrow_text(px, py + 36, "Beats always-strong only if")
    d.text(px, py + 52, "P(escalate) < 1 − cheap / strong", size=9, font=MONO, fill=INK)
    d.text(40, py + 16, "Example: cheap = 0.10, P = 0.40 → 0.50 of strong, plus the gate.",
           size=9, font=MONO, fill=MUTED)
    d.text(40, py + 44, "A model-based gate is another call.", size=14, font=SERIF, italic=True)
    d.legend([(d.sw_oval, "Start / end"), (d.sw_box("backend"), "Model call"),
              (d.sw_diamond, "Gate"), (d.sw_line(ACCENT, "arrow-accent", sw=1.4), "Cheap path")],
             note="Gate quality decides both savings and quality.")
    return d


# --- 7. Foundry Model Router (flowchart) -------------------------------------
def foundry_router() -> Diagram:
    d = Diagram("foundry-model-router-flow", 960, 720, "Flowchart · Microsoft Foundry",
                "Foundry Model Router: one request",
                "A request to the model-router deployment is filtered to the eligible subset, optionally "
                "uses session affinity, is routed by mode, served, and falls back within the subset on error.")
    cx = 480
    d.path([(cx, 152), (cx, 184)])
    d.path([(cx, 240), (cx, 264)])
    d.path([(580, 312), (680, 312)])
    d.path([(cx, 360), (cx, 400)])
    d.path([(780, 336), (780, 512), (580, 512)])
    d.path([(cx, 448), (cx, 488)])
    d.path([(380, 512), (280, 512)], dash="5,4")
    d.path([(cx, 536), (cx, 576)])
    d.path([(180, 536), (180, 600), (380, 600)], dash="5,4")
    d.label(630, 296, "Yes")
    d.label(536, 380, "No · default")
    d.label(330, 496, "On error")
    d.node(380, 104, 200, 48, "Request", "Chat Completions / Responses", kind="external", rx=20)
    d.node(380, 184, 200, 56, "Eligible subset", "allowlist · capability · region")
    d.diamond(cx, 312, 100, 48, "Affinity set?", "preview · 30 min")
    d.node(680, 288, 200, 48, "Associated model", "tried first, best-effort")
    d.node(380, 400, 200, 48, "Router picks model", "Balanced · Cost · Quality", kind="focal")
    d.node(380, 488, 200, 48, "Serving model", "response.model")
    d.node(80, 488, 200, 48, "Fallback model", "same subset, needs ≥ 2", kind="optional")
    d.node(380, 576, 200, 48, "Response", "+ routing trace (preview)", kind="external", rx=20)
    d.legend([(d.sw_oval, "Start / end"), (d.sw_box("backend"), "Step"), (d.sw_diamond, "Decision"),
              (d.sw_box("focal"), "Trained ML router"), (d.sw_box("optional"), "Fallback")],
             note="Selection is per request unless affinity applies.")
    return d


# --- 8. Progressive disclosure (pyramid) -------------------------------------
def progressive_disclosure() -> Diagram:
    d = Diagram("progressive-disclosure-pyramid", 960, 520, "Pyramid · skills",
                "Progressive disclosure: pay only for what loads",
                "Skill content loads in tiers: metadata for every skill at startup, the body on activation, "
                "references when read, and only script output when scripts run.")
    cx, top, lh = 360, 112, 64
    widths = [96, 208, 320, 432, 544]
    layers = [  # apex -> base
        ("Scripts", "Run, not read", "only stdout/stderr enters context"),
        ("References", "Loaded only when read", "zero tokens until opened"),
        ("SKILL.md body", "Loaded on activation", "then replayed on later turns"),
        ("Name + description", "Loaded at session start", "~100 tokens per skill, every skill"),
    ]
    for i, (name, when, cost) in enumerate(layers):
        y = top + i * lh
        wt, wb = widths[i], widths[i + 1]
        pts = f"{cx - wt / 2},{y} {cx + wt / 2},{y} {cx + wb / 2},{y + lh} {cx - wb / 2},{y + lh}"
        focal = i == 0
        fill = ACCENT_TINT if focal else (WHITE if i % 2 else PAPER_2)
        d.add(f'<polygon points="{pts}" fill="{fill}" stroke="{ACCENT if focal else MUTED}" stroke-width="1"/>')
        d.text(cx, y + lh / 2 + 5, name, size=12, weight=600, anchor="middle")
        mid_edge = cx + (wt + wb) / 4
        d.add(f'<line x1="{mid_edge + 8}" y1="{y + lh / 2}" x2="652" y2="{y + lh / 2}" '
              f'stroke="{RULE_SOLID}" stroke-width="1" stroke-dasharray="2,3"/>')
        d.text(664, y + lh / 2 - 2, when, size=11, weight=600, fill=ACCENT if focal else INK)
        d.text(664, y + lh / 2 + 12, cost, size=9, fill=MUTED, font=MONO)
    d.add(f'<line x1="72" y1="{top + lh * 4 - 8}" x2="72" y2="{top + 8}" stroke="{MUTED}" '
          f'stroke-width="1.2" marker-end="{d.marker("arrow")}"/>')
    d.eyebrow_text(40, top - 4, "Rarely")
    d.eyebrow_text(40, top + lh * 4 + 16, "Always")
    d.text(40, top + lh * 4 + 52, "Keep the base small and specific; push detail up the pyramid.",
           size=14, font=SERIF, italic=True)
    d.text(40, top + lh * 4 + 76,
           "Sources: Agent Skills specification; Anthropic skill docs. Copilot placement is "
           "implementation-specific: inspect with /context.",
           size=9, font=MONO, fill=MUTED)
    d.legend([(d.sw_box("focal"), "Code never enters context"), (d.sw_box("backend"), "Loaded tier")])
    return d


BUILDERS = [cost_levers, cache_layers, multi_turn, workload_tokens, routing_layers, cascade,
            foundry_router, progressive_disclosure]


def contrast(fg: str, bg: str) -> float:
    def lum(hx):
        c = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    a, b = sorted((lum(fg), lum(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


if __name__ == "__main__":
    for tok in (INK, MUTED, ACCENT, LINK):
        ratio = contrast(tok, PAPER)
        assert ratio >= 4.5, f"{tok} contrast {ratio:.2f} < 4.5 on paper"
    for build in BUILDERS:
        print(build().save().name)
