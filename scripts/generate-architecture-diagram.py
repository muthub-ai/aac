# /// script
# requires-python = ">=3.11"
# dependencies = ["diagrams>=0.24", "Pillow>=10.0"]
# ///
"""
Architecture as Code (AAC) Platform — System Architecture Diagram
Hand-crafted, pixel-perfect CTO-grade architecture diagram.

Design: light cluster backgrounds with colored header bars so that
dark-themed icons (most diagrams-library icons are black/dark) remain
clearly visible.  Inspired by AWS / Azure reference-architecture style.
"""
from __future__ import annotations
import os, math
from PIL import Image, ImageDraw, ImageFont

os.chdir("/Users/muthukrishnanbommiah/aac")

# ── Resolve icon base path from the diagrams package ──────────────────
ICON_BASE = os.path.join(
    os.path.dirname(
        os.path.dirname(__import__("diagrams").__file__)
    ),
    "resources",
)

def icon(provider: str, category: str, name: str) -> str:
    return os.path.join(ICON_BASE, provider, category, name)

# ── Canvas ────────────────────────────────────────────────────────────
W, H = 2800, 1250
DPI = 200
BG = (248, 249, 252)  # very light cool gray canvas

# ── Professional Palette ──────────────────────────────────────────────
# Each cluster gets: header_color (solid bar) + body_tint (very light)
DARK      = (40, 48, 58)       # charcoal for text
WHITE     = (255, 255, 255)

# Cluster themes: (header bar, body tint, border)
TH_PERSONA  = ((70,  85, 105), (235, 238, 245), (170, 180, 200))   # slate
TH_GITHUB   = ((36,  41,  47), (232, 234, 238), (160, 165, 175))   # github charcoal
TH_DATA     = ((45,  90, 150), (228, 238, 252), (150, 185, 225))   # blue
TH_TOOLING  = ((95,  60, 130), (240, 232, 250), (180, 160, 210))   # purple
TH_GOV      = ((165, 55,  55), (252, 235, 235), (215, 165, 165))   # red
TH_CI       = ((175, 110, 30), (252, 243, 228), (215, 185, 140))   # amber
TH_WEB      = ((30, 120, 110), (225, 245, 242), (145, 200, 195))   # teal
TH_DEPLOY   = ((55,  85, 130), (230, 237, 248), (160, 180, 210))   # steel

# Arrow / flow colors (medium saturation, legible on light canvas)
C_AMBER  = (185, 120, 30)     # CI/CD
C_BLUE   = (50, 100, 170)     # data flow
C_PURPLE = (110, 60, 150)     # tooling
C_RED    = (180, 55, 55)      # governance
C_TEAL   = (30, 130, 115)     # user interaction
C_STEEL  = (55, 85, 135)      # deployment

# ── Fonts ─────────────────────────────────────────────────────────────
def _font(size, bold=False):
    for name in (
        (["HelveticaNeue-Bold", "Helvetica-Bold"] if bold else ["HelveticaNeue", "Helvetica"])
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    for p in ["/System/Library/Fonts/Helvetica.ttc",
              "/System/Library/Fonts/Supplemental/Arial.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()

FT  = _font(42, True)   # title
FS  = _font(22)          # subtitle
FC  = _font(16, True)    # cluster header
FN  = _font(15)          # node label
FNS = _font(13)          # node label small
FE  = _font(13)          # edge label
FL  = _font(14)          # legend
FLT = _font(15, True)    # legend title

# ── Canvas ────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── Helpers ───────────────────────────────────────────────────────────
def cluster(x1, y1, x2, y2, theme, title, r=12):
    """Draw a cluster box: colored header bar + light body + thin border."""
    hdr_color, body_tint, border = theme
    hdr_h = 34
    # body (rounded)
    draw.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=body_tint,
                           outline=border, width=2)
    # header bar (top portion, clipped by re-drawing rounded top)
    draw.rounded_rectangle([x1, y1, x2, y1+hdr_h+r], radius=r, fill=hdr_color)
    draw.rectangle([x1+1, y1+hdr_h, x2-1, y1+hdr_h+r], fill=body_tint)
    # re-draw side borders that the header might have covered
    draw.line([x1, y1+hdr_h, x1, y1+hdr_h+r], fill=border, width=2)
    draw.line([x2, y1+hdr_h, x2, y1+hdr_h+r], fill=border, width=2)
    # title centered in header
    bb = draw.textbbox((0, 0), title, font=FC)
    tw = bb[2] - bb[0]
    draw.text(((x1+x2)//2 - tw//2, y1 + 8), title, fill=WHITE, font=FC)
    return body_tint  # return body color for icon bg

def put_icon(path, cx, cy, sz, bg):
    """Place an icon with a white circle badge behind it for pop."""
    # white circle badge
    pad = 6
    draw.ellipse([cx-sz//2-pad, cy-sz//2-pad, cx+sz//2+pad, cy+sz//2+pad],
                 fill=WHITE, outline=(220,220,225), width=1)
    if not os.path.exists(path):
        draw.ellipse([cx-sz//2, cy-sz//2, cx+sz//2, cy+sz//2], fill=(200,200,205))
        return
    ic = Image.open(path).convert("RGBA").resize((sz, sz), Image.LANCZOS)
    patch = Image.new("RGB", (sz, sz), WHITE)
    patch.paste(ic, (0, 0), ic)
    img.paste(patch, (cx - sz // 2, cy - sz // 2))

def tcenter(text, cx, cy, font, color=DARK):
    bb = draw.textbbox((0, 0), text, font=font)
    draw.text((cx - (bb[2]-bb[0])//2, cy - (bb[3]-bb[1])//2), text, fill=color, font=font)

def tmulti(lines, cx, cy, font, color=DARK, sp=3):
    mets = [draw.textbbox((0,0), l, font=font) for l in lines]
    sizes = [(b[2]-b[0], b[3]-b[1]) for b in mets]
    th = sum(s[1]+sp for s in sizes) - sp
    y = cy - th // 2
    for i, line in enumerate(lines):
        tw, h = sizes[i]
        draw.text((cx - tw//2, y), line, fill=color, font=font)
        y += h + sp

def _dashed(x1, y1, x2, y2, color, w, dl=10, gl=6):
    dx, dy = x2-x1, y2-y1
    L = math.hypot(dx, dy)
    if L == 0: return
    ux, uy = dx/L, dy/L
    d = 0
    while d < L:
        e = min(d+dl, L)
        draw.line([int(x1+ux*d), int(y1+uy*d), int(x1+ux*e), int(y1+uy*e)],
                  fill=color, width=w)
        d = e + gl

def arr(x1, y1, x2, y2, color=(120,144,156), w=2, label=None, dash=False):
    if dash:
        _dashed(x1, y1, x2, y2, color, w)
    else:
        draw.line([x1, y1, x2, y2], fill=color, width=w)
    a = math.atan2(y2-y1, x2-x1)
    ah, aw_ = 12, 7
    px, py = x2 - ah*math.cos(a), y2 - ah*math.sin(a)
    draw.polygon([(x2,y2),
                  (int(px - aw_*math.sin(a)), int(py + aw_*math.cos(a))),
                  (int(px + aw_*math.sin(a)), int(py - aw_*math.cos(a)))],
                 fill=color)
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        bb = draw.textbbox((0,0), label, font=FE)
        tw, th = bb[2]-bb[0], bb[3]-bb[1]
        p = 4
        draw.rounded_rectangle([mx-tw//2-p, my-th//2-p-1, mx+tw//2+p, my+th//2+p-1],
                               radius=4, fill=WHITE, outline=(210,210,215), width=1)
        draw.text((mx-tw//2, my-th//2-1), label, fill=color, font=FE)


# ══════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════
tcenter("Architecture as Code (AAC) Platform", W//2, 36, FT, DARK)
tcenter("System Architecture", W//2, 74, FS, (110, 115, 125))

LM = 50; RM = W - 50

# ══════════════════════════════════════════════════════════════════════
# ROW 1 — Personas + GitHub  (y: 110..310)
# ══════════════════════════════════════════════════════════════════════
R1 = 115; R1H = 200

# Personas
bg = cluster(LM, R1, LM+400, R1+R1H, TH_PERSONA, "Personas")
put_icon(icon("azure","general","usericon.png"), LM+120, R1+100, 54, bg)
tmulti(["Enterprise","Architect"], LM+120, R1+162, FNS, DARK)
put_icon(icon("azure","general","usericon.png"), LM+300, R1+100, 54, bg)
tmulti(["Developer"], LM+300, R1+162, FNS, DARK)

# GitHub Platform
GH_L = LM + 460
bg = cluster(GH_L, R1, GH_L+840, R1+R1H, TH_GITHUB, "GitHub Platform")
put_icon(icon("onprem","vcs","github.png"), GH_L+140, R1+100, 54, bg)
tmulti(["muthub-ai/aac","Monorepo"], GH_L+140, R1+165, FNS, DARK)
put_icon(icon("onprem","ci","github-actions.png"), GH_L+420, R1+100, 54, bg)
tmulti(["GitHub Actions","9-Stage Pipeline"], GH_L+420, R1+165, FNS, DARK)
put_icon(icon("onprem","network","internet.png"), GH_L+700, R1+100, 54, bg)
tmulti(["Copilot Spaces","RAG Context"], GH_L+700, R1+165, FNS, DARK)

# repo -> actions
arr(GH_L+200, R1+100, GH_L+358, R1+100, C_AMBER, 2, "trigger")

# ══════════════════════════════════════════════════════════════════════
# ROW 2 — Architecture Data Layer  (y: 360..545)
# ══════════════════════════════════════════════════════════════════════
R2 = 360; R2H = 185

bg = cluster(LM, R2, LM+1250, R2+R2H, TH_DATA,
             "Architecture Data Layer  (YAML + JSON Schema Draft 2020-12)")

d_items = [
    (icon("generic","storage","storage.png"),          "4 System Models", "(YAML)"),
    (icon("programming","flowchart","document.png"),   "JSON Schemas",    "(5 schemas)"),
    (icon("generic","database","sql.png"),             "Standards",       "Catalog"),
    (icon("generic","database","sql.png"),             "Patterns",        "Catalog"),
    (icon("generic","database","sql.png"),             "Waivers",         "Registry"),
]
for i, (ic, l1, l2) in enumerate(d_items):
    cx = LM + 130 + i * 240
    put_icon(ic, cx, R2+90, 48, bg)
    tmulti([l1, l2], cx, R2+145, FNS, DARK)

# ══════════════════════════════════════════════════════════════════════
# ROW 3 — Dev Tooling + Governance  (y: 590..810)
# ══════════════════════════════════════════════════════════════════════
R3 = 590; R3H = 225

# Developer Tooling
bg = cluster(LM, R3, LM+700, R3+R3H, TH_TOOLING,
             "Developer Tooling  (npm Packages)")

t_items = [
    (icon("programming","language","bash.png"),       "aac CLI",
     "@muthub-ai/aac", "validate / init / create"),
    (icon("onprem","compute","server.png"),            "MCP Server",
     "@muthub-ai/", "aac-mcp-server"),
    (icon("programming","language","typescript.png"),   "IDE Integration",
     "Cursor / VS Code", "Claude Desktop"),
]
for i, (ic, l1, l2, l3) in enumerate(t_items):
    cx = LM + 130 + i * 230
    put_icon(ic, cx, R3+100, 48, bg)
    tmulti([l1, l2, l3], cx, R3+168, FNS, DARK)

# MCP -> IDE arrow
arr(LM+130+230+40, R3+100, LM+130+460-40, R3+100, C_PURPLE, 2)

# Governance Engine
GOV_L = LM + 760
bg = cluster(GOV_L, R3, GOV_L+540, R3+R3H, TH_GOV,
             "Governance Engine  (OPA / Rego)")

g_items = [
    (icon("onprem","security","vault.png"),     "Policy",      "Engine"),
    (icon("generic","network","firewall.png"),  "Security",    "(KMS)"),
    (icon("generic","network","switch.png"),    "Integration", "(API GW)"),
    (icon("generic","compute","rack.png"),      "FinOps",      "(Rightsizing)"),
]
for i, (ic, l1, l2) in enumerate(g_items):
    cx = GOV_L + 80 + i * 130
    put_icon(ic, cx, R3+100, 44, bg)
    tmulti([l1, l2], cx, R3+155, FNS, DARK)

# Policy -> sub-policies
arr(GOV_L+80+40, R3+100, GOV_L+80+130-30, R3+100, C_RED, 2)

# ══════════════════════════════════════════════════════════════════════
# ROW 4 — CI + Web App + Deployment  (y: 865..1090)
# ══════════════════════════════════════════════════════════════════════
R4 = 865; R4H = 220

# CI Pipeline
bg = cluster(LM, R4, LM+780, R4+R4H, TH_CI,
             "CI/CD Pipeline  (GitHub Actions - 9 Stages)")

ci = [
    (icon("onprem","ci","github-actions.png"), "1  Lint & Test",   "ESLint + 436 Vitest"),
    (icon("onprem","ci","github-actions.png"), "2a-d  Validate",   "Schema + Compliance"),
    (icon("onprem","ci","github-actions.png"), "2e  Policy",       "OPA Checks"),
    (icon("onprem","ci","github-actions.png"), "3  Assemble",      "Microsite"),
]
for i, (ic, l1, l2) in enumerate(ci):
    cx = LM + 110 + i * 175
    put_icon(ic, cx, R4+100, 44, bg)
    tmulti([l1, l2], cx, R4+158, FNS, DARK)

# Internal CI flow arrows
for sx, ex, dy in [(0,1,0), (1,2,0), (2,3,0)]:
    x1 = LM+110+sx*175+38; x2 = LM+110+ex*175-38
    arr(x1, R4+100+dy, x2, R4+100+dy, C_AMBER, 2)

# Web Application
WEB_L = LM + 840
bg = cluster(WEB_L, R4, WEB_L+660, R4+R4H, TH_WEB,
             "Web Application  (Next.js 16 + React 19)")

w_items = [
    (icon("programming","framework","nextjs.png"),  "Dashboard",     "App Router"),
    (icon("programming","framework","react.png"),   "React Flow",    "C4 Diagrams"),
    (icon("programming","flowchart","action.png"),  "Export Engine",  "PlantUML / Draw.io"),
]
for i, (ic, l1, l2) in enumerate(w_items):
    cx = WEB_L + 120 + i * 220
    put_icon(ic, cx, R4+100, 48, bg)
    tmulti([l1, l2], cx, R4+160, FNS, DARK)

arr(WEB_L+120+45, R4+100, WEB_L+120+220-45, R4+100, C_TEAL, 2)
arr(WEB_L+120+220+45, R4+100, WEB_L+120+440-45, R4+100, C_TEAL, 2)

# Deployment
DEP_L = LM + 1560
bg = cluster(DEP_L, R4, RM, R4+R4H, TH_DEPLOY, "Deployment Targets")

dep = [
    (icon("programming","framework","vercel.png"),   "Vercel",        "Dashboard App"),
    (icon("generic","place","datacenter.png"),        "GitHub Pages",  "Doc Microsite"),
]
for i, (ic, l1, l2) in enumerate(dep):
    cx = DEP_L + 140 + i * 360
    put_icon(ic, cx, R4+100, 48, bg)
    tmulti([l1, l2], cx, R4+160, FN, DARK)


# ══════════════════════════════════════════════════════════════════════
# INTER-TIER ARROWS
# ══════════════════════════════════════════════════════════════════════

# 1. Architect -> Repo
arr(LM+160, R1+R1H+5, GH_L+110, R2-10, C_AMBER, 3, "author models")

# 2. Developer -> Repo
arr(LM+330, R1+R1H+5, GH_L+170, R2-10, C_AMBER, 3, "commit code")

# 3. Repo -> Data Layer
arr(GH_L+200, R1+R1H+5, LM+625, R2-5, C_BLUE, 3, "store YAML")

# 4. Models -> CLI
arr(LM+130, R2+R2H+5, LM+130, R3-5, C_PURPLE, 2, "validate")

# 5. Models -> MCP
arr(LM+250, R2+R2H+5, LM+360, R3-5, C_PURPLE, 2)

# 6. Models -> Policy Engine
arr(LM+900, R2+R2H+5, GOV_L+80, R3-5, C_RED, 3, "enforce")

# 7. CLI -> Schemas (dashed)
arr(LM+200, R3-5, LM+310, R2+R2H+5, C_PURPLE, 2, "schema check", dash=True)

# 8. Copilot -> IDE (dashed)
arr(GH_L+700, R1+R1H+5, LM+590, R3-5, C_PURPLE, 2, "RAG context", dash=True)

# 9. Actions -> CI Pipeline
arr(GH_L+420, R1+R1H+5, LM+390, R4-5, C_AMBER, 3, "run pipeline")

# 10. Models -> Web App
arr(LM+1100, R2+R2H+5, WEB_L+180, R4-5, C_BLUE, 3, "parse & render")

# 11. Web App -> Vercel (dashed)
arr(WEB_L+660+5, R4+105, DEP_L-5, R4+105, C_STEEL, 2, "deploy", dash=True)

# 12. CI Assemble -> GH Pages
arr(LM+110+3*175, R4+R4H+10, DEP_L+500, R4+R4H+10, C_AMBER, 3, "publish microsite")

# 13. Developer -> CLI (dashed)
arr(LM+300, R1+R1H+5, LM+130, R3-10, C_PURPLE, 2, "CLI / IDE", dash=True)


# ══════════════════════════════════════════════════════════════════════
# LEGEND (top-right)
# ══════════════════════════════════════════════════════════════════════
LX = W - 530; LY = R1
LW_, LH_ = 480, 215
draw.rounded_rectangle([LX, LY, LX+LW_, LY+LH_], radius=10,
                       fill=WHITE, outline=(200,200,210), width=2)
tcenter("Legend", LX+LW_//2, LY+18, FLT, DARK)

legend = [
    (C_AMBER,  "solid",  "CI/CD & Pipeline Flow"),
    (C_BLUE,   "solid",  "Data Flow (YAML / Parse)"),
    (C_PURPLE, "solid",  "Developer Tooling Flow"),
    (C_RED,    "solid",  "Governance / Policy Enforcement"),
    (C_TEAL,   "dash",   "User Interaction"),
    (C_STEEL,  "dash",   "Deployment"),
]
for i, (color, style, label) in enumerate(legend):
    y = LY + 44 + i * 27
    if style == "dash":
        _dashed(LX+16, y+7, LX+52, y+7, color, 2)
    else:
        draw.line([LX+16, y+7, LX+52, y+7], fill=color, width=2)
    draw.polygon([(LX+52, y+7), (LX+44, y+3), (LX+44, y+11)], fill=color)
    draw.text((LX+60, y), label, fill=DARK, font=FL)


# ══════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════
footer = "muthub-ai/aac  |  Next.js 16 + React 19 + TypeScript + Zustand  |  OPA Rego  |  GitHub Actions  |  Vercel + GitHub Pages"
tcenter(footer, W//2, H-30, FNS, (160,165,175))

# ── Save ──────────────────────────────────────────────────────────────
os.makedirs("docs", exist_ok=True)
img.save("docs/aac-architecture.png", dpi=(DPI, DPI), quality=95)
print(f"Done -> docs/aac-architecture.png  ({W}x{H} @ {DPI} DPI)")
