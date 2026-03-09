// build-standard-pages.ts
//
// Generates static HTML pages for each architecture standard in the
// Standards Catalog. Uses the exact same design system (CSS, nav, footer)
// as the primary documentation site (build-docs.ts) for a seamless
// experience when navigating between systems, patterns, and standards.
//
// Usage:  npx tsx scripts/build-standard-pages.ts
// Output: build/standards/{slug}.html + build/standards/index.html
//
// These pages are merged into build/microsite/output/standards/ in CI
// so they live at /standards/*.html relative to the main site root.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, '..');
const STANDARDS_DIR = path.join(ROOT, 'standards');
const OUTPUT_DIR = path.join(ROOT, 'build', 'standards');

// ── Types (mirrored from src/types/standard.ts to avoid @/ alias) ────

interface RevisionHistoryEntry {
  date?: string;
  version?: string;
  changeType?: string;
  summary?: string;
  changedBy?: string;
  approvedBy?: string;
}

interface VersionControl {
  repository?: string;
  path?: string;
  semver?: string;
}

interface StandardMetadata {
  schemaVersion?: number;
  standardId: string;
  name: string;
  architectureDomain: string;
  architecturePrinciple?: string[];
  l4Domain?: string;
  l3Domain?: string;
  l2Domain?: string;
  standardOwner?: string;
  assignedArchitect?: string;
  lifecycleCategory?: string;
  publicationStatus: string;
  version: string;
  approvalDate: string;
  communicationDate?: string;
  plannedActiveDate?: string | null;
  conformanceMetric?: string;
  relatedChildStandards?: string[];
  tags?: string[];
  versionControl?: VersionControl;
  revisionHistory?: RevisionHistoryEntry[];
}

interface Requirement {
  id: string;
  statement: string;
  severity?: string;
  reportedMetric?: string;
  verification?: string;
  rationale?: string;
  appliesTo?: { platforms?: string[]; tiers?: string[]; exceptionsProcess?: string };
}

interface Guideline { id: string; text: string; }
interface Solution { id: string; name: string; link?: string; description?: string; }
interface AuthoritativeSource { id: string; source: string; issuingAgency: string; controlName?: string; link?: string; }
interface FaqEntry { id: string; question: string; answer: string; }
interface Definition { id: string; term: string; definition: string; }
interface Reference { id: string; link?: string; description?: string; }

interface ArchitectureStandard {
  metadata: StandardMetadata;
  scope: { inScope: string[]; outOfScope: string[] };
  requirements: Requirement[];
  guidelines?: Guideline[];
  solutions?: Solution[];
  authoritativeSources?: AuthoritativeSource[];
  faq?: FaqEntry[];
  definitions?: Definition[];
  references?: Reference[];
}

interface StandardFile {
  fileName: string;
  slug: string;
  standard: ArchitectureStandard;
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

function statusBadge(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'APPROVED': return { bg: '#dafbe1', text: '#1a7f37', border: '#1a7f37' };
    case 'DRAFT': return { bg: '#fff8c5', text: '#9a6700', border: '#bf8700' };
    case 'RETIRED': return { bg: '#eef1f5', text: '#656d76', border: '#d0d7de' };
    default: return { bg: '#eef1f5', text: '#656d76', border: '#d0d7de' };
  }
}

function lifecycleBadge(lifecycle: string | undefined): { bg: string; text: string; border: string; label: string } {
  switch (lifecycle) {
    case 'STANDARD': return { bg: 'var(--accent-subtle)', text: 'var(--accent)', border: 'var(--accent)', label: 'Standard' };
    case 'PROVISIONAL STANDARD': return { bg: 'var(--purple-subtle)', text: 'var(--purple)', border: 'var(--purple)', label: 'Provisional Standard' };
    case 'PROVISIONAL': return { bg: 'var(--orange-subtle)', text: 'var(--orange)', border: 'var(--orange)', label: 'Provisional' };
    case 'DRAFT': return { bg: 'var(--code-bg)', text: 'var(--text-secondary)', border: 'var(--border)', label: 'Draft' };
    case 'RETIRED': return { bg: 'var(--code-bg)', text: 'var(--text-tertiary)', border: 'var(--border)', label: 'Retired' };
    default: return { bg: 'var(--code-bg)', text: 'var(--text-secondary)', border: 'var(--border)', label: lifecycle ?? 'Unknown' };
  }
}

function severityBadge(severity: string | undefined): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'MUST': return { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger)' };
    case 'MUST NOT': return { bg: 'var(--danger-subtle)', text: 'var(--danger)', border: 'var(--danger)' };
    case 'SHOULD': return { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'var(--warning)' };
    case 'SHOULD NOT': return { bg: 'var(--warning-subtle)', text: 'var(--warning)', border: 'var(--warning)' };
    default: return { bg: 'var(--code-bg)', text: 'var(--text-secondary)', border: 'var(--border)' };
  }
}

// ── Data Loading ─────────────────────────────────────────────────────

function loadStandards(): StandardFile[] {
  if (!fs.existsSync(STANDARDS_DIR)) return [];
  const files = fs.readdirSync(STANDARDS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).sort();
  return files.map(fileName => {
    const content = fs.readFileSync(path.join(STANDARDS_DIR, fileName), 'utf-8');
    const standard = yaml.load(content) as ArchitectureStandard;
    return { fileName, slug: slugFromFileName(fileName), standard };
  });
}

// ── SVG Icons (same as build-docs.ts) ────────────────────────────────

const ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  book: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  lightbulb: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  helpCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

// ── Shared CSS (matches build-docs.ts / build-pattern-pages.ts) ──────

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

/* ── Standard Catalog Cards ─────── */
.standard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.standard-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); transition: all 0.2s ease; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
.standard-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-2px); color: inherit; }
.standard-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.standard-card h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.standard-card:hover h3 { color: var(--accent); }
.standard-card-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; flex: 1; }
.standard-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.standard-card-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--border-muted); }
.standard-card-stat { text-align: center; }
.standard-card-stat .val { font-size: 16px; font-weight: 700; color: var(--text); }
.standard-card-stat .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); }
.group-badge { background: var(--purple-subtle); color: var(--purple); border-color: transparent; font-size: 10px; padding: 1px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

/* ── Table ──────────────────────── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); box-shadow: var(--shadow); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead { background: var(--bg); }
th { padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-muted); vertical-align: top; }
tr:last-child td { border-bottom: none; }
tr:hover { background: var(--card-hover); }

/* ── Requirement card ───────────── */
.req-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; margin-bottom: 12px; box-shadow: var(--shadow); }
.req-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.req-id { font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: var(--code-bg); color: var(--text-secondary); }
.req-severity { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid; }
.req-statement { font-size: 14px; line-height: 1.6; color: var(--text); }
.req-rationale { font-size: 13px; color: var(--text-secondary); font-style: italic; margin-top: 6px; }
.req-details { font-size: 12px; color: var(--text-tertiary); margin-top: 8px; }

/* ── Scope grid ─────────────────── */
.scope-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 640px) { .scope-grid { grid-template-columns: 1fr; } }
.scope-box { border-radius: var(--radius-sm); padding: 20px; }
.scope-in { background: var(--success-subtle); border: 1px solid var(--success); }
.scope-out { background: var(--code-bg); border: 1px solid var(--border); }
.scope-box h3 { font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.scope-in h3 { color: var(--success); }
.scope-out h3 { color: var(--text-secondary); }
.scope-list { list-style: none; padding: 0; }
.scope-list li { padding: 4px 0; font-size: 13px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
.scope-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 7px; }
.scope-in .scope-dot { background: var(--success); }
.scope-out .scope-dot { background: var(--text-tertiary); }

/* ── FAQ ─────────────────────────── */
.faq-item { border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 12px; overflow: hidden; }
.faq-q { padding: 14px 20px; font-size: 14px; font-weight: 600; color: var(--text); background: var(--card); }
.faq-a { padding: 14px 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; border-top: 1px solid var(--border-muted); background: var(--bg); }

/* ── Hero section for index ─────── */
.standards-hero { padding: 60px 0 40px; text-align: center; position: relative; overflow: hidden; }
.standards-hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(ellipse, var(--success-subtle) 0%, transparent 70%); pointer-events: none; }
.standards-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 12px; }
.standards-hero h1 span { color: var(--success); }
.standards-hero p { font-size: 16px; color: var(--text-secondary); max-width: 640px; margin: 0 auto; line-height: 1.5; }

/* ── Stats ──────────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 32px 0 48px; }
@media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: var(--shadow); }
.stat-value { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--accent); }
.stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-top: 4px; }

/* ── Revision history ───────────── */
.timeline { margin-left: 12px; border-left: 2px solid var(--border); padding-left: 24px; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--accent); background: var(--bg); }
.timeline-version { font-size: 13px; font-weight: 700; color: var(--text); }
.timeline-date { font-size: 12px; color: var(--text-tertiary); margin-left: 8px; }
.timeline-summary { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.timeline-by { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
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

// ── Standard Detail Page ─────────────────────────────────────────────

function renderStandardPage(sf: StandardFile): string {
  const s = sf.standard;
  const meta = s.metadata;
  const sb = statusBadge(meta.publicationStatus);
  const lb = lifecycleBadge(meta.lifecycleCategory);

  // Tags
  const tagsHtml = (meta.tags ?? []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');

  // Architecture principles
  const principlesHtml = (meta.architecturePrinciple ?? []).map(p =>
    `<span class="badge" style="background:var(--purple-subtle);color:var(--purple);border-color:transparent">${escapeHtml(p)}</span>`
  ).join(' ');

  // Scope
  const scopeHtml = `
    <div class="scope-grid">
      <div class="scope-box scope-in">
        <h3>${ICONS.check} In Scope</h3>
        <ul class="scope-list">
          ${s.scope.inScope.map(item => `<li><span class="scope-dot"></span>${escapeHtml(item)}</li>`).join('\n')}
        </ul>
      </div>
      <div class="scope-box scope-out">
        <h3>Out of Scope</h3>
        <ul class="scope-list">
          ${s.scope.outOfScope.map(item => `<li><span class="scope-dot"></span>${escapeHtml(item)}</li>`).join('\n')}
        </ul>
      </div>
    </div>`;

  // Requirements
  const requirementsHtml = s.requirements.map(req => {
    const sv = severityBadge(req.severity);
    return `
    <div class="req-card">
      <div class="req-header">
        <span class="req-id">${escapeHtml(req.id)}</span>
        ${req.severity ? `<span class="req-severity" style="background:${sv.bg};color:${sv.text};border-color:${sv.border}">${escapeHtml(req.severity)}</span>` : ''}
      </div>
      <p class="req-statement">${escapeHtml(req.statement)}</p>
      ${req.rationale ? `<p class="req-rationale">${escapeHtml(req.rationale)}</p>` : ''}
      ${req.verification || req.appliesTo ? `<div class="req-details">
        ${req.verification ? `<strong>Verification:</strong> ${escapeHtml(req.verification)}<br>` : ''}
        ${req.appliesTo?.platforms ? `<strong>Platforms:</strong> ${req.appliesTo.platforms.map(p => escapeHtml(p)).join(', ')}<br>` : ''}
        ${req.appliesTo?.tiers ? `<strong>Tiers:</strong> ${req.appliesTo.tiers.map(t => escapeHtml(t)).join(', ')}` : ''}
      </div>` : ''}
    </div>`;
  }).join('\n');

  // Guidelines
  const guidelinesHtml = (s.guidelines ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--purple-subtle);color:var(--purple)">${ICONS.lightbulb}</span> Guidelines</h2>
      ${(s.guidelines ?? []).map(g => `
      <div class="info-card" style="margin-bottom:8px">
        <h3 style="font-family:monospace;color:var(--text-secondary)">${escapeHtml(g.id)}</h3>
        <p>${escapeHtml(g.text)}</p>
      </div>`).join('\n')}
    </div>` : '';

  // Solutions
  const solutionsHtml = (s.solutions ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.box}</span> Approved Solutions</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Solution</th><th>Description</th></tr></thead>
          <tbody>
            ${(s.solutions ?? []).map(sol => `
            <tr>
              <td style="font-weight:600">${escapeHtml(sol.name)}</td>
              <td>${sol.description ? escapeHtml(sol.description) : '<span style="color:var(--text-tertiary)">—</span>'}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  // Authoritative Sources
  const sourcesHtml = (s.authoritativeSources ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.book}</span> Authoritative Sources</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Source</th><th>Issuing Agency</th><th>Control</th></tr></thead>
          <tbody>
            ${(s.authoritativeSources ?? []).map(src => `
            <tr>
              <td style="font-weight:500">${escapeHtml(src.source)}</td>
              <td>${escapeHtml(src.issuingAgency)}</td>
              <td style="color:var(--text-secondary)">${src.controlName ? escapeHtml(src.controlName) : '—'}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  // Definitions
  const definitionsHtml = (s.definitions ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--code-bg);color:var(--text-secondary)">${ICONS.book}</span> Definitions</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Term</th><th>Definition</th></tr></thead>
          <tbody>
            ${(s.definitions ?? []).map(d => `
            <tr>
              <td style="font-weight:600">${escapeHtml(d.term)}</td>
              <td>${escapeHtml(d.definition)}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  // FAQ
  const faqHtml = (s.faq ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--warning-subtle);color:var(--warning)">${ICONS.helpCircle}</span> Frequently Asked Questions</h2>
      ${(s.faq ?? []).map(f => `
      <div class="faq-item">
        <div class="faq-q">${escapeHtml(f.question)}</div>
        <div class="faq-a">${escapeHtml(f.answer)}</div>
      </div>`).join('\n')}
    </div>` : '';

  // Revision History
  const revisionHtml = (meta.revisionHistory ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.clock}</span> Revision History</h2>
      <div class="timeline">
        ${(meta.revisionHistory ?? []).reverse().map(r => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <span class="timeline-version">v${escapeHtml(r.version ?? '')}</span>
          ${r.date ? `<span class="timeline-date">${formatDate(r.date.split('T')[0])}</span>` : ''}
          ${r.changeType ? `<span class="badge" style="background:var(--accent-subtle);color:var(--accent);border-color:transparent;margin-left:6px;font-size:10px">${escapeHtml(r.changeType)}</span>` : ''}
          ${r.summary ? `<p class="timeline-summary">${escapeHtml(r.summary)}</p>` : ''}
          ${r.changedBy ? `<p class="timeline-by">By ${escapeHtml(r.changedBy)}${r.approvedBy ? ` · Approved by ${escapeHtml(r.approvedBy)}` : ''}</p>` : ''}
        </div>`).join('\n')}
      </div>
    </div>` : '';

  // References
  const referencesHtml = (s.references ?? []).length > 0 ? `
    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.link}</span> References</h2>
      <ul style="list-style:none;padding:0">
        ${(s.references ?? []).map(r => `
        <li style="padding:6px 0;font-size:13px;border-bottom:1px solid var(--border-muted)">
          <strong style="font-family:monospace;font-size:11px;color:var(--text-secondary)">${escapeHtml(r.id)}</strong>
          ${r.description ? ` — ${escapeHtml(r.description)}` : ''}
          ${r.link ? ` <a href="${escapeHtml(r.link)}" target="_blank" rel="noopener">&nearr;</a>` : ''}
        </li>`).join('\n')}
      </ul>
    </div>` : '';

  // Meta info line
  const metaItems: string[] = [];
  if (meta.standardOwner) metaItems.push(`<strong>Owner:</strong> ${escapeHtml(meta.standardOwner)}`);
  if (meta.assignedArchitect) metaItems.push(`<strong>Architect:</strong> ${escapeHtml(meta.assignedArchitect)}`);
  if (meta.conformanceMetric) metaItems.push(`<strong>Metric:</strong> ${escapeHtml(meta.conformanceMetric)}`);

  return `${htmlHead(`${meta.name} — Architecture Standard`, `${meta.name} — ${meta.architectureDomain} standard v${meta.version}`)}
${siteNav('standards', '../')}

<section class="detail-hero">
  <div class="container">
    <div class="breadcrumb">
      <a href="../index.html">Home</a>
      <span>${ICONS.chevron}</span>
      <a href="index.html">Standards</a>
      <span>${ICONS.chevron}</span>
      <span>${escapeHtml(meta.name)}</span>
    </div>
    <h1>${escapeHtml(meta.name)}</h1>
    <p class="desc">${escapeHtml(meta.standardId)} &mdash; ${escapeHtml(meta.architectureDomain)} &bull; Version ${escapeHtml(meta.version)} &bull; Approved ${formatDate(meta.approvalDate)}</p>
    <div class="detail-meta">
      <span class="badge" style="background:${sb.bg};color:${sb.text};border-color:${sb.border}">${escapeHtml(meta.publicationStatus)}</span>
      <span class="badge" style="background:${lb.bg};color:${lb.text};border-color:${lb.border}">${escapeHtml(lb.label)}</span>
      <span class="badge" style="background:var(--card);color:var(--text-secondary);border-color:var(--border)">v${escapeHtml(meta.version)}</span>
      <span class="group-badge">${escapeHtml(meta.architectureDomain)}</span>
    </div>
    ${principlesHtml ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${principlesHtml}</div>` : ''}
    ${tagsHtml ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${tagsHtml}</div>` : ''}
  </div>
</section>

<div class="container detail-content">

  ${metaItems.length > 0 ? `<div class="detail-section">
    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--text-secondary)">
      ${metaItems.map(m => `<span>${m}</span>`).join('')}
    </div>
  </div>` : ''}

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.shield}</span> Scope</h2>
    ${scopeHtml}
  </div>

  <div class="detail-section">
    <h2><span class="section-icon" style="background:var(--danger-subtle);color:var(--danger)">${ICONS.list}</span> Requirements (${s.requirements.length})</h2>
    <p class="section-desc">Requirements use <a href="https://datatracker.ietf.org/doc/html/rfc2119" target="_blank" rel="noopener">RFC 2119</a> severity levels.</p>
    ${requirementsHtml}
  </div>

  ${guidelinesHtml}
  ${solutionsHtml}
  ${sourcesHtml}
  ${definitionsHtml}
  ${faqHtml}
  ${revisionHtml}
  ${referencesHtml}

</div>

${siteFooter()}`;
}

// ── Standard Index Page ──────────────────────────────────────────────

function renderIndexPage(standards: StandardFile[]): string {
  const domains = [...new Set(standards.map(s => s.standard.metadata.architectureDomain))];
  const totalReqs = standards.reduce((sum, s) => sum + s.standard.requirements.length, 0);
  const totalGuidelines = standards.reduce((sum, s) => sum + (s.standard.guidelines ?? []).length, 0);

  const cards = standards.map(sf => {
    const meta = sf.standard.metadata;
    const sb = statusBadge(meta.publicationStatus);
    const lb = lifecycleBadge(meta.lifecycleCategory);
    const topTags = (meta.tags ?? []).slice(0, 4);
    const reqCount = sf.standard.requirements.length;

    return `
    <a href="${escapeHtml(sf.slug)}.html" class="standard-card">
      <div class="standard-card-header">
        <div>
          <span class="group-badge">${escapeHtml(meta.architectureDomain)}</span>
          <h3 style="margin-top:6px">${escapeHtml(meta.name)}</h3>
        </div>
        <span class="badge" style="background:${sb.bg};color:${sb.text};border-color:${sb.border}">${escapeHtml(meta.publicationStatus)}</span>
      </div>
      <p class="standard-card-desc">${escapeHtml(meta.standardId)} &bull; v${escapeHtml(meta.version)} &bull; ${escapeHtml(lb.label)}</p>
      <div class="standard-card-tags">
        ${topTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        ${(meta.tags ?? []).length > 4 ? `<span class="tag" style="background:var(--card);color:var(--text-tertiary);border:1px solid var(--border)">+${(meta.tags ?? []).length - 4}</span>` : ''}
      </div>
      <div class="standard-card-footer">
        <div class="standard-card-stat"><div class="val">${reqCount}</div><div class="lbl">Requirements</div></div>
        <div class="standard-card-stat"><div class="val">${(sf.standard.guidelines ?? []).length}</div><div class="lbl">Guidelines</div></div>
        <div class="standard-card-stat"><div class="val">${(sf.standard.solutions ?? []).length}</div><div class="lbl">Solutions</div></div>
      </div>
    </a>`;
  }).join('\n');

  return `${htmlHead('Standards Catalog — Architecture as Code', 'Enterprise architecture standards with requirements, guidelines, solutions, and authoritative sources.')}
${siteNav('standards', '../')}

<section class="standards-hero">
  <div class="container" style="position:relative">
    <h1>Standards <span>Catalog</span></h1>
    <p>Enterprise architecture standards defining governance policies, compliance rules, and best practices across ${domains.length} domains.</p>
  </div>
</section>

<section class="container">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">${standards.length}</div>
      <div class="stat-label">Standards</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${domains.length}</div>
      <div class="stat-label">Domains</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalReqs}</div>
      <div class="stat-label">Requirements</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalGuidelines}</div>
      <div class="stat-label">Guidelines</div>
    </div>
  </div>
</section>

<section class="container" style="padding-bottom:60px">
  <div class="standard-grid">
    ${cards}
  </div>
</section>

${siteFooter()}`;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  writeln('=== Build Standard Pages ===\n');

  const standards = loadStandards();
  writeln(`Loaded ${standards.length} standards from standards/`);

  ensureDir(OUTPUT_DIR);

  for (const sf of standards) {
    const html = renderStandardPage(sf);
    const outPath = path.join(OUTPUT_DIR, `${sf.slug}.html`);
    fs.writeFileSync(outPath, html, 'utf-8');
    writeln(`  [OK] ${sf.slug}.html (${(html.length / 1024).toFixed(1)} KB)`);
  }

  const indexHtml = renderIndexPage(standards);
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  writeln(`  [OK] index.html (${(indexHtml.length / 1024).toFixed(1)} KB)`);

  writeln(`\nDone — ${standards.length + 1} pages written to ${path.relative(ROOT, OUTPUT_DIR)}/`);
}

main();
