# /// script
# requires-python = ">=3.11"
# dependencies = ["diagrams>=0.24", "Pillow>=10.0"]
# ///
"""
Architecture as Code (AAC) Platform — System Architecture Diagram
Hand-crafted, pixel-perfect CTO-grade architecture diagram using
official cloud-provider icons and precise layout control.
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
W, H = 2800, 1200
DPI = 200
BG_COLOR = (255, 255, 255)

# ── Palette ───────────────────────────────────────────────────────────
DARK       = (35, 47, 62)
GITHUB_BG  = (22, 27, 34)
NAVY       = (13, 71, 161)
PURPLE     = (106, 27, 154)
RED        = (198, 40, 40)
ORANGE     = (230, 81, 0)
TEAL       = (0, 121, 107)
DEPLOY_BL  = (21, 101, 192)
WHITE      = (255, 255, 255)
LGRAY      = (245, 245, 245)

C_ORANGE = (255, 153, 0)
C_BLUE   = (26, 115, 232)
C_PURPLE = (106, 27, 154)
C_RED    = (198, 40, 40)
C_TEAL   = (0, 150, 136)
C_NAVY   = (21, 101, 192)

# ── Fonts ─────────────────────────────────────────────────────────────
def _font(size, bold=False):
    for name in (
        (["HelveticaNeue-Bold", "Helvetica-Bold"] if bold else ["HelveticaNeue", "Helvetica"])
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    for p in ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                pass
    return ImageFont.load_default()

FT  = _font(40, True)   # title
FS  = _font(22)          # subtitle
FC  = _font(18, True)    # cluster header
FN  = _font(15)          # node label
FNS = _font(13)          # node label small
FE  = _font(13)          # edge label
FL  = _font(14)          # legend
FLT = _font(15, True)    # legend title

# ── Canvas ────────────────────────────────────────────────────────────
img = Image.new("RGB", (W, H), BG_COLOR)
draw = ImageDraw.Draw(img)

# ── Helpers ───────────────────────────────────────────────────────────
def rrect(x1, y1, x2, y2, fill, r=14, outline=None, ow=2):
    draw.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=fill, outline=outline or fill, width=ow)

def put_icon(path, cx, cy, sz, bg):
    if not os.path.exists(path):
        draw.ellipse([cx-sz//2, cy-sz//2, cx+sz//2, cy+sz//2], fill=(180,180,180))
        return
    ic = Image.open(path).convert("RGBA").resize((sz, sz), Image.LANCZOS)
    patch = Image.new("RGB", (sz, sz), bg)
    patch.paste(ic, (0, 0), ic)
    img.paste(patch, (cx - sz // 2, cy - sz // 2))

def tcenter(text, cx, cy, font, color=DARK):
    bb = draw.textbbox((0, 0), text, font=font)
    draw.text((cx - (bb[2]-bb[0])//2, cy - (bb[3]-bb[1])//2), text, fill=color, font=font)

def tmulti(lines, cx, cy, font, color=DARK, sp=3):
    mets = [(draw.textbbox((0,0),l,font=font)) for l in lines]
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
        draw.line([int(x1+ux*d), int(y1+uy*d), int(x1+ux*e), int(y1+uy*e)], fill=color, width=w)
        d = e + gl

def arr(x1, y1, x2, y2, color=(120,144,156), w=2, label=None, dash=False):
    if dash:
        _dashed(x1, y1, x2, y2, color, w)
    else:
        draw.line([x1, y1, x2, y2], fill=color, width=w)
    a = math.atan2(y2-y1, x2-x1)
    ah, aw_ = 12, 7
    px, py = x2 - ah*math.cos(a), y2 - ah*math.sin(a)
    draw.polygon([(x2,y2), (int(px - aw_*math.sin(a)), int(py + aw_*math.cos(a))),
                  (int(px + aw_*math.sin(a)), int(py - aw_*math.cos(a)))], fill=color)
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        bb = draw.textbbox((0,0), label, font=FE)
        tw, th = bb[2]-bb[0], bb[3]-bb[1]
        p = 3
        draw.rounded_rectangle([mx-tw//2-p, my-th//2-p-1, mx+tw//2+p, my+th//2+p-1], radius=3, fill=WHITE)
        draw.text((mx-tw//2, my-th//2-1), label, fill=color, font=FE)


# ══════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════
tcenter("Architecture as Code (AAC) Platform", W//2, 35, FT, DARK)
tcenter("System Architecture", W//2, 72, FS, (100,100,100))

# Layout constants
LM = 50       # left margin
RM = W - 50   # right margin
MW = RM - LM  # available width

# ══════════════════════════════════════════════════════════════════════
# ROW 1 — Personas + GitHub  (y: 110..310)
# ══════════════════════════════════════════════════════════════════════
R1 = 110; R1H = 200

# Personas
rrect(LM, R1, LM+400, R1+R1H, DARK)
tcenter("Personas", LM+200, R1+22, FC, WHITE)
put_icon(icon("onprem","client","user.png"), LM+120, R1+90, 56, DARK)
tmulti(["Enterprise","Architect"], LM+120, R1+150, FNS, WHITE)
put_icon(icon("onprem","client","user.png"), LM+300, R1+90, 56, DARK)
tmulti(["Developer"], LM+300, R1+150, FNS, WHITE)

# GitHub Platform
GH_L = LM + 460
rrect(GH_L, R1, GH_L+840, R1+R1H, GITHUB_BG)
tcenter("GitHub Platform", GH_L+420, R1+22, FC, WHITE)
# repo
put_icon(icon("onprem","vcs","github.png"), GH_L+140, R1+90, 56, GITHUB_BG)
tmulti(["muthub-ai/aac","Monorepo"], GH_L+140, R1+155, FNS, WHITE)
# actions
put_icon(icon("onprem","ci","github-actions.png"), GH_L+420, R1+90, 56, GITHUB_BG)
tmulti(["GitHub Actions","9-Stage Pipeline"], GH_L+420, R1+155, FNS, WHITE)
# copilot
put_icon(icon("aws","integration","appsync.png"), GH_L+700, R1+90, 56, GITHUB_BG)
tmulti(["Copilot Spaces","RAG Context"], GH_L+700, R1+155, FNS, WHITE)

# repo → actions (inside github cluster)
arr(GH_L+195, R1+90, GH_L+360, R1+90, C_ORANGE, 2, "trigger")

# ══════════════════════════════════════════════════════════════════════
# ROW 2 — Architecture Data Layer  (y: 350..540)
# ══════════════════════════════════════════════════════════════════════
R2 = 350; R2H = 190

rrect(LM, R2, LM+1250, R2+R2H, NAVY)
tcenter("Architecture Data Layer  (YAML + JSON Schema Draft 2020-12)", LM+625, R2+22, FC, WHITE)

d_items = [
    (icon("aws","storage","simple-storage-service-s3.png"), "4 System Models", "(YAML)"),
    (icon("aws","management","config.png"), "JSON Schemas", "(5 schemas)"),
    (icon("aws","general","generic-database.png"), "Standards", "Catalog"),
    (icon("aws","general","generic-database.png"), "Patterns", "Catalog"),
    (icon("aws","general","generic-database.png"), "Waivers", "Registry"),
]
for i, (ic, l1, l2) in enumerate(d_items):
    cx = LM + 130 + i * 245
    put_icon(ic, cx, R2+85, 52, NAVY)
    tmulti([l1, l2], cx, R2+140, FNS, WHITE)

# ══════════════════════════════════════════════════════════════════════
# ROW 3 — Dev Tooling + Governance  (y: 580..800)
# ══════════════════════════════════════════════════════════════════════
R3 = 580; R3H = 230

# Developer Tooling
rrect(LM, R3, LM+700, R3+R3H, PURPLE)
tcenter("Developer Tooling  (npm Packages)", LM+350, R3+22, FC, WHITE)

t_items = [
    (icon("aws","devtools","command-line-interface.png"), "aac CLI", "@muthub-ai/aac", "validate / init / create"),
    (icon("aws","general","traditional-server.png"), "MCP Server", "@muthub-ai/", "aac-mcp-server"),
    (icon("programming","language","typescript.png"), "IDE Integration", "Cursor / VS Code", "Claude Desktop"),
]
for i, (ic, l1, l2, l3) in enumerate(t_items):
    cx = LM + 130 + i * 230
    put_icon(ic, cx, R3+95, 52, PURPLE)
    tmulti([l1, l2, l3], cx, R3+165, FNS, WHITE)

# MCP → IDE arrow
arr(LM+130+230+40, R3+95, LM+130+460-40, R3+95, WHITE, 2)

# Governance
GOV_L = LM + 760
rrect(GOV_L, R3, GOV_L+540, R3+R3H, RED)
tcenter("Governance Engine  (OPA / Rego)", GOV_L+270, R3+22, FC, WHITE)

g_items = [
    (icon("aws","security","shield.png"), "Policy", "Engine"),
    (icon("aws","compute","lambda.png"), "Security", "(KMS)"),
    (icon("aws","compute","lambda.png"), "Integration", "(API GW)"),
    (icon("aws","compute","lambda.png"), "FinOps", "(Rightsizing)"),
]
for i, (ic, l1, l2) in enumerate(g_items):
    cx = GOV_L + 80 + i * 130
    put_icon(ic, cx, R3+95, 48, RED)
    tmulti([l1, l2], cx, R3+150, FNS, WHITE)

# Policy → sub-policies
arr(GOV_L+80+45, R3+95, GOV_L+80+130-30, R3+95, WHITE, 2)

# ══════════════════════════════════════════════════════════════════════
# ROW 4 — CI + Web App + Deployment  (y: 860..1090)
# ══════════════════════════════════════════════════════════════════════
R4 = 860; R4H = 220

# CI Pipeline
rrect(LM, R4, LM+780, R4+R4H, ORANGE)
tcenter("CI/CD Pipeline  (GitHub Actions - 9 Stages)", LM+390, R4+22, FC, WHITE)

ci = [
    (icon("aws","devtools","codebuild.png"), "1  Lint & Test", "ESLint + 436 Vitest"),
    (icon("aws","devtools","codebuild.png"), "2a-d  Validate", "Schema + Compliance"),
    (icon("aws","devtools","codebuild.png"), "2e  Policy", "OPA Checks"),
    (icon("aws","devtools","codebuild.png"), "3  Assemble", "Microsite"),
]
for i, (ic, l1, l2) in enumerate(ci):
    cx = LM + 110 + i * 180
    put_icon(ic, cx, R4+95, 48, ORANGE)
    tmulti([l1, l2], cx, R4+155, FNS, WHITE)

# Internal CI arrows
for sx, ex, dy in [(0,1,0), (0,2,8), (1,3,0), (2,3,8)]:
    x1 = LM+110+sx*180+35; x2 = LM+110+ex*180-35
    arr(x1, R4+95+dy, x2, R4+95+dy, WHITE, 2)

# Web Application
WEB_L = LM + 840
rrect(WEB_L, R4, WEB_L+660, R4+R4H, TEAL)
tcenter("Web Application  (Next.js 16 + React 19)", WEB_L+330, R4+22, FC, WHITE)

w_items = [
    (icon("programming","framework","nextjs.png"), "Dashboard", "App Router"),
    (icon("programming","framework","react.png"), "React Flow", "C4 Diagrams"),
    (icon("aws","devtools","codebuild.png"), "Export Engine", "PlantUML / Draw.io"),
]
for i, (ic, l1, l2) in enumerate(w_items):
    cx = WEB_L + 120 + i * 220
    put_icon(ic, cx, R4+95, 52, TEAL)
    tmulti([l1, l2], cx, R4+155, FNS, WHITE)

arr(WEB_L+120+45, R4+95, WEB_L+120+220-45, R4+95, WHITE, 2)
arr(WEB_L+120+220+45, R4+95, WEB_L+120+440-45, R4+95, WHITE, 2)

# Deployment
DEP_L = LM + 1560
rrect(DEP_L, R4, RM, R4+R4H, DEPLOY_BL)
tcenter("Deployment Targets", DEP_L + (RM-DEP_L)//2, R4+22, FC, WHITE)

dep = [
    (icon("programming","framework","nextjs.png"), "Vercel", "Dashboard App"),
    (icon("aws","network","cloudfront.png"), "GitHub Pages", "Doc Microsite"),
]
for i, (ic, l1, l2) in enumerate(dep):
    cx = DEP_L + 140 + i * 360
    put_icon(ic, cx, R4+95, 52, DEPLOY_BL)
    tmulti([l1, l2], cx, R4+155, FN, WHITE)


# ══════════════════════════════════════════════════════════════════════
# INTER-TIER ARROWS  (drawn AFTER all clusters to sit on top)
# ══════════════════════════════════════════════════════════════════════

# 1. Architect → Repo  (orange, solid)
arr(LM+160, R1+R1H+5, GH_L+110, R2-12, C_ORANGE, 3, "author models")

# 2. Developer → Repo  (orange, solid) — offset right to avoid overlap
arr(LM+330, R1+R1H+5, GH_L+170, R2-12, C_ORANGE, 3, "commit code")

# 3. Repo → Data Layer  (blue, solid)
arr(GH_L+200, R1+R1H+5, LM+625, R2-5, C_BLUE, 3, "store YAML")

# 4. Models → CLI  (purple)
arr(LM+130, R2+R2H+5, LM+130, R3-5, C_PURPLE, 2, "validate")

# 5. Models → MCP  (purple, no label)
arr(LM+250, R2+R2H+5, LM+360, R3-5, C_PURPLE, 2)

# 6. Models → Policy Engine  (red)
arr(LM+900, R2+R2H+5, GOV_L+80, R3-5, C_RED, 3, "enforce")

# 7. CLI → Schemas (dashed back-link)
arr(LM+200, R3-5, LM+310, R2+R2H+5, C_PURPLE, 2, "schema check", dash=True)

# 8. Copilot → IDE (dashed purple RAG)
arr(GH_L+700, R1+R1H+5, LM+590, R3-5, C_PURPLE, 2, "RAG context", dash=True)

# 9. Actions → CI Pipeline  (orange)
arr(GH_L+420, R1+R1H+5, LM+390, R4-5, C_ORANGE, 3, "run pipeline")

# 10. Models → Web App  (blue, parse)
arr(LM+1100, R2+R2H+5, WEB_L+180, R4-5, C_BLUE, 3, "parse & render")

# 11. Web App → Vercel  (dashed navy)
arr(WEB_L+660+5, R4+100, DEP_L-5, R4+100, C_NAVY, 2, "deploy", dash=True)

# 12. CI Assemble → GH Pages  (orange, publish)
arr(LM+110+3*180, R4+R4H+10, DEP_L+500, R4+R4H+10, C_ORANGE, 3, "publish microsite")

# 13. Developer → CLI  (dashed purple)
arr(LM+300, R1+R1H+5, LM+130, R3-10, C_PURPLE, 2, "CLI / IDE", dash=True)


# ══════════════════════════════════════════════════════════════════════
# LEGEND (top-right)
# ══════════════════════════════════════════════════════════════════════
LX = W - 530; LY = R1
LW_, LH_ = 480, 215
rrect(LX, LY, LX+LW_, LY+LH_, LGRAY, r=10, outline=(200,200,200))
tcenter("Legend", LX+LW_//2, LY+18, FLT, DARK)

legend = [
    (C_ORANGE, "solid",  "CI/CD & Pipeline Flow"),
    (C_BLUE,   "solid",  "Data Flow (YAML / Parse)"),
    (C_PURPLE, "solid",  "Developer Tooling Flow"),
    (C_RED,    "solid",  "Governance / Policy Enforcement"),
    (C_TEAL,   "dash",   "User Interaction"),
    (C_NAVY,   "dash",   "Deployment"),
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
# TECH FOOTER
# ══════════════════════════════════════════════════════════════════════
footer = "muthub-ai/aac  |  Next.js 16 + React 19 + TypeScript + Zustand  |  OPA Rego  |  GitHub Actions  |  Vercel + GitHub Pages"
tcenter(footer, W//2, H-30, FNS, (170,170,170))

# ── Save ──────────────────────────────────────────────────────────────
os.makedirs("docs", exist_ok=True)
img.save("docs/aac-architecture.png", dpi=(DPI, DPI), quality=95)
print(f"Done -> docs/aac-architecture.png  ({W}x{H} @ {DPI} DPI)")
