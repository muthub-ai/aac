// build-docs.ts
//
// Generates a professional multi-page static documentation site from
// Architecture-as-Code YAML models. Reads model/*.yaml + metadata.json,
// generates rendered C4 diagrams via PlantUML server URLs, and outputs
// a complete static site to build/microsite/output/.
//
// Usage:  npx tsx scripts/build-docs.ts
// Output: build/microsite/output/{index.html, systems/<id>.html}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import plantumlEncoder from 'plantuml-encoder';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, '..');
const MODEL_DIR = path.join(ROOT, 'model');
const DIAGRAMS_DIR = path.join(ROOT, 'src', 'docs', 'diagrams');
const OUTPUT_DIR = path.join(ROOT, 'build', 'microsite', 'output');

// ── Types ────────────────────────────────────────────────────────────

interface Metadata {
  id: string;
  name: string;
  repoCount: number;
  linesOfCode: number;
  deployableUnits: number;
  domainModules: number;
  domainObjects: number;
  domainBehaviors: number;
  lastScan: string;
  branchName: string;
}

interface Container {
  id: string;
  name: string;
  description: string;
  technology: string;
  tags: string[];
  properties: Record<string, string>;
}

interface SoftwareSystem {
  id: string;
  name: string;
  description: string;
  group: string;
  tags: string[];
  disposition: string;
  dataClassification: string;
  containers: Container[];
}

interface Person {
  id: string;
  name: string;
  description: string;
}

interface ViewDef {
  key: string;
  title: string;
  description: string;
  type: 'systemContext' | 'container' | 'deployment';
}

interface SystemInfo {
  dirName: string;
  name: string;
  description: string;
  metadata: Metadata;
  people: Person[];
  systems: SoftwareSystem[];
  views: ViewDef[];
  pumlFiles: Map<string, string>;
  totalContainers: number;
  totalRelationships: number;
  deploymentNodeCount: number;
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

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function plantumlSvgUrl(pumlSource: string): string {
  const encoded = plantumlEncoder.encode(pumlSource);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

// ── Disposition badge colors ─────────────────────────────────────────

function dispositionColor(d: string): { bg: string; text: string; border: string } {
  switch (d?.toLowerCase()) {
    case 'invest': return { bg: '#dafbe1', text: '#1a7f37', border: '#1a7f37' };
    case 'tolerate': return { bg: '#fff8c5', text: '#9a6700', border: '#bf8700' };
    case 'migrate': return { bg: '#fff1e5', text: '#bc4c00', border: '#d18616' };
    case 'eliminate': return { bg: '#ffebe9', text: '#cf222e', border: '#cf222e' };
    default: return { bg: '#eef1f5', text: '#656d76', border: '#d0d7de' };
  }
}

function classificationBadge(c: string): { icon: string; color: string } {
  switch (c?.toLowerCase()) {
    case 'confidential': return { icon: 'lock', color: '#cf222e' };
    case 'internal use': return { icon: 'shield', color: '#bf8700' };
    case 'public': return { icon: 'globe', color: '#1a7f37' };
    default: return { icon: 'file', color: '#656d76' };
  }
}

// ── Data Loading ─────────────────────────────────────────────────────

function countRelationships(doc: Record<string, unknown>): number {
  let count = 0;
  const model = doc.model as Record<string, unknown[]> | undefined;
  if (!model) return 0;
  const people = (model.people || []) as Record<string, unknown>[];
  const systems = (model.softwareSystems || []) as Record<string, unknown>[];
  for (const p of people) {
    count += ((p.relationships as unknown[]) || []).length;
  }
  for (const s of systems) {
    count += ((s.relationships as unknown[]) || []).length;
    const containers = (s.containers || []) as Record<string, unknown>[];
    for (const c of containers) {
      count += ((c.relationships as unknown[]) || []).length;
    }
  }
  return count;
}

function countDeploymentNodes(doc: Record<string, unknown>): number {
  let count = 0;
  const model = doc.model as Record<string, unknown[]> | undefined;
  if (!model) return 0;
  const nodes = (model.deploymentNodes || []) as Record<string, unknown>[];
  function walk(n: Record<string, unknown>): void {
    count++;
    const children = (n.children || []) as Record<string, unknown>[];
    const infra = (n.infrastructureNodes || []) as Record<string, unknown>[];
    for (const c of children) walk(c);
    for (const i of infra) count++;
  }
  for (const n of nodes) walk(n);
  return count;
}

function loadSystems(): SystemInfo[] {
  if (!fs.existsSync(MODEL_DIR)) return [];

  const entries = fs.readdirSync(MODEL_DIR, { withFileTypes: true });
  const systems: SystemInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(MODEL_DIR, entry.name);
    const yamlPath = path.join(dir, 'system.yaml');
    const metaPath = path.join(dir, 'metadata.json');
    if (!fs.existsSync(yamlPath)) continue;

    const yamlText = fs.readFileSync(yamlPath, 'utf-8');
    const doc = yaml.load(yamlText) as Record<string, unknown>;
    const model = doc.model as Record<string, unknown[]> | undefined;
    if (!model) continue;

    const metadata: Metadata = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      : { id: entry.name, name: String(doc.name || entry.name), repoCount: 0, linesOfCode: 0, deployableUnits: 0, domainModules: 0, domainObjects: 0, domainBehaviors: 0, lastScan: new Date().toISOString(), branchName: 'main' };

    const people: Person[] = ((model.people || []) as Record<string, unknown>[]).map(p => ({
      id: String(p.id), name: String(p.name), description: String(p.description || ''),
    }));

    const rawSystems = (model.softwareSystems || []) as Record<string, unknown>[];
    const softwareSystems: SoftwareSystem[] = rawSystems.map(s => {
      const rawContainers = (s.containers || []) as Record<string, unknown>[];
      return {
        id: String(s.id),
        name: String(s.name),
        description: String(s.description || ''),
        group: String(s.group || ''),
        tags: String(s.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        disposition: String(s.disposition || ''),
        dataClassification: String(s.dataClassification || ''),
        containers: rawContainers.map(c => ({
          id: String(c.id),
          name: String(c.name),
          description: String(c.description || ''),
          technology: String(c.technology || ''),
          tags: String(c.tags || '').split(',').map(t => t.trim()).filter(Boolean),
          properties: (c.properties || {}) as Record<string, string>,
        })),
      };
    });

    const views: ViewDef[] = [];
    const viewsDef = doc.views as Record<string, unknown[]> | undefined;
    if (viewsDef) {
      for (const v of (viewsDef.systemContextViews || []) as Record<string, string>[]) {
        views.push({ key: v.key, title: v.title || v.key, description: v.description || '', type: 'systemContext' });
      }
      for (const v of (viewsDef.containerViews || []) as Record<string, string>[]) {
        views.push({ key: v.key, title: v.title || v.key, description: v.description || '', type: 'container' });
      }
      for (const v of (viewsDef.deploymentViews || []) as Record<string, string>[]) {
        views.push({ key: v.key, title: v.title || v.key, description: v.description || '', type: 'deployment' });
      }
    }

    // Load .puml files if they exist
    const pumlFiles = new Map<string, string>();
    const diagramDir = path.join(DIAGRAMS_DIR, entry.name);
    if (fs.existsSync(diagramDir)) {
      for (const f of fs.readdirSync(diagramDir)) {
        if (f.endsWith('.puml')) {
          pumlFiles.set(f.replace('.puml', ''), fs.readFileSync(path.join(diagramDir, f), 'utf-8'));
        }
      }
    }

    const totalContainers = softwareSystems.reduce((sum, s) => sum + s.containers.length, 0);

    systems.push({
      dirName: entry.name,
      name: String(doc.name || metadata.name),
      description: String(doc.description || ''),
      metadata,
      people,
      systems: softwareSystems,
      views,
      pumlFiles,
      totalContainers,
      totalRelationships: countRelationships(doc),
      deploymentNodeCount: countDeploymentNodes(doc),
    });
  }

  return systems.sort((a, b) => a.name.localeCompare(b.name));
}

// ── CSS Styles ───────────────────────────────────────────────────────

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
code, pre { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; }
img { max-width: 100%; height: auto; }

/* ── Layout ─────────────────────── */
.container { max-width: 1152px; margin: 0 auto; padding: 0 24px; }
@media (min-width: 640px) { .container { padding: 0 40px; } }

/* ── Nav ────────────────────────── */
.nav { position: sticky; top: 0; z-index: 50; background: var(--bg-alt); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }
.nav-inner { display: flex; align-items: center; height: 56px; gap: 16px; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text); text-decoration: none; }
.nav-brand svg { width: 28px; height: 28px; color: var(--accent); }
.nav-links { display: flex; gap: 4px; margin-left: auto; }
.nav-link { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--text-secondary); transition: all 0.15s; }
.nav-link:hover { color: var(--text); background: var(--accent-subtle); }
.nav-link.active { color: var(--accent); background: var(--accent-subtle); }

/* ── Hero ───────────────────────── */
.hero { padding: 80px 0 60px; text-align: center; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%); pointer-events: none; }
.hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; background: var(--accent-subtle); color: var(--accent); margin-bottom: 20px; }
.hero h1 { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
@media (max-width: 640px) { .hero h1 { font-size: 32px; } }
.hero h1 span { color: var(--accent); }
.hero p { font-size: 18px; color: var(--text-secondary); max-width: 640px; margin: 0 auto 40px; line-height: 1.5; }

/* ── Stats Row ──────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 60px; }
@media (max-width: 640px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: var(--shadow); }
.stat-value { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--accent); }
.stat-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-top: 4px; }

/* ── System Cards ───────────────── */
.systems-section { padding-bottom: 80px; }
.section-header { margin-bottom: 32px; }
.section-header h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.section-header p { color: var(--text-secondary); font-size: 15px; }
.system-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
.system-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); transition: all 0.2s ease; display: flex; flex-direction: column; text-decoration: none; color: inherit; }
.system-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); transform: translateY(-2px); color: inherit; }
.system-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.system-card h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.system-card:hover h3 { color: var(--accent); }
.system-card-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.system-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: var(--accent-subtle); color: var(--accent); }
.system-card-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--border-muted); }
.system-card-stat { text-align: center; }
.system-card-stat .val { font-size: 16px; font-weight: 700; color: var(--text); }
.system-card-stat .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); }

/* ── Badge ──────────────────────── */
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid; }
.group-badge { background: var(--purple-subtle); color: var(--purple); border-color: transparent; font-size: 10px; padding: 1px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }

/* ── System Detail Page ─────────── */
.detail-hero { padding: 48px 0 32px; border-bottom: 1px solid var(--border); }
.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-tertiary); margin-bottom: 16px; }
.breadcrumb a { color: var(--text-secondary); }
.breadcrumb a:hover { color: var(--accent); }
.detail-hero h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px; }
.detail-hero .desc { font-size: 16px; color: var(--text-secondary); line-height: 1.6; max-width: 720px; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.meta-item { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; background: var(--card); border: 1px solid var(--border); }
.meta-icon { width: 14px; height: 14px; }

/* ── Detail Sections ────────────── */
.detail-content { padding: 40px 0 80px; }
.detail-section { margin-bottom: 56px; }
.detail-section h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 2px solid var(--border); }
.detail-section h2 .section-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; margin-right: 8px; vertical-align: middle; }
.detail-section > p { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }

/* ── Diagram ────────────────────── */
.diagram-group { margin-bottom: 40px; }
.diagram-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.diagram-card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-muted); display: flex; align-items: center; justify-content: space-between; }
.diagram-card-header h3 { font-size: 15px; font-weight: 600; }
.diagram-type-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 4px; }
.type-systemContext { background: var(--accent-subtle); color: var(--accent); }
.type-container { background: var(--success-subtle); color: var(--success); }
.type-deployment { background: var(--purple-subtle); color: var(--purple); }
.type-full { background: var(--orange-subtle); color: var(--orange); }
.diagram-card-body { padding: 20px; background: var(--bg); text-align: center; min-height: 200px; }
.diagram-card-body img { border-radius: 8px; max-height: 600px; }
.diagram-card-footer { padding: 12px 20px; font-size: 12px; color: var(--text-tertiary); border-top: 1px solid var(--border-muted); }

/* ── Table ──────────────────────── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); box-shadow: var(--shadow); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead { background: var(--bg); }
th { padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--border-muted); vertical-align: top; }
tr:last-child td { border-bottom: none; }
tr:hover { background: var(--card-hover); }
.tech-badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: var(--code-bg); color: var(--text-secondary); border: 1px solid var(--border-muted); }

/* ── People cards ───────────────── */
.people-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.person-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; box-shadow: var(--shadow); }
.person-card h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.person-card p { font-size: 12px; color: var(--text-secondary); }
.person-icon { width: 36px; height: 36px; border-radius: 50%; background: var(--accent-subtle); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--accent); }

/* ── Pipeline Section ───────────── */
.pipeline-stages { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.pipeline-stage { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; text-align: center; box-shadow: var(--shadow); }
.pipeline-stage .stage-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
.pipeline-stage h4 { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.pipeline-stage p { font-size: 11px; color: var(--text-secondary); }

/* ── Footer ─────────────────────── */
footer { border-top: 1px solid var(--border); padding: 32px 0; text-align: center; color: var(--text-tertiary); font-size: 13px; }
footer a { color: var(--text-secondary); }
`;

// ── SVG Icons (inline) ───────────────────────────────────────────────

const ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
  container: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
  deploy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>',
  relationship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  git: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v6m0 6v6"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  diagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
};

// ── HTML Generators ──────────────────────────────────────────────────

function htmlHead(title: string, extraHead = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2'><path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/></svg>">
  <style>${CSS}</style>
  ${extraHead}
</head>
<body>`;
}

function nav(activePage: string, isSubpage = false): string {
  const prefix = isSubpage ? '../' : '';
  return `
<nav class="nav">
  <div class="container nav-inner">
    <a href="${prefix}index.html" class="nav-brand">
      ${ICONS.logo}
      Architecture as Code
    </a>
    <div class="nav-links">
      <a href="${prefix}index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Overview</a>
      <a href="${prefix}index.html#systems" class="nav-link ${activePage === 'systems' ? 'active' : ''}">Systems</a>
      <a href="${prefix}index.html#pipeline" class="nav-link">Pipeline</a>
      <a href="https://github.com/muthub-ai/aac" class="nav-link" target="_blank" rel="noopener">GitHub &nearr;</a>
    </div>
  </div>
</nav>`;
}

function footer(): string {
  return `
<footer>
  <div class="container">
    <p>Architecture as Code &mdash; auto-generated from <a href="https://github.com/muthub-ai/aac">YAML models</a> via CI/CD pipeline</p>
    <p style="margin-top:4px;font-size:11px;color:var(--text-tertiary)">Built with C4 Model &bull; PlantUML &bull; Asciidoctor &bull; GitHub Actions</p>
  </div>
</footer>
</body>
</html>`;
}

// ── Index Page ────────────────────────────────────────────────────────

function buildIndexPage(systems: SystemInfo[]): string {
  const totalPeople = systems.reduce((s, sys) => s + sys.people.length, 0);
  const totalSystems = systems.reduce((s, sys) => s + sys.systems.length, 0);
  const totalContainers = systems.reduce((s, sys) => s + sys.totalContainers, 0);
  const totalRels = systems.reduce((s, sys) => s + sys.totalRelationships, 0);
  const totalLoC = systems.reduce((s, sys) => s + sys.metadata.linesOfCode, 0);
  const totalDeployable = systems.reduce((s, sys) => s + sys.metadata.deployableUnits, 0);

  const systemCards = systems.map(sys => {
    const primary = sys.systems[0];
    const dc = dispositionColor(primary?.disposition || '');
    const topTags = (primary?.tags || []).slice(0, 5);
    return `
    <a href="systems/${sys.dirName}.html" class="system-card">
      <div class="system-card-header">
        <div>
          ${primary?.group ? `<span class="group-badge">${escapeHtml(primary.group)}</span>` : ''}
          <h3 style="margin-top:${primary?.group ? '6px' : '0'}">${escapeHtml(sys.metadata.name)}</h3>
        </div>
        <span class="badge" style="background:${dc.bg};color:${dc.text};border-color:${dc.border}">${escapeHtml(primary?.disposition || 'N/A')}</span>
      </div>
      <p class="system-card-desc">${escapeHtml(sys.description)}</p>
      <div class="system-card-tags">
        ${topTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="system-card-footer">
        <div class="system-card-stat"><div class="val">${sys.totalContainers}</div><div class="lbl">Containers</div></div>
        <div class="system-card-stat"><div class="val">${sys.views.length}</div><div class="lbl">Views</div></div>
        <div class="system-card-stat"><div class="val">${formatNumber(sys.metadata.linesOfCode)}</div><div class="lbl">Lines</div></div>
      </div>
    </a>`;
  }).join('');

  return `${htmlHead('Architecture as Code — Enterprise Architecture Documentation')}
${nav('home')}

<section class="hero">
  <div class="container" style="position:relative">
    <div class="hero-badge">${ICONS.check} CI/CD Validated Architecture</div>
    <h1>Enterprise Architecture<br><span>as Code</span></h1>
    <p>Auto-generated documentation from declarative YAML models using the C4 model.
    Every system is validated, diagrammed, and published through our CI/CD pipeline.</p>
  </div>
</section>

<section class="container">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">${systems.length}</div>
      <div class="stat-label">Systems Modeled</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalContainers}</div>
      <div class="stat-label">Containers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatNumber(totalLoC)}</div>
      <div class="stat-label">Lines of Code</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalDeployable}</div>
      <div class="stat-label">Deployable Units</div>
    </div>
  </div>
</section>

<section class="container systems-section" id="systems">
  <div class="section-header">
    <h2>System Catalog</h2>
    <p>${systems.length} systems &bull; ${totalPeople} actors &bull; ${totalSystems} software systems &bull; ${totalRels} relationships</p>
  </div>
  <div class="system-grid">
    ${systemCards}
  </div>
</section>

<section class="container" id="pipeline" style="padding-bottom:80px">
  <div class="section-header">
    <h2>CI/CD Pipeline</h2>
    <p>Every push triggers automated validation, compliance checks, diagram generation, and documentation publishing.</p>
  </div>
  <div class="pipeline-stages">
    <div class="pipeline-stage">
      <div class="stage-num">1</div>
      <h4>Model Validation</h4>
      <p>JSON Schema + Zod validation of all YAML models</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">2</div>
      <h4>Test Suite</h4>
      <p>288 unit tests via Vitest + ESLint checks</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">3</div>
      <h4>Architecture Lint</h4>
      <p>5 enterprise policy compliance rules</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">4</div>
      <h4>Diagram Generation</h4>
      <p>PlantUML + Draw.io for all views</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">5</div>
      <h4>Documentation</h4>
      <p>Static site from models via Asciidoctor.js</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">6</div>
      <h4>PR Feedback</h4>
      <p>Diagram previews posted to pull requests</p>
    </div>
    <div class="pipeline-stage">
      <div class="stage-num">7</div>
      <h4>Publish</h4>
      <p>Deploy to GitHub Pages on merge to main</p>
    </div>
  </div>
</section>

${footer()}`;
}

// ── System Detail Page ───────────────────────────────────────────────

function buildSystemPage(sys: SystemInfo): string {
  const primary = sys.systems[0];
  const dc = dispositionColor(primary?.disposition || '');
  const cl = classificationBadge(primary?.dataClassification || '');

  // Meta badges
  const metaBadges = [
    primary?.disposition ? `<span class="meta-item"><span class="badge" style="background:${dc.bg};color:${dc.text};border-color:${dc.border}">${escapeHtml(primary.disposition)}</span></span>` : '',
    primary?.dataClassification ? `<span class="meta-item" style="color:${cl.color}">${ICONS.shield} ${escapeHtml(primary.dataClassification)}</span>` : '',
    `<span class="meta-item">${ICONS.code} ${formatNumber(sys.metadata.linesOfCode)} LoC</span>`,
    `<span class="meta-item">${ICONS.deploy} ${sys.metadata.deployableUnits} deployable units</span>`,
    `<span class="meta-item">${ICONS.git} ${escapeHtml(sys.metadata.branchName)}</span>`,
    `<span class="meta-item">${ICONS.clock} ${timeAgo(sys.metadata.lastScan)}</span>`,
  ].filter(Boolean).join('');

  // Diagrams section
  let diagramsHtml = '';
  const diagramEntries: Array<{ key: string; title: string; desc: string; type: string }> = [];

  // Full diagram first
  if (sys.pumlFiles.has('full')) {
    diagramEntries.push({ key: 'full', title: 'Complete Architecture Overview', desc: 'All components, relationships, and external systems in a single view.', type: 'full' });
  }

  // Then per-view diagrams
  for (const view of sys.views) {
    if (sys.pumlFiles.has(view.key)) {
      diagramEntries.push({ key: view.key, title: view.title, desc: view.description, type: view.type });
    }
  }

  if (diagramEntries.length > 0) {
    diagramsHtml = diagramEntries.map(d => {
      const puml = sys.pumlFiles.get(d.key) || '';
      const svgUrl = plantumlSvgUrl(puml);
      return `
      <div class="diagram-group">
        <div class="diagram-card">
          <div class="diagram-card-header">
            <h3>${escapeHtml(d.title)}</h3>
            <span class="diagram-type-badge type-${d.type}">${d.type === 'systemContext' ? 'System Context' : d.type === 'container' ? 'Container' : d.type === 'deployment' ? 'Deployment' : 'Full'}</span>
          </div>
          <div class="diagram-card-body">
            <img src="${escapeHtml(svgUrl)}" alt="${escapeHtml(d.title)}" loading="lazy">
          </div>
          ${d.desc ? `<div class="diagram-card-footer">${escapeHtml(d.desc)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } else {
    diagramsHtml = '<p style="color:var(--text-tertiary);font-style:italic">No diagrams generated yet. Run <code>npm run build:diagrams</code> to generate C4 diagrams.</p>';
  }

  // People section
  const peopleHtml = sys.people.length > 0 ? `
    <div class="people-grid">
      ${sys.people.map(p => `
        <div class="person-card">
          <div class="person-icon">${ICONS.person}</div>
          <h4>${escapeHtml(p.name)}</h4>
          <p>${escapeHtml(p.description)}</p>
        </div>
      `).join('')}
    </div>` : '<p style="color:var(--text-tertiary)">No actors defined.</p>';

  // Systems + Containers table
  const allContainers: Array<{ sysName: string; c: Container }> = [];
  for (const s of sys.systems) {
    for (const c of s.containers) {
      allContainers.push({ sysName: s.name, c });
    }
  }

  const containersHtml = allContainers.length > 0 ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Container</th><th>System</th><th>Technology</th><th>Description</th><th>Type</th></tr>
        </thead>
        <tbody>
          ${allContainers.map(({ sysName, c }) => `
            <tr>
              <td><strong>${escapeHtml(c.name)}</strong></td>
              <td style="color:var(--text-secondary)">${escapeHtml(sysName)}</td>
              <td><span class="tech-badge">${escapeHtml(c.technology)}</span></td>
              <td style="max-width:300px;font-size:12px;color:var(--text-secondary)">${escapeHtml(c.description)}</td>
              <td style="font-size:12px;color:var(--text-tertiary)">${escapeHtml(c.properties?.type || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '<p style="color:var(--text-tertiary)">No containers defined.</p>';

  // Software systems overview
  const systemsOverviewHtml = sys.systems.length > 0 ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>System</th><th>Group</th><th>Disposition</th><th>Classification</th><th>Containers</th><th>Description</th></tr>
        </thead>
        <tbody>
          ${sys.systems.map(s => {
            const sdc = dispositionColor(s.disposition);
            return `
            <tr>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td style="font-size:12px">${escapeHtml(s.group)}</td>
              <td><span class="badge" style="background:${sdc.bg};color:${sdc.text};border-color:${sdc.border};font-size:11px">${escapeHtml(s.disposition || 'N/A')}</span></td>
              <td style="font-size:12px">${escapeHtml(s.dataClassification)}</td>
              <td style="text-align:center;font-weight:600">${s.containers.length}</td>
              <td style="max-width:280px;font-size:12px;color:var(--text-secondary)">${escapeHtml(s.description)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : '';

  // Metadata summary cards
  const metaCards = `
    <div class="stats-row" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${sys.metadata.repoCount}</div><div class="stat-label">Repositories</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${formatNumber(sys.metadata.linesOfCode)}</div><div class="stat-label">Lines of Code</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${sys.metadata.deployableUnits}</div><div class="stat-label">Deployable Units</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${sys.metadata.domainModules}</div><div class="stat-label">Domain Modules</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${sys.metadata.domainObjects}</div><div class="stat-label">Domain Objects</div></div>
      <div class="stat-card"><div class="stat-value" style="font-size:24px">${sys.metadata.domainBehaviors}</div><div class="stat-label">Domain Behaviors</div></div>
    </div>`;

  // Tags section
  const allTags = new Set<string>();
  for (const s of sys.systems) {
    for (const t of s.tags) allTags.add(t);
    for (const c of s.containers) {
      for (const t of c.tags) allTags.add(t);
    }
  }
  const tagsHtml = allTags.size > 0
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${[...allTags].sort().map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  return `${htmlHead(`${sys.metadata.name} — Architecture as Code`)}
${nav('systems', true)}

<section class="detail-hero">
  <div class="container">
    <div class="breadcrumb">
      <a href="../index.html">Home</a>
      <span style="width:16px;height:16px;display:inline-flex">${ICONS.chevron}</span>
      <span>${escapeHtml(sys.metadata.name)}</span>
    </div>
    <h1>${escapeHtml(sys.metadata.name)}</h1>
    <p class="desc">${escapeHtml(sys.description)}</p>
    <div class="detail-meta">${metaBadges}</div>
  </div>
</section>

<section class="detail-content">
  <div class="container">

    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--accent-subtle);color:var(--accent)">${ICONS.diagram}</span>Architecture Diagrams</h2>
      <p>C4 model diagrams rendered from declarative YAML definitions. Each view shows a different perspective of the system architecture.</p>
      ${diagramsHtml}
    </div>

    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--purple-subtle);color:var(--purple)">${ICONS.box}</span>Software Systems</h2>
      <p>${sys.systems.length} software systems composing this architecture.</p>
      ${systemsOverviewHtml}
    </div>

    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--success-subtle);color:var(--success)">${ICONS.container}</span>Containers</h2>
      <p>${allContainers.length} containers across all systems.</p>
      ${containersHtml}
    </div>

    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--orange-subtle);color:var(--orange)">${ICONS.person}</span>Actors &amp; Personas</h2>
      <p>${sys.people.length} actors interact with this system.</p>
      ${peopleHtml}
    </div>

    <div class="detail-section">
      <h2><span class="section-icon" style="background:var(--warning-subtle);color:var(--warning)">${ICONS.code}</span>Codebase Metrics</h2>
      ${metaCards}
      ${tagsHtml ? `<div style="margin-top:20px"><h3 style="font-size:14px;font-weight:600;margin-bottom:10px">Technology Tags</h3>${tagsHtml}</div>` : ''}
    </div>

  </div>
</section>

${footer()}`;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  writeln('Build Documentation Site');
  writeln('========================');
  writeln('');

  const systems = loadSystems();
  writeln(`  Found ${systems.length} system(s)`);

  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, 'systems'));

  // Build index page
  const indexHtml = buildIndexPage(systems);
  const indexPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  const indexSize = Math.round(fs.statSync(indexPath).size / 1024);
  writeln(`  Generated: index.html (${indexSize} KB)`);

  // Build per-system pages
  for (const sys of systems) {
    const pageHtml = buildSystemPage(sys);
    const pagePath = path.join(OUTPUT_DIR, 'systems', `${sys.dirName}.html`);
    fs.writeFileSync(pagePath, pageHtml, 'utf-8');
    const pageSize = Math.round(fs.statSync(pagePath).size / 1024);
    writeln(`  Generated: systems/${sys.dirName}.html (${pageSize} KB)`);
  }

  writeln('');
  writeln(`  Total: ${1 + systems.length} pages`);
  writeln(`  Output: ${path.relative(ROOT, OUTPUT_DIR)}`);
  writeln('');
  writeln('Done.');
}

main();
