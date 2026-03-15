# /// script
# requires-python = ">=3.11"
# dependencies = ["diagrams>=0.24", "Pillow>=10.0"]
# ///
"""
Architecture as Code (AAC) Platform — System Architecture Diagram

3-column layout with routing corridors so that no arrow crosses a box.
White cluster bodies so icon white edges blend in seamlessly.
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
W, H = 2800, 1080
DPI = 200
BG = (246, 248, 252)

# ── Palette ───────────────────────────────────────────────────────────
DARK  = (40, 48, 58)
WHITE = (255, 255, 255)

# Cluster themes: (header_bar, body=WHITE, border)
TH_PERSONA = ((70,  85, 105), WHITE, (180, 190, 205))
TH_GITHUB  = ((36,  41,  47), WHITE, (170, 175, 185))
TH_DATA    = ((45,  90, 150), WHITE, (155, 190, 230))
TH_TOOL    = ((95,  60, 130), WHITE, (185, 165, 215))
TH_GOV     = ((165, 55,  55), WHITE, (220, 170, 170))
TH_CI      = ((175, 110, 30), WHITE, (220, 190, 145))
TH_WEB     = ((30, 120, 110), WHITE, (150, 205, 200))
TH_DEPLOY  = ((55,  85, 130), WHITE, (165, 185, 215))

# Arrow colors
C_AMBER  = (185, 120, 30)
C_BLUE   = (50, 100, 170)
C_PURPLE = (110, 60, 150)
C_RED    = (180, 55, 55)
C_TEAL   = (30, 130, 115)
C_STEEL  = (55, 85, 135)

# ── Fonts ─────────────────────────────────────────────────────────────
def _font(size, bold=False):
    for name in (["HelveticaNeue-Bold", "Helvetica-Bold"] if bold
                 else ["HelveticaNeue", "Helvetica"]):
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

FT  = _font(42, True)
FS  = _font(22)
FC  = _font(16, True)
FN  = _font(15)
FNS = _font(13)
FE  = _font(13)
FL  = _font(14)
FLT = _font(15, True)

# ── Canvas ────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── Helpers ───────────────────────────────────────────────────────────
def cluster(x1, y1, x2, y2, theme, title, r=12):
    hdr_color, body, border = theme
    hdr_h = 34
    draw.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=body,
                           outline=border, width=2)
    draw.rounded_rectangle([x1, y1, x2, y1+hdr_h+r], radius=r,
                           fill=hdr_color)
    draw.rectangle([x1+1, y1+hdr_h, x2-1, y1+hdr_h+r], fill=body)
    draw.line([x1, y1+hdr_h, x1, y1+hdr_h+r], fill=border, width=2)
    draw.line([x2, y1+hdr_h, x2, y1+hdr_h+r], fill=border, width=2)
    bb = draw.textbbox((0,0), title, font=FC)
    tw = bb[2]-bb[0]
    draw.text(((x1+x2)//2-tw//2, y1+8), title, fill=WHITE, font=FC)

def put_icon(path, cx, cy, sz):
    if not os.path.exists(path):
        draw.ellipse([cx-sz//2, cy-sz//2, cx+sz//2, cy+sz//2],
                     fill=(220,220,225))
        return
    ic = Image.open(path).convert("RGBA").resize((sz, sz), Image.LANCZOS)
    patch = Image.new("RGB", (sz, sz), WHITE)
    patch.paste(ic, (0, 0), ic)
    img.paste(patch, (cx-sz//2, cy-sz//2))

def tcenter(text, cx, cy, font, color=DARK):
    bb = draw.textbbox((0,0), text, font=font)
    draw.text((cx-(bb[2]-bb[0])//2, cy-(bb[3]-bb[1])//2), text,
              fill=color, font=font)

def tmulti(lines, cx, cy, font, color=DARK, sp=3):
    mets = [draw.textbbox((0,0), l, font=font) for l in lines]
    sizes = [(b[2]-b[0], b[3]-b[1]) for b in mets]
    th = sum(s[1]+sp for s in sizes) - sp
    y = cy - th//2
    for i, line in enumerate(lines):
        tw, h = sizes[i]
        draw.text((cx-tw//2, y), line, fill=color, font=font)
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

def _arrowhead(x, y, angle, color, ah=12, aw=7):
    px, py = x - ah*math.cos(angle), y - ah*math.sin(angle)
    draw.polygon([(x,y),
                  (int(px-aw*math.sin(angle)), int(py+aw*math.cos(angle))),
                  (int(px+aw*math.sin(angle)), int(py-aw*math.cos(angle)))],
                 fill=color)

def _label_at(mx, my, label, color):
    bb = draw.textbbox((0,0), label, font=FE)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    p = 4
    draw.rounded_rectangle([mx-tw//2-p, my-th//2-p-1,
                            mx+tw//2+p, my+th//2+p-1],
                           radius=4, fill=WHITE, outline=(210,210,215), width=1)
    draw.text((mx-tw//2, my-th//2-1), label, fill=color, font=FE)

def arr(x1, y1, x2, y2, color=(120,144,156), w=2, label=None, dash=False):
    if dash:
        _dashed(x1, y1, x2, y2, color, w)
    else:
        draw.line([x1, y1, x2, y2], fill=color, width=w)
    _arrowhead(x2, y2, math.atan2(y2-y1, x2-x1), color)
    if label:
        _label_at((x1+x2)//2, (y1+y2)//2, label, color)

def polyarr(pts, color, w=2, label=None, label_seg=0, dash=False):
    """Multi-segment arrow.  Arrowhead on last segment only."""
    for i in range(len(pts)-1):
        x1, y1 = pts[i]; x2, y2 = pts[i+1]
        if dash:
            _dashed(x1, y1, x2, y2, color, w)
        else:
            draw.line([x1, y1, x2, y2], fill=color, width=w)
        if i == len(pts)-2:
            _arrowhead(x2, y2, math.atan2(y2-y1, x2-x1), color)
        if label and i == label_seg:
            _label_at((x1+x2)//2, (y1+y2)//2, label, color)


# ══════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════
tcenter("Architecture as Code (AAC) Platform", W//2, 36, FT, DARK)
tcenter("System Architecture", W//2, 74, FS, (110, 115, 125))

# ══════════════════════════════════════════════════════════════════════
# LAYOUT — Three rows, three columns, with routing corridors
#
#  Row 1:  Personas | GitHub Platform              | Legend
#  Row 2:  Dev Tooling | Data Layer | Governance
#  Row 3:  CI Pipeline | Web App    | Deployment
#
#  Vertical corridor between Dev Tooling & Data Layer (col 1-2 gap)
#  lets the Actions→CI arrow route cleanly without crossing boxes.
# ══════════════════════════════════════════════════════════════════════

R1 = 100; R1H = 195   # row 1 top / height
R2 = 370; R2H = 220   # row 2  (75px gap from row 1)
R3 = 650; R3H = 210   # row 3  (60px gap from row 2)

# ── Row 1 boxes ──
PERS_L = 60;  PERS_R = 430
GH_L   = 500; GH_R   = 1600

# ── Row 2 boxes ──
TOOL_L = 60;   TOOL_R = 640     # Dev Tooling
DATA_L = 740;  DATA_R = 1600    # Data Layer
GOV_L  = 1680; GOV_R  = 2260    # Governance

# ── Row 3 boxes ──
CI_L  = 60;   CI_R  = 780
WEB_L = 860;  WEB_R = 1500
DEP_L = 1580; DEP_R = 2200

# Corridor between Tooling & Data: x = 640..740  (center 690)
CORR_X = 690


# ══════════════════════════════════════════════════════════════════════
# ROW 1 — Personas + GitHub
# ══════════════════════════════════════════════════════════════════════

cluster(PERS_L, R1, PERS_R, R1+R1H, TH_PERSONA, "Personas")
put_icon(icon("azure","general","usericon.png"), 165, R1+95, 52)
tmulti(["Enterprise","Architect"], 165, R1+155, FNS)
put_icon(icon("azure","general","usericon.png"), 330, R1+95, 52)
tmulti(["Developer"], 330, R1+155, FNS)

cluster(GH_L, R1, GH_R, R1+R1H, TH_GITHUB, "GitHub Platform")
put_icon(icon("onprem","vcs","github.png"), 680, R1+95, 52)
tmulti(["muthub-ai/aac","Monorepo"], 680, R1+160, FNS)
put_icon(icon("onprem","ci","github-actions.png"), 1000, R1+95, 52)
tmulti(["GitHub Actions","9-Stage Pipeline"], 1000, R1+160, FNS)
put_icon(icon("onprem","network","internet.png"), 1350, R1+95, 52)
tmulti(["Copilot Spaces","RAG Context"], 1350, R1+160, FNS)

# repo → actions (inside GitHub)
arr(735, R1+95, 940, R1+95, C_AMBER, 2, "trigger")


# ══════════════════════════════════════════════════════════════════════
# ROW 2 — Dev Tooling | Data Layer | Governance   (side-by-side)
# ══════════════════════════════════════════════════════════════════════

cluster(TOOL_L, R2, TOOL_R, R2+R2H, TH_TOOL,
        "Developer Tooling  (npm Packages)")
put_icon(icon("programming","language","bash.png"), 170, R2+95, 46)
tmulti(["aac CLI","@muthub-ai/aac","validate / init / create"], 170, R2+162, FNS)
put_icon(icon("onprem","compute","server.png"), 350, R2+95, 46)
tmulti(["MCP Server","@muthub-ai/","aac-mcp-server"], 350, R2+162, FNS)
put_icon(icon("programming","language","typescript.png"), 530, R2+95, 46)
tmulti(["IDE Integration","Cursor / VS Code","Claude Desktop"], 530, R2+162, FNS)
# MCP → IDE
arr(405, R2+95, 475, R2+95, C_PURPLE, 2)

cluster(DATA_L, R2, DATA_R, R2+R2H, TH_DATA,
        "Architecture Data Layer  (YAML + JSON Schema Draft 2020-12)")
d_items = [
    (icon("generic","storage","storage.png"),        "4 System Models", "(YAML)"),
    (icon("programming","flowchart","document.png"), "JSON Schemas",    "(5 schemas)"),
    (icon("generic","database","sql.png"),           "Standards",       "Catalog"),
    (icon("generic","database","sql.png"),           "Patterns",        "Catalog"),
    (icon("generic","database","sql.png"),           "Waivers",         "Registry"),
]
for i, (ic, l1, l2) in enumerate(d_items):
    cx = 820 + i * 170
    put_icon(ic, cx, R2+90, 44)
    tmulti([l1, l2], cx, R2+145, FNS)

cluster(GOV_L, R2, GOV_R, R2+R2H, TH_GOV,
        "Governance Engine  (OPA / Rego)")
g_items = [
    (icon("onprem","security","vault.png"),    "Policy",      "Engine"),
    (icon("generic","network","firewall.png"), "Security",    "(KMS)"),
    (icon("generic","network","switch.png"),   "Integration", "(API GW)"),
    (icon("generic","compute","rack.png"),     "FinOps",      "(Rightsizing)"),
]
for i, (ic, l1, l2) in enumerate(g_items):
    cx = 1760 + i * 130
    put_icon(ic, cx, R2+95, 42)
    tmulti([l1, l2], cx, R2+152, FNS)
arr(1800, R2+95, 1850, R2+95, C_RED, 2)


# ══════════════════════════════════════════════════════════════════════
# ROW 3 — CI Pipeline | Web App | Deployment
# ══════════════════════════════════════════════════════════════════════

cluster(CI_L, R3, CI_R, R3+R3H, TH_CI,
        "CI/CD Pipeline  (GitHub Actions - 9 Stages)")
ci = [
    (icon("onprem","ci","github-actions.png"), "1  Lint & Test",   "ESLint + 436 Vitest"),
    (icon("onprem","ci","github-actions.png"), "2a-d  Validate",   "Schema + Compliance"),
    (icon("onprem","ci","github-actions.png"), "2e  Policy",       "OPA Checks"),
    (icon("onprem","ci","github-actions.png"), "3  Assemble",      "Microsite"),
]
for i, (ic, l1, l2) in enumerate(ci):
    cx = 145 + i * 170
    put_icon(ic, cx, R3+90, 42)
    tmulti([l1, l2], cx, R3+148, FNS)
for i in range(3):
    arr(145+i*170+36, R3+90, 145+(i+1)*170-36, R3+90, C_AMBER, 2)

cluster(WEB_L, R3, WEB_R, R3+R3H, TH_WEB,
        "Web Application  (Next.js 16 + React 19)")
w_items = [
    (icon("programming","framework","nextjs.png"), "Dashboard",    "App Router"),
    (icon("programming","framework","react.png"),  "React Flow",   "C4 Diagrams"),
    (icon("programming","flowchart","action.png"), "Export Engine", "PlantUML / Draw.io"),
]
for i, (ic, l1, l2) in enumerate(w_items):
    cx = 960 + i * 200
    put_icon(ic, cx, R3+90, 46)
    tmulti([l1, l2], cx, R3+150, FNS)
arr(960+42, R3+90, 1160-42, R3+90, C_TEAL, 2)
arr(1160+42, R3+90, 1360-42, R3+90, C_TEAL, 2)

cluster(DEP_L, R3, DEP_R, R3+R3H, TH_DEPLOY, "Deployment Targets")
put_icon(icon("programming","framework","vercel.png"), 1720, R3+90, 46)
tmulti(["Vercel","Dashboard App"], 1720, R3+150, FNS)
put_icon(icon("generic","place","datacenter.png"), 2060, R3+90, 46)
tmulti(["GitHub Pages","Doc Microsite"], 2060, R3+150, FNS)


# ══════════════════════════════════════════════════════════════════════
# ARROWS — all carefully routed to avoid crossing any box
# ══════════════════════════════════════════════════════════════════════

R1B = R1 + R1H   # row 1 bottom  (295)
R2T = R2          # row 2 top     (370)
R2B = R2 + R2H   # row 2 bottom  (590)
R3T = R3          # row 3 top     (650)
R3B = R3 + R3H   # row 3 bottom  (860)

# Gap routing y-levels  (75px gap between rows 1-2 = y 295..370)
GAP1_HI  = R1B + 15   # y=310  — polyline routing (RAG, run pipeline)
GAP1_MID = R1B + 30   # y=325  — run pipeline horizontal
GAP2_Y   = (R2B + R3T) // 2   # y=620  — gap between rows 2-3

# ── Row 1 → Row 2 (diagonal arrows fan out through the 75px gap) ─────

# 1. Architect → Data Layer  "author models"
arr(165, R1B+4, 860, R2T-4, C_AMBER, 3, "author models")

# 2. Developer → Data Layer  "commit code"
arr(330, R1B+4, 1100, R2T-4, C_AMBER, 3, "commit code")

# 3. Repo → Data Layer  "store YAML"
arr(680, R1B+4, 1350, R2T-4, C_BLUE, 3, "store YAML")

# 4. Developer → CLI  "CLI / IDE" (dashed, short diagonal far-left)
arr(280, R1B+4, 170, R2T-4, C_PURPLE, 2, "CLI / IDE", dash=True)

# 5. Copilot → IDE  "RAG context" (dashed polyline, upper band of gap)
polyarr([(1350, R1B+4), (1350, GAP1_HI), (530, GAP1_HI), (530, R2T+55)],
        C_PURPLE, 2, "RAG context", label_seg=1, dash=True)

# ── Row 2 horizontal (same-row connections in gaps between boxes) ─────

# 6. Data Layer → CLI  "validate"  (← leftward)
arr(DATA_L-5, R2+80, TOOL_R+5, R2+80, C_PURPLE, 2, "validate")

# 7. Data Layer → MCP  (← leftward, no label)
arr(DATA_L-5, R2+115, TOOL_R+5, R2+115, C_PURPLE, 2)

# 8. CLI → Schemas  "schema check" (→ rightward, dashed)
arr(TOOL_R+5, R2+150, DATA_L-5, R2+150, C_PURPLE, 2, "schema check",
    dash=True)

# 9. Data Layer → Governance  "enforce"  (→ rightward)
arr(DATA_R+5, R2+100, GOV_L-5, R2+100, C_RED, 3, "enforce")

# ── Row 2 → Row 3  (through 60px gap, no boxes between) ──────────────

# 10. Data Layer → Web App  "parse & render"
arr(1160, R2B+4, 1160, R3T-4, C_BLUE, 3, "parse & render")

# ── Row 1 → Row 3  (long-span, routed through corridor) ──────────────

# 11. Actions → CI Pipeline  "run pipeline"
#     Route: Actions ↓ → corridor between Tooling & Data ↓ → gap2 → CI
polyarr([(1000, R1B+4), (1000, GAP1_MID), (CORR_X, GAP1_MID),
         (CORR_X, GAP2_Y), (420, GAP2_Y), (420, R3T-4)],
        C_AMBER, 3, "run pipeline", label_seg=3)

# ── Row 3 horizontal ─────────────────────────────────────────────────

# 12. Web App → Vercel  "deploy" (dashed)
arr(WEB_R+5, R3+100, DEP_L-5, R3+100, C_STEEL, 2, "deploy", dash=True)

# 13. CI Assemble → GH Pages  "publish microsite"  (polyline below boxes)
polyarr([(655, R3B+4), (655, R3B+25), (2060, R3B+25), (2060, R3B+4)],
        C_AMBER, 3, "publish microsite", label_seg=1)


# ══════════════════════════════════════════════════════════════════════
# LEGEND
# ══════════════════════════════════════════════════════════════════════
LX = 2320; LY = R1; LW_ = 430; LH_ = 210
draw.rounded_rectangle([LX, LY, LX+LW_, LY+LH_], radius=10,
                       fill=WHITE, outline=(200,200,210), width=2)
tcenter("Legend", LX+LW_//2, LY+18, FLT, DARK)

legend = [
    (C_AMBER,  "solid", "CI/CD & Pipeline Flow"),
    (C_BLUE,   "solid", "Data Flow (YAML / Parse)"),
    (C_PURPLE, "solid", "Developer Tooling Flow"),
    (C_RED,    "solid", "Governance / Policy Enforcement"),
    (C_TEAL,   "dash",  "User Interaction"),
    (C_STEEL,  "dash",  "Deployment"),
]
for i, (color, style, label) in enumerate(legend):
    y = LY + 44 + i * 27
    if style == "dash":
        _dashed(LX+16, y+7, LX+52, y+7, color, 2)
    else:
        draw.line([LX+16, y+7, LX+52, y+7], fill=color, width=2)
    _arrowhead(LX+52, y+7, 0, color, ah=8, aw=5)
    draw.text((LX+60, y), label, fill=DARK, font=FL)


# ══════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════
footer = ("muthub-ai/aac  |  Next.js 16 + React 19 + TypeScript + Zustand"
          "  |  OPA Rego  |  GitHub Actions  |  Vercel + GitHub Pages")
tcenter(footer, W//2, H-25, FNS, (160,165,175))

# ── Save ──────────────────────────────────────────────────────────────
os.makedirs("docs", exist_ok=True)
img.save("docs/aac-architecture.png", dpi=(DPI, DPI), quality=95)
print(f"Done -> docs/aac-architecture.png  ({W}x{H} @ {DPI} DPI)")
