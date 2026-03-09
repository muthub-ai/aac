// build-pattern-pages.ts
//
// Generates static HTML pages for each architecture pattern in the
// Pattern Catalog. Uses the exact same design system (CSS, nav, footer)
// as the primary documentation site (build-docs.ts) for a seamless
// experience when navigating between systems and patterns.
//
// Usage:  npx tsx scripts/build-pattern-pages.ts
// Output: build/patterns/{pattern-id}.html + build/patterns/index.html
//
// These pages are merged into build/microsite/output/patterns/ in CI
// so they live at /patterns/*.html relative to the main site root.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import plantumlEncoder from 'plantuml-encoder';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, '..');
const OUTPUT_DIR = path.join(ROOT, 'build', 'patterns');

// ── Types (mirrored from src/types/pattern.ts to avoid @/ alias) ─────

interface GettingStartedStep { step: number; title: string; }
interface PatternDiagram { label: string; plantumlSource: string; }
interface ProductUsed { name: string; role: string; }
interface NFR { metric: string; target: string; }
interface DesignConsideration { title: string; description: string; }

interface PatternData {
  id: string;
  version: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  exposure: 'internal' | 'external';
  advantages: string[];
  considerations: string[];
  gettingStarted: GettingStartedStep[];
  maturity: string;
  maintainerTeam: string;
  docsUrl?: string;
  downloads: number;
  stars: number;
  diagrams: PatternDiagram[];
  architectureOverview: string;
  designConsiderations: DesignConsideration[];
  productsUsed: ProductUsed[];
  nonFunctionalRequirements: NFR[];
  constraints: string[];
  costProfile: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function writeln(msg: string): void {
  process.stdout.write(msg + '\n');
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plantumlSvgUrl(source: string): string {
  const encoded = plantumlEncoder.encode(source);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

function maturityBadge(m: string): { bg: string; text: string; border: string } {
  switch (m) {
    case 'Production Ready': return { bg: '#dafbe1', text: '#1a7f37', border: '#1a7f37' };
    case 'Beta': return { bg: '#fff8c5', text: '#9a6700', border: '#bf8700' };
    case 'Draft': return { bg: '#eef1f5', text: '#656d76', border: '#d0d7de' };
    case 'Deprecated': return { bg: '#ffebe9', text: '#cf222e', border: '#cf222e' };
    default: return { bg: '#eef1f5', text: '#656d76', border: '#d0d7de' };
  }
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    'ai-ml': 'AI + Machine Learning', 'analytics': 'Analytics', 'api': 'API',
    'compute': 'Compute', 'database': 'Database', 'messaging': 'Messaging',
    'networking': 'Networking', 'security': 'Security', 'storage': 'Storage',
  };
  return map[c] || c;
}

// ── Load pattern data ────────────────────────────────────────────────

async function loadPatterns(): Promise<PatternData[]> {
  const mod = await import('../src/lib/data/mock-patterns.js');
  return mod.MOCK_PATTERNS as PatternData[];
}

// ── SVG Icons (same as build-docs.ts) ────────────────────────────────

const ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  dollar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  gauge: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
  rocket: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
};

// ── Shared CSS (matches build-docs.ts design system exactly) ─────────

const CSS = `
:root {
  --bg: #f6f8fa; --bg-alt: #ffffff; --card: #ffffff; --card-hover: #f8fafc;
  --text: #1f2328; --text-secondary: #656d76; --text-tertiary: #8c959f;
  --border: #d0d7de; --border-muted: #e8ebef;
  --accent: #2563eb; --accent-hover: #1d4ed8; --accent-subtle: rgba(37,99,235,0.08);
  --success: #1a7f37; --success-subtle: rgba(26,127,55,0.08);
  --warning: #bf8700; --warning-subtle: rgba(191,135,0,0.08);
  --danger: #cf222e; --danger-subtle: rgba(207,34,46,0.08);
  --purple: #8250df; --purple-subtle: rgba(130,80,223,0.08);
  --orange: #f78166; --orange-subtle: rgba(247,129,102,0.08);
  --code-bg: #f0f3f6; --shadow: 0 1px 3px rgba(31,35,40,0.04), 0 1px 2px rgba(31,35,40,0.06);
  --shadow-md: 0 4px 12px rgba(31,35,40,0.08); --radius: 12px; --radius-sm: 8px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117; --bg-alt: #161b22; --card: #161b22; --card-hover: #1c2128;
    --text: #e6edf3; --text-secondary: #8b949e; --text-tertiary: #6e7681;
    --border: #30363d; --border-muted: #21262d;
    --accent: #58a6ff; --accent-hover: #79c0ff; --accent-subtle: rgba(88,166,255,0.1);
    --success: #3fb950; --success-subtle: rgba(63,185,80,0.1);
    --warning: #d29922; --warning-subtle: rgba(210,153,34,0.1);
    --danger: #f85149; --danger-subtle: rgba(248,81,73,0.1);
    --purple: #bc8cff; --purple-subtle: rgba(188,140,255,0.1);
    --orange: #f78166; --orange-subtle: rgba(247,129,102,0.1);
    --code-bg: #1c2128; --shadow: 0 1px 3px rgba(0,0,0,0.2); --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  }
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Noto Sans, Helvetica, Arial, sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; transition: color 0.15s; }
a:hover { color: var(--accent-hover); }
img { max-width: 100%; height: auto; }

/* ── Layout ─────────────────────── */
.container { max-width: 1152px; margin: 0 auto; padding: 0 24px; }
@media (min-width: 640px) { .container { padding: 0 40px; } }

/* ── Nav (same as main site) ────── */
.nav { position: sticky; top: 0; z-index: 50; background: var(--bg-alt); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }
.nav-inner { display: flex; align-items: center; height: 56px; gap: 16px; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text); text-decoration: none; }
.nav-brand svg { width: 28px; height: 28px; color: var(--accent); }
.nav-links { display: flex; gap: 4px; margin-left: auto; }
.nav-link { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--text-secondary); transition: all 0.15s; }
.nav-link:hover { color: var(--text); background: var(--accent-subtle); }
.nav-link.active { color: var(--accent); background: var(--accent-subtle); }

/* ── Footer ─────────────────────── */
footer { margin-top: 40px; padding: 24px 0; border-top: 1px solid var(--border); }
footer p { font-size: 13px; color: var(--text-tertiary); text-align: center; }
footer p + p { margin-top: 4px; }

/* ── Breadcrumb ─────────────────── */
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-tertiary); margin-bottom: 16px; }
.breadcrumb a { color: var(--text-secondary); }
.breadcrumb a:hover { color: var(--accent); }
.breadcrumb svg { width: 12px; height: 12px; color: var(--text-tertiary); }

/* ── Detail Hero ────────────────── */
.detail-hero { padding: 48px 0 32px; border-bottom: 1px solid var(--border); }
.detail-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px; }
.detail-hero .desc { font-size: 16px; color: var(--text-secondary); line-height: 1.6; max-width: 720px; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid; }
.tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: var(--accent-subtle); color: var(--accent); }

/* ── Content Sections ───────────── */
.detail-content { padding: 40px 0 20px; }
.detail-section { margin-bottom: 48px; }
.detail-section h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 2px solid var(--border); display: flex; align-items: center; gap: 8px; }
.detail-section h2 .section-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; }
.detail-section > p.section-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; }

/* ── Cards ──────────────────────── */
.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
.info-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; box-shadow: var(--shadow); }
.info-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.info-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }

/* ── Pattern Catalog Cards ──────── */
.pattern-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.pattern-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); transition: all 0.2s ease; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
.pattern-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-2px); color: inherit; }
.pattern-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.pattern-card h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.pattern-card:hover h3 { color: var(--accent); }
.pattern-card-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.pattern-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.pattern-card-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--border-muted); }
.pattern-card-stat { text-align: center; }
.pattern-card-stat .val { font-size: 16px; font-weight: 700; color: var(--text); }
.pattern-card-stat .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); }
.group-badge { background: var(--purple-subtle); color: var(--purple); border-color: transparent; font-size: 10px; padding: 1px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

/* ── Table ──────────────────────── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); box-shadow: var(--shadow); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead { background: var(--bg); }
th { padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-muted); vertical-align: top; }
tr:last-child td { border-bottom: none; }
tr:hover { background: var(--card-hover); }

/* ── NFR Grid ───────────────────── */
.nfr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.nfr-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; box-shadow: var(--shadow); }
.nfr-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); }
.nfr-card .value { font-size: 15px; font-weight: 700; color: var(--text); margin-top: 4px; }

/* ── Pros / Cons ────────────────── */
.pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 640px) { .pros-cons { grid-template-columns: 1fr; } }
.pros-box { background: var(--success-subtle); border: 1px solid var(--success); border-radius: var(--radius-sm); padding: 20px; }
.cons-box { background: var(--warning-subtle); border: 1px solid var(--warning); border-radius: var(--radius-sm); padding: 20px; }
.pros-box h3, .cons-box h3 { font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.pros-box h3 { color: var(--success); }
.cons-box h3 { color: var(--warning); }
.check-list, .warn-list { list-style: none; padding: 0; }
.check-list li, .warn-list li { padding: 4px 0; font-size: 13px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
.check-list li svg { color: var(--success); flex-shrink: 0; margin-top: 2px; }
.warn-list li svg { color: var(--warning); flex-shrink: 0; margin-top: 2px; }

/* ── Stepper ────────────────────── */
.stepper { margin-left: 12px; border-left: 2px solid var(--border); padding-left: 24px; }
.stepper .step { position: relative; padding-bottom: 20px; }
.stepper .step:last-child { padding-bottom: 0; }
.stepper .step-num { position: absolute; left: -37px; top: 0; width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--accent); background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--accent); }
.stepper .step p { font-size: 14px; margin: 0; padding-top: 2px; color: var(--text); }

/* ── Diagram Card ───────────────── */
.diagram-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); margin-bottom: 16px; }
.diagram-card-header { padding: 12px 20px; border-bottom: 1px solid var(--border-muted); display: flex; align-items: center; justify-content: space-between; }
.diagram-card-header h3 { font-size: 14px; font-weight: 600; }
.diagram-type-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 4px; }
.type-context { background: var(--accent-subtle); color: var(--accent); }
.type-container { background: var(--success-subtle); color: var(--success); }
.diagram-card-body { padding: 20px; background: var(--bg); text-align: center; min-height: 200px; }
.diagram-card-body img { border-radius: 8px; max-height: 600px; cursor: pointer; }

/* ── Constraint list ────────────── */
.constraint-list { list-style: none; padding: 0; }
.constraint-list li { padding: 8px 0; font-size: 14px; color: var(--text); display: flex; gap: 10px; align-items: flex-start; border-bottom: 1px solid var(--border-muted); }
.constraint-list li:last-child { border-bottom: none; }
.constraint-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); flex-shrink: 0; margin-top: 8px; }

/* ── Hero section for index ─────── */
.patterns-hero { padding: 60px 0 40px; text-align: center; position: relative; overflow: hidden; }
.patterns-hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%); pointer-events: none; }
.patterns-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 12px; }
.patterns-hero h1 span { color: var(--accent); }
.patterns-hero p { font-size: 16px; color: var(--text-secondary); max-width: 600px; margin: 0 auto; line-height: 1.5; }

/* ── Stats ──────────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 32px 0 48px; }
@media (max-width: 640px) { .stats-row { grid-template-columns: 1fr; } }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: var(--shadow); }
.stat-value { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--accent); }
.stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-top: 4px; }
`;

// ── Shared HTML Fragments ────────────────────────────────────────────
// prefix = '../' for pattern detail pages (inside patterns/), '' for index

function htmlHead(title: string, description: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2'><path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/></svg>">
  <style>${CSS}</style>
</head>
<body>`;
}

function nav(activePage: string, prefix: string): string {
  return `
<nav class="nav">
  <div class="container nav-inner">
    <a href="${prefix}index.html" class="nav-brand">
      ${ICONS.logo}
      Architecture as Code
    </a>
    <div class="nav-links">
      <a href="${prefix}index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Overview</a>
      <a href="${prefix}index.html#systems" class="nav-link">Systems</a>
      <a href="${prefix}patterns/index.html" class="nav-link ${activePage === 'patterns' ? 'active' : ''}">Patterns</a>
      <a href="${prefix}index.html#pipeline" class="nav-link">Pipeline</a>
      <a href="https://github.com/muthub-ai/aac" class="nav-link" target="_blank" rel="noopener">GitHub &nearr;</a>
    </div>
  </div>
</nav>`;
}

function siteFooter(): string {
  return `
<footer>
  <div class="container">
    <p>Architecture as Code &mdash; auto-generated from <a href="https://github.com/muthub-ai/aac">YAML models</a> via CI/CD pipeline</p>
    <p style="font-size:11px;color:var(--text-tertiary)">Built with C4 Model &bull; PlantUML &bull; Asciidoctor &bull; GitHub Actions</p>
  </div>
</footer>
</body>
</html>`;
}

// ── Pattern Detail Page ──────────────────────────────────────────────

function renderPatternPage(pattern: PatternData): string {
  const mc = maturityBadge(pattern.maturity);

  // Diagrams
  const diagramsHtml = pattern.diagrams.map(d => {
    const url = plantumlSvgUrl(d.plantumlSource);
    const typeClass = d.label.toLowerCase().includes('context') ? 'type-context' : 'type-container';
    const typeLabel = d.label.toLowerCase().includes('context') ? 'Context' : 'Container';
    return `
    <div class="diagram-card">
      <div class="diagram-card-header">
        <h3>${escapeHtml(d.label)}</h3>
        <span class="diagram-type-badge ${typeClass}">${typeLabel}</span>
      </div>
      <div class="diagram-card-body">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(d.label)} diagram for ${escapeHtml(pattern.name)}" loading="lazy" />
      </div>
    </div>`;
  }).join('\n');

  // Design considerations
  const designHtml = pattern.designConsiderations.length > 0 ? `
    <div class="card-grid">
      ${pattern.designConsiderations.map(dc => `
      <div class="info-card">
        <h3>${escapeHtml(dc.title)}</h3>
        <p>${escapeHtml(dc.description)}</p>
      </div>`).join('\n')}
    </div>` : '';

  // Products used table
  const productsHtml = pattern.productsUsed.length > 0 ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Product</th><th>Role</th></tr></thead>
        <tbody>
          ${pattern.productsUsed.map(p => `
          <tr>
            <td style="font-weight:500">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.role)}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>` : '';

  // NFR grid
  const nfrHtml = pattern.nonFunctionalRequirements.length > 0 ? `
    <div class="nfr-grid">
      ${pattern.nonFunctionalRequirements.map(n => `
      <div class="nfr-card">
        <div class="label">${escapeHtml(n.metric)}</div>
        <div class="value">${escapeHtml(n.target)}</div>
      </div>`).join('\n')}
    </div>` : '';

  // Advantages & considerations
  const prosConsHtml = (pattern.advantages.length > 0 || pattern.considerations.length > 0) ? `
    <div class="pros-cons">
      <div class="pros-box">
        <h3>${ICONS.check} Advantages</h3>
        <ul class="check-list">
          ${pattern.advantages.map(a => `<li>${ICONS.check} ${escapeHtml(a)}</li>`).join('\n')}
        </ul>
      </div>
      <div class="cons-box">
        <h3>${ICONS.warning} Considerations</h3>
        <ul class="warn-list">
          ${pattern.considerations.map(c => `<li>${ICONS.warning} ${escapeHtml(c)}</li>`).join('\n')}
        </ul>
      </div>
    </div>` : '';

  // Constraints
  const constraintsHtml = pattern.constraints.length > 0 ? `
    <ul class="constraint-list">
      ${pattern.constraints.map(c => `<li><span class="constraint-dot"></span>${escapeHtml(c)}</li>`).join('\n')}
    </ul>` : '';

  // Overview paragraphs
  const overviewParas = pattern.architectureOverview
    .split('\n\n')
    .map(p => `<p style="font-size:15px;line-height:1.7;color:var(--text);margin-bottom:12px">${escapeHtml(p)}</p>`)
    .join('\n');

  // Getting started stepper
  const stepsHtml = pattern.gettingStarted.length > 0 ? `
    <div class="stepper">
      ${pattern.gettingStarted.map(s => `
      <div class="step">
        <div class="step-num">${s.step}</div>
        <p>${escapeHtml(s.title)}</p>
      </div>`).join('\n')}
    </div>` : '';

  // Tags
  const tagsHtml = pattern.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');

  return `${htmlHead(`${pattern.name} — Architecture Pattern`, pattern.description)}
${nav('patterns', '../')}

<section class="detail-hero">
  <div class="container">
    <div class="breadcrumb">
      <a href="../index.html">Home</a>
      <span>${ICONS.chevron}</span>
      <a href="index.html">Patterns</a>
      <span>${ICONS.chevron}</span>
      <span>${escapeHtml(pattern.name)}</span>
    </div>
    <h1>${escapeHtml(pattern.name)}</h1>
    <p class="desc">${escapeHtml(pattern.description)}</p>
    <div class="detail-meta">
      <span class="badge" style="background:${mc.bg};color:${mc.text};border-color:${mc.border}">${escapeHtml(pattern.maturity)}</span>
      <span class="badge" style="background:var(--accent-subtle);color:var(--accent);border-color:var(--accent)">${escapeHtml(pattern.exposure)}</span>
      <span class="badge" style="background:var(--card);color:var(--text-secondary);border-color:var(--border)">v${escapeHtml(pattern.version)}</span>
      <span class="badge" style="background:var(--purple-subtle);color:var(--purple);border-color:transparent">${escapeHtml(categoryLabel(pattern.category))}</span>
    </div>
    <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px">${tagsHtml}</div>
  </div>
</section>

<div class="container detail-content">

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.box}</span> Architecture Overview</h2>
    ${overviewParas}
  </div>

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.box}</span> Architecture Diagrams</h2>
    ${diagramsHtml}
  </div>

  ${designHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--purple-subtle);color:var(--purple)">${ICONS.box}</span> Design Considerations</h2>
    ${designHtml}
  </div>` : ''}

  ${productsHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.box}</span> Products Used</h2>
    ${productsHtml}
  </div>` : ''}

  ${nfrHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--orange-subtle);color:var(--orange)">${ICONS.gauge}</span> Non-Functional Requirements</h2>
    ${nfrHtml}
  </div>` : ''}

  ${prosConsHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.check}</span> Advantages &amp; Considerations</h2>
    ${prosConsHtml}
  </div>` : ''}

  ${constraintsHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--danger-subtle);color:var(--danger)">${ICONS.shield}</span> Constraints &amp; Limitations</h2>
    ${constraintsHtml}
  </div>` : ''}

  ${pattern.costProfile ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--warning-subtle);color:var(--warning)">${ICONS.dollar}</span> Cost Profile</h2>
    <div class="info-card">
      <p>${escapeHtml(pattern.costProfile)}</p>
    </div>
  </div>` : ''}

  ${stepsHtml ? `<div class="detail-section">
    <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.rocket}</span> Getting Started</h2>
    ${stepsHtml}
  </div>` : ''}

  <div style="padding:16px 0;font-size:13px;color:var(--text-secondary);border-top:1px solid var(--border-muted)">
    Maintained by <strong>${escapeHtml(pattern.maintainerTeam)}</strong> &middot; Version ${escapeHtml(pattern.version)}${pattern.docsUrl ? ` &middot; <a href="${escapeHtml(pattern.docsUrl)}">Full Documentation &nearr;</a>` : ''}
  </div>

</div>

${siteFooter()}`;
}

// ── Pattern Index Page ───────────────────────────────────────────────

function renderIndexPage(patterns: PatternData[]): string {
  const categories = [...new Set(patterns.map(p => p.category))];
  const totalDiagrams = patterns.reduce((s, p) => s + p.diagrams.length, 0);

  const cards = patterns.map(p => {
    const mc = maturityBadge(p.maturity);
    const topTags = p.tags.slice(0, 4);
    return `
    <a href="${escapeHtml(p.id)}.html" class="pattern-card">
      <div class="pattern-card-header">
        <div>
          <span class="group-badge">${escapeHtml(categoryLabel(p.category))}</span>
          <h3 style="margin-top:6px">${escapeHtml(p.name)}</h3>
        </div>
        <span class="badge" style="background:${mc.bg};color:${mc.text};border-color:${mc.border}">${escapeHtml(p.maturity)}</span>
      </div>
      <p class="pattern-card-desc">${escapeHtml(p.description)}</p>
      <div class="pattern-card-tags">
        ${topTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        ${p.tags.length > 4 ? `<span class="tag" style="background:var(--card);color:var(--text-tertiary);border:1px solid var(--border)">+${p.tags.length - 4}</span>` : ''}
      </div>
      <div class="pattern-card-footer">
        <div class="pattern-card-stat"><div class="val">${p.diagrams.length}</div><div class="lbl">Diagrams</div></div>
        <div class="pattern-card-stat"><div class="val">${p.productsUsed.length}</div><div class="lbl">Products</div></div>
        <div class="pattern-card-stat"><div class="val">${p.nonFunctionalRequirements.length}</div><div class="lbl">NFRs</div></div>
      </div>
    </a>`;
  }).join('\n');

  return `${htmlHead('Pattern Catalog — Architecture as Code', 'Browse reusable enterprise architecture patterns with C4 diagrams, design considerations, NFRs, and cost profiles.')}
${nav('patterns', '../')}

<section class="patterns-hero">
  <div class="container" style="position:relative">
    <h1>Pattern <span>Catalog</span></h1>
    <p>Reusable enterprise architecture patterns with full documentation, C4 diagrams, design considerations, and operational guidance.</p>
  </div>
</section>

<section class="container">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">${patterns.length}</div>
      <div class="stat-label">Patterns</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalDiagrams}</div>
      <div class="stat-label">C4 Diagrams</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${categories.length}</div>
      <div class="stat-label">Categories</div>
    </div>
  </div>
</section>

<section class="container" style="padding-bottom:60px">
  <div class="pattern-grid">
    ${cards}
  </div>
</section>

${siteFooter()}`;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  writeln('=== Build Pattern Pages ===\n');

  const patterns = await loadPatterns();
  writeln(`Loaded ${patterns.length} patterns from mock-patterns.ts`);

  ensureDir(OUTPUT_DIR);

  for (const pattern of patterns) {
    const html = renderPatternPage(pattern);
    const outPath = path.join(OUTPUT_DIR, `${pattern.id}.html`);
    fs.writeFileSync(outPath, html, 'utf-8');
    writeln(`  [OK] ${pattern.id}.html (${(html.length / 1024).toFixed(1)} KB)`);
  }

  const indexHtml = renderIndexPage(patterns);
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  writeln(`  [OK] index.html (${(indexHtml.length / 1024).toFixed(1)} KB)`);

  writeln(`\nDone — ${patterns.length + 1} pages written to ${path.relative(ROOT, OUTPUT_DIR)}/`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
