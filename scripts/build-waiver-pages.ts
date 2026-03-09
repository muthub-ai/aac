// build-waiver-pages.ts
//
// Generates static HTML pages for each architecture waiver in the
// Waiver Registry. Uses the exact same design system (CSS, nav, footer)
// as the primary documentation site (build-docs.ts) for a seamless
// experience when navigating between systems, patterns, standards, and waivers.
//
// Usage:  npx tsx scripts/build-waiver-pages.ts
// Output: build/waivers/{slug}.html + build/waivers/index.html
//
// These pages are merged into build/microsite/output/waivers/ in CI
// so they live at /waivers/*.html relative to the main site root.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, '..');
const WAIVERS_DIR = path.join(ROOT, 'waivers');
const OUTPUT_DIR = path.join(ROOT, 'build', 'waivers');

// ── Types (mirrored from src/types/waiver.ts to avoid @/ alias) ──────

type WaiverStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REMEDIATED';
type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ControlEffectiveness = 'HIGH' | 'MEDIUM' | 'LOW';

interface FinancialImpact {
  complianceCost: string;
  delayCost: string;
  riskExposureCost?: string;
  summary: string;
}

interface CompensatingControl {
  control: string;
  effectiveness: ControlEffectiveness;
  verificationMethod?: string;
}

interface RemediationPlan {
  description: string;
  targetDate: string;
  backlogItemUrl?: string;
  assignedTeam?: string;
  progressPercent?: number;
}

interface RevisionEntry {
  date: string;
  author: string;
  change: string;
}

interface ArchitectureWaiver {
  exceptionId: string;
  title: string;
  targetAppId: string;
  targetAppName: string;
  violatedStandardId: string;
  violatedStandardName: string;
  violatedRequirementIds?: string[];
  status: WaiverStatus;
  rationale: string;
  financialImpact?: FinancialImpact;
  riskSeverity: RiskSeverity;
  riskDescription?: string;
  compensatingControls: CompensatingControl[];
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvalDate?: string;
  expirationDate?: string;
  remediationPlan: RemediationPlan;
  domain?: string;
  tags?: string[];
  reviewNotes?: string;
  revisionHistory?: RevisionEntry[];
}

interface WaiverFile {
  fileName: string;
  slug: string;
  waiver: ArchitectureWaiver;
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

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.ya?ml$/, '');
}

// ── Badge helpers ────────────────────────────────────────────────────

function statusBadge(status: WaiverStatus): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'APPROVED': return { bg: '#dafbe1', text: '#1a7f37', border: '#1a7f37', label: 'Approved' };
    case 'PENDING_REVIEW': return { bg: '#fff8c5', text: '#9a6700', border: '#bf8700', label: 'Pending Review' };
    case 'REJECTED': return { bg: '#ffebe9', text: '#cf222e', border: '#cf222e', label: 'Rejected' };
    case 'EXPIRED': return { bg: '#fff1e5', text: '#bc4c00', border: '#d18616', label: 'Expired' };
    case 'REMEDIATED': return { bg: '#ddf4ff', text: '#0969da', border: '#0969da', label: 'Remediated' };
  }
}

function riskBadge(severity: RiskSeverity): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'CRITICAL': return { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger)' };
    case 'HIGH': return { bg: 'var(--orange-subtle)', text: 'var(--orange)', border: 'var(--orange)' };
    case 'MEDIUM': return { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'var(--warning)' };
    case 'LOW': return { bg: 'var(--success-subtle)', text: 'var(--success)', border: 'var(--success)' };
  }
}

function effectivenessBadge(eff: ControlEffectiveness): { bg: string; text: string } {
  switch (eff) {
    case 'HIGH': return { bg: 'var(--success-subtle)', text: 'var(--success)' };
    case 'MEDIUM': return { bg: 'var(--warning-subtle)', text: 'var(--warning)' };
    case 'LOW': return { bg: 'var(--danger-subtle)', text: 'var(--danger)' };
  }
}

// ── Data Loading ─────────────────────────────────────────────────────

function loadWaivers(): WaiverFile[] {
  if (!fs.existsSync(WAIVERS_DIR)) return [];
  const files = fs.readdirSync(WAIVERS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).sort();
  return files.map(fileName => {
    const content = fs.readFileSync(path.join(WAIVERS_DIR, fileName), 'utf-8');
    const waiver = yaml.load(content) as ArchitectureWaiver;
    return { fileName, slug: slugFromFileName(fileName), waiver };
  });
}

// ── SVG Icons (same as build-docs.ts) ────────────────────────────────

const ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  alertTriangle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  dollar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  wrench: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
};

// ── Shared CSS (matches build-docs.ts / build-pattern-pages.ts / build-standard-pages.ts) ──

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
.info-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; box-shadow: var(--shadow); }
.info-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.info-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }

/* ── Waiver Catalog Cards ────────── */
.waiver-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.waiver-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); transition: all 0.2s ease; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
.waiver-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-2px); color: inherit; }
.waiver-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.waiver-card h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.waiver-card:hover h3 { color: var(--accent); }
.waiver-card-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; flex: 1; }
.waiver-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.waiver-card-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--border-muted); }
.waiver-card-stat { text-align: center; }
.waiver-card-stat .val { font-size: 16px; font-weight: 700; color: var(--text); }
.waiver-card-stat .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); }
.group-badge { background: var(--purple-subtle); color: var(--purple); border-color: transparent; font-size: 10px; padding: 1px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

/* ── Table ──────────────────────── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); box-shadow: var(--shadow); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead { background: var(--bg); }
th { padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-muted); vertical-align: top; }
tr:last-child td { border-bottom: none; }
tr:hover { background: var(--card-hover); }

/* ── Progress bar ────────────────── */
.progress-track { height: 8px; background: var(--code-bg); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.progress-success { background: var(--success); }
.progress-warning { background: var(--warning); }
.progress-danger { background: var(--danger); }

/* ── Two-col grid ────────────────── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

/* ── Timeline ────────────────────── */
.timeline { margin-left: 12px; border-left: 2px solid var(--border); padding-left: 24px; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--accent); background: var(--bg); }
.timeline-date { font-size: 13px; font-weight: 700; color: var(--text); }
.timeline-author { font-size: 12px; color: var(--text-tertiary); margin-left: 8px; }
.timeline-change { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

/* ── Hero section for index ─────── */
.waivers-hero { padding: 60px 0 40px; text-align: center; position: relative; overflow: hidden; }
.waivers-hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(ellipse, var(--warning-subtle) 0%, transparent 70%); pointer-events: none; }
.waivers-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 12px; }
.waivers-hero h1 span { color: var(--warning); }
.waivers-hero p { font-size: 16px; color: var(--text-secondary); max-width: 640px; margin: 0 auto; line-height: 1.5; }

/* ── Stats ──────────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 32px 0 48px; }
@media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: var(--shadow); }
.stat-value { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; }
.stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-top: 4px; }
`;

// ── Shared HTML Fragments ────────────────────────────────────────────

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

function siteNav(activePage: string, prefix: string): string {
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
      <a href="${prefix}standards/index.html" class="nav-link ${activePage === 'standards' ? 'active' : ''}">Standards</a>
      <a href="${prefix}waivers/index.html" class="nav-link ${activePage === 'waivers' ? 'active' : ''}">Waivers</a>
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

// ── Waiver Detail Page ───────────────────────────────────────────────

function renderWaiverPage(wf: WaiverFile): string {
  const w = wf.waiver;
  const sb = statusBadge(w.status);
  const rb = riskBadge(w.riskSeverity);

  // Tags
  const tagsHtml = (w.tags ?? []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');

  // Compensating controls
  const controlsHtml = w.compensatingControls.map((cc, i) => {
    const eb = effectivenessBadge(cc.effectiveness);
    return `
    <div class="info-card" style="margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h3 style="font-family:monospace;color:var(--text-secondary)">Control ${i + 1}</h3>
        <span class="badge" style="background:${eb.bg};color:${eb.text};border-color:transparent">${escapeHtml(cc.effectiveness)}</span>
      </div>
      <p>${escapeHtml(cc.control)}</p>
      ${cc.verificationMethod ? `<p style="margin-top:6px;font-size:12px;color:var(--text-tertiary)"><strong>Verification:</strong> ${escapeHtml(cc.verificationMethod)}</p>` : ''}
    </div>`;
  }).join('\n');

  // Financial impact
  const financialHtml = w.financialImpact ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--warning-subtle);color:var(--warning)">${ICONS.dollar}</span> Financial Impact</h2>
      <div class="two-col">
        <div class="info-card">
          <h3>Compliance Cost</h3>
          <p style="font-size:20px;font-weight:800;color:var(--text);margin-top:4px">${escapeHtml(w.financialImpact.complianceCost)}</p>
          <p style="font-size:11px;color:var(--text-tertiary)">Estimated cost to achieve full compliance now</p>
        </div>
        <div class="info-card">
          <h3>Delay Cost</h3>
          <p style="font-size:20px;font-weight:800;color:var(--text);margin-top:4px">${escapeHtml(w.financialImpact.delayCost)}</p>
          <p style="font-size:11px;color:var(--text-tertiary)">Cost of delaying for compliance</p>
        </div>
      </div>
      ${w.financialImpact.riskExposureCost ? `
      <div class="info-card" style="margin-top:12px">
        <h3>Risk Exposure</h3>
        <p style="font-size:20px;font-weight:800;color:var(--danger);margin-top:4px">${escapeHtml(w.financialImpact.riskExposureCost)}</p>
        <p style="font-size:11px;color:var(--text-tertiary)">Estimated cost if the risk materializes</p>
      </div>` : ''}
      <div class="info-card" style="margin-top:12px">
        <h3>Executive Summary</h3>
        <p>${escapeHtml(w.financialImpact.summary)}</p>
      </div>
    </div>` : '';

  // Remediation plan
  const progress = w.remediationPlan.progressPercent ?? 0;
  const progressColor = progress >= 75 ? 'progress-success' : progress >= 40 ? 'progress-warning' : 'progress-danger';
  const remediationHtml = `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.wrench}</span> Remediation Plan</h2>
      <div class="info-card">
        <p>${escapeHtml(w.remediationPlan.description)}</p>
        <div class="two-col" style="margin-top:16px;gap:12px">
          <div>
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-tertiary)">Target Date</p>
            <p style="font-weight:700">${formatDate(w.remediationPlan.targetDate)}</p>
          </div>
          ${w.remediationPlan.assignedTeam ? `
          <div>
            <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-tertiary)">Assigned Team</p>
            <p style="font-weight:700">${escapeHtml(w.remediationPlan.assignedTeam)}</p>
          </div>` : ''}
        </div>
        ${w.remediationPlan.progressPercent !== undefined ? `
        <div style="margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:12px;color:var(--text-secondary)">Progress</span>
            <span style="font-size:14px;font-weight:800">${progress}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill ${progressColor}" style="width:${progress}%"></div></div>
        </div>` : ''}
        ${w.remediationPlan.backlogItemUrl ? `
        <p style="margin-top:12px"><a href="${escapeHtml(w.remediationPlan.backlogItemUrl)}" target="_blank" rel="noopener">View backlog item &nearr;</a></p>` : ''}
      </div>
    </div>`;

  // Revision history
  const revisionHtml = (w.revisionHistory ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.clock}</span> Revision History</h2>
      <div class="timeline">
        ${(w.revisionHistory ?? []).map(r => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <span class="timeline-date">${formatDate(r.date)}</span>
          <span class="timeline-author">${escapeHtml(r.author)}</span>
          <p class="timeline-change">${escapeHtml(r.change)}</p>
        </div>`).join('\n')}
      </div>
    </div>` : '';

  // Violated requirements
  const violatedReqsHtml = (w.violatedRequirementIds ?? []).length > 0
    ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${(w.violatedRequirementIds ?? []).map(r => `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:var(--danger-subtle);color:var(--danger)">${escapeHtml(r)}</span>`).join('')}</div>`
    : '';

  return `${htmlHead(`${w.title} — Architecture Waiver`, `${w.exceptionId} — ${w.title}`)}
${siteNav('waivers', '../')}

<section class="detail-hero">
  <div class="container">
    <div class="breadcrumb">
      <a href="../index.html">Home</a>
      <span>${ICONS.chevron}</span>
      <a href="index.html">Waivers</a>
      <span>${ICONS.chevron}</span>
      <span>${escapeHtml(w.exceptionId)}</span>
    </div>
    <h1>${escapeHtml(w.title)}</h1>
    <p class="desc">${escapeHtml(w.exceptionId)} &mdash; ${escapeHtml(w.targetAppName)} &bull; Violates ${escapeHtml(w.violatedStandardId)}</p>
    <div class="detail-meta">
      <span class="badge" style="background:${sb.bg};color:${sb.text};border-color:${sb.border}">${escapeHtml(sb.label)}</span>
      <span class="badge" style="background:${rb.bg};color:${rb.text};border-color:${rb.border}">${escapeHtml(w.riskSeverity)} Risk</span>
      ${w.domain ? `<span class="group-badge">${escapeHtml(w.domain)}</span>` : ''}
    </div>
    ${tagsHtml ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${tagsHtml}</div>` : ''}
  </div>
</section>

<div class="container detail-content">

  <div class="detail-section">
    <div class="two-col" style="gap:12px;font-size:13px;color:var(--text-secondary)">
      <div class="info-card">
        <h3>Requested</h3>
        <p>${formatDate(w.requestedDate)} by ${escapeHtml(w.requestedBy)}</p>
      </div>
      <div class="info-card">
        <h3>${w.approvedBy ? 'Approved' : 'Awaiting Approval'}</h3>
        <p>${w.approvalDate ? `${formatDate(w.approvalDate)} by ${escapeHtml(w.approvedBy ?? '')}` : 'Pending review'}</p>
      </div>
    </div>
    ${w.expirationDate ? `<div class="info-card" style="margin-top:12px"><h3>Expiration Date</h3><p style="font-size:16px;font-weight:700">${formatDate(w.expirationDate)}</p></div>` : ''}
  </div>

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.list}</span> Rationale</h2>
    <p style="font-size:14px;line-height:1.7">${escapeHtml(w.rationale)}</p>
  </div>

  ${w.riskDescription ? `
  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--danger-subtle);color:var(--danger)">${ICONS.alertTriangle}</span> Risk Description</h2>
    <p style="font-size:14px;line-height:1.7">${escapeHtml(w.riskDescription)}</p>
  </div>` : ''}

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.link}</span> Violated Standard</h2>
    <div class="info-card">
      <h3>${escapeHtml(w.violatedStandardName)}</h3>
      <p>${escapeHtml(w.violatedStandardId)}</p>
      ${violatedReqsHtml}
    </div>
  </div>

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.shield}</span> Compensating Controls (${w.compensatingControls.length})</h2>
    <p class="section-desc">Specific security or operational measures implemented to mitigate the risk of non-compliance.</p>
    ${controlsHtml}
  </div>

  ${financialHtml}
  ${remediationHtml}

  ${w.reviewNotes ? `
  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--purple-subtle);color:var(--purple)">${ICONS.list}</span> Review Notes</h2>
    <div class="info-card">
      <p>${escapeHtml(w.reviewNotes)}</p>
    </div>
  </div>` : ''}

  ${revisionHtml}

</div>

${siteFooter()}`;
}

// ── Waiver Index Page ────────────────────────────────────────────────

function renderIndexPage(waivers: WaiverFile[]): string {
  const domains = [...new Set(waivers.map(w => w.waiver.domain).filter(Boolean))];
  const approved = waivers.filter(w => w.waiver.status === 'APPROVED').length;
  const pending = waivers.filter(w => w.waiver.status === 'PENDING_REVIEW').length;
  const criticalHigh = waivers.filter(w => w.waiver.riskSeverity === 'CRITICAL' || w.waiver.riskSeverity === 'HIGH').length;

  const cards = waivers.map(wf => {
    const w = wf.waiver;
    const sb = statusBadge(w.status);
    const rb = riskBadge(w.riskSeverity);
    const topTags = (w.tags ?? []).slice(0, 4);
    const progress = w.remediationPlan.progressPercent ?? 0;

    return `
    <a href="${escapeHtml(wf.slug)}.html" class="waiver-card">
      <div class="waiver-card-header">
        <div>
          ${w.domain ? `<span class="group-badge">${escapeHtml(w.domain)}</span>` : ''}
          <h3 style="margin-top:6px">${escapeHtml(w.title)}</h3>
        </div>
        <span class="badge" style="background:${sb.bg};color:${sb.text};border-color:${sb.border}">${escapeHtml(sb.label)}</span>
      </div>
      <p class="waiver-card-desc">${escapeHtml(w.exceptionId)} &bull; ${escapeHtml(w.targetAppName)} &bull; ${escapeHtml(w.violatedStandardId)}</p>
      <div class="waiver-card-tags">
        <span class="badge" style="background:${rb.bg};color:${rb.text};border-color:${rb.border}">${escapeHtml(w.riskSeverity)}</span>
        ${topTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        ${(w.tags ?? []).length > 4 ? `<span class="tag" style="background:var(--card);color:var(--text-tertiary);border:1px solid var(--border)">+${(w.tags ?? []).length - 4}</span>` : ''}
      </div>
      <div class="waiver-card-footer">
        <div class="waiver-card-stat"><div class="val">${w.compensatingControls.length}</div><div class="lbl">Controls</div></div>
        <div class="waiver-card-stat"><div class="val">${progress}%</div><div class="lbl">Remediation</div></div>
        <div class="waiver-card-stat"><div class="val">${w.expirationDate ? formatDate(w.expirationDate).split(',')[0] : '—'}</div><div class="lbl">Expires</div></div>
      </div>
    </a>`;
  }).join('\n');

  return `${htmlHead('Waiver Registry — Architecture as Code', 'Architecture exception/waiver registry documenting temporary deviations from enterprise standards with risk assessments and remediation plans.')}
${siteNav('waivers', '../')}

<section class="waivers-hero">
  <div class="container" style="position:relative">
    <h1>Waiver <span>Registry</span></h1>
    <p>Architecture exception requests documenting temporary deviations from enterprise standards with risk assessments, compensating controls, and remediation plans across ${domains.length} domains.</p>
  </div>
</section>

<section class="container">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value" style="color:var(--accent)">${waivers.length}</div>
      <div class="stat-label">Total Waivers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--success)">${approved}</div>
      <div class="stat-label">Approved</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--warning)">${pending}</div>
      <div class="stat-label">Pending Review</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--danger)">${criticalHigh}</div>
      <div class="stat-label">Critical / High</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:var(--purple)">${domains.length}</div>
      <div class="stat-label">Domains</div>
    </div>
  </div>
</section>

<section class="container" style="padding-bottom:60px">
  <div class="waiver-grid">
    ${cards}
  </div>
</section>

${siteFooter()}`;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  writeln('=== Build Waiver Pages ===\n');

  const waivers = loadWaivers();
  writeln(`Loaded ${waivers.length} waivers from waivers/`);

  ensureDir(OUTPUT_DIR);

  for (const wf of waivers) {
    const html = renderWaiverPage(wf);
    const outPath = path.join(OUTPUT_DIR, `${wf.slug}.html`);
    fs.writeFileSync(outPath, html, 'utf-8');
    writeln(`  [OK] ${wf.slug}.html (${(html.length / 1024).toFixed(1)} KB)`);
  }

  const indexHtml = renderIndexPage(waivers);
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  writeln(`  [OK] index.html (${(indexHtml.length / 1024).toFixed(1)} KB)`);

  writeln(`\nDone — ${waivers.length + 1} pages written to ${path.relative(ROOT, OUTPUT_DIR)}/`);
}

main();
