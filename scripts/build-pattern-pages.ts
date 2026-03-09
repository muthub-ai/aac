// build-pattern-pages.ts
//
// Generates static HTML pages for each architecture pattern in the
// Pattern Catalog. Reads pattern data from src/lib/data/mock-patterns.ts
// and outputs self-contained HTML pages to build/patterns/.
//
// Usage:  npx tsx scripts/build-pattern-pages.ts
// Output: build/patterns/{pattern-id}.html + build/patterns/index.html

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

function maturityColor(m: string): string {
  switch (m) {
    case 'Production Ready': return '#1a7f37';
    case 'Beta': return '#9a6700';
    case 'Draft': return '#656d76';
    case 'Deprecated': return '#cf222e';
    default: return '#656d76';
  }
}

// ── Load pattern data ────────────────────────────────────────────────
// We dynamically import the compiled mock-patterns module.
// Since scripts use tsx and the source uses @/ aliases, we load it via
// a direct relative path and strip the diagram sources (they use
// separate imports).

async function loadPatterns(): Promise<PatternData[]> {
  // Use dynamic import with tsx — the project's tsconfig paths are
  // resolved by tsx automatically when run from the project root.
  const mod = await import('../src/lib/data/mock-patterns.js');
  return mod.MOCK_PATTERNS as PatternData[];
}

// ── HTML Templates ───────────────────────────────────────────────────

function pageStyles(): string {
  return `
    :root {
      --bg: #ffffff; --bg-card: #f6f8fa; --bg-muted: #f0f2f5;
      --text: #1f2328; --text-muted: #656d76; --text-link: #0969da;
      --border: #d0d7de; --success: #1a7f37; --warning: #9a6700;
      --ring: #0969da; --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Noto Sans, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117; --bg-card: #161b22; --bg-muted: #21262d;
        --text: #e6edf3; --text-muted: #8b949e; --text-link: #58a6ff;
        --border: #30363d; --success: #3fb950; --warning: #d29922;
        --ring: #58a6ff;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 2.5rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem; }
    p { margin-bottom: 0.75rem; color: var(--text); font-size: 0.9rem; }
    .meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .tag { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 500; background: var(--bg-muted); color: var(--text-muted); border: 1px solid var(--border); margin: 2px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
    .card h3 { color: var(--text); }
    .card p { color: var(--text-muted); margin-bottom: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    th { background: var(--bg-muted); text-align: left; padding: 0.6rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    td { padding: 0.6rem 1rem; border-top: 1px solid var(--border); }
    tr:nth-child(even) td { background: var(--bg-card); }
    .nfr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .nfr-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; }
    .nfr-card .label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .nfr-card .value { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-top: 2px; }
    .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 640px) { .pros-cons { grid-template-columns: 1fr; } }
    .pros { background: #dafbe1; border: 1px solid #1a7f37; border-radius: 8px; padding: 1rem; }
    .cons { background: #fff8c5; border: 1px solid #bf8700; border-radius: 8px; padding: 1rem; }
    @media (prefers-color-scheme: dark) {
      .pros { background: rgba(63, 185, 80, 0.1); border-color: #3fb950; }
      .cons { background: rgba(210, 153, 34, 0.1); border-color: #d29922; }
    }
    .pros h3 { color: var(--success); } .cons h3 { color: var(--warning); }
    ul.check-list, ul.warn-list { list-style: none; padding: 0; }
    ul.check-list li, ul.warn-list li { padding: 0.25rem 0; font-size: 0.875rem; padding-left: 1.5rem; position: relative; }
    ul.check-list li::before { content: "\\2713"; position: absolute; left: 0; color: var(--success); font-weight: 700; }
    ul.warn-list li::before { content: "\\26A0"; position: absolute; left: 0; color: var(--warning); }
    .constraint-list li { padding: 0.3rem 0; font-size: 0.875rem; color: var(--text); }
    .diagram-container { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 1rem; background: #fff; text-align: center; padding: 1rem; }
    @media (prefers-color-scheme: dark) { .diagram-container { background: #0d1117; } }
    .diagram-container img { max-width: 100%; height: auto; }
    .diagram-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .stepper { margin-left: 1rem; border-left: 2px solid var(--border); padding-left: 1.5rem; }
    .stepper .step { position: relative; padding-bottom: 1.25rem; }
    .stepper .step:last-child { padding-bottom: 0; }
    .stepper .step-num { position: absolute; left: -2.35rem; top: 0; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 2px solid var(--ring); background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--ring); }
    .stepper .step p { font-size: 0.875rem; margin: 0; padding-top: 0.1rem; }
    a.back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text-link); text-decoration: none; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.5rem; }
    a.back-link:hover { text-decoration: underline; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--text-muted); }
  `;
}

function renderPatternPage(pattern: PatternData): string {
  const matColor = maturityColor(pattern.maturity);

  const diagramsHtml = pattern.diagrams.map(d => {
    const url = plantumlSvgUrl(d.plantumlSource);
    return `
      <div class="diagram-container">
        <div class="diagram-label">${escapeHtml(d.label)}</div>
        <img src="${escapeHtml(url)}" alt="${escapeHtml(d.label)} diagram for ${escapeHtml(pattern.name)}" loading="lazy" />
      </div>`;
  }).join('\n');

  const designHtml = pattern.designConsiderations.map(dc => `
    <div class="card">
      <h3>${escapeHtml(dc.title)}</h3>
      <p>${escapeHtml(dc.description)}</p>
    </div>`).join('\n');

  const productsHtml = pattern.productsUsed.map(p => `
    <tr>
      <td style="font-weight:500">${escapeHtml(p.name)}</td>
      <td style="color:var(--text-muted)">${escapeHtml(p.role)}</td>
    </tr>`).join('\n');

  const nfrHtml = pattern.nonFunctionalRequirements.map(n => `
    <div class="nfr-card">
      <div class="label">${escapeHtml(n.metric)}</div>
      <div class="value">${escapeHtml(n.target)}</div>
    </div>`).join('\n');

  const advantagesHtml = pattern.advantages.map(a =>
    `<li>${escapeHtml(a)}</li>`).join('\n');

  const considerationsHtml = pattern.considerations.map(c =>
    `<li>${escapeHtml(c)}</li>`).join('\n');

  const constraintsHtml = pattern.constraints.map(c =>
    `<li>${escapeHtml(c)}</li>`).join('\n');

  const overviewParas = pattern.architectureOverview.split('\n\n').map(p =>
    `<p>${escapeHtml(p)}</p>`).join('\n');

  const stepsHtml = pattern.gettingStarted.map(s => `
    <div class="step">
      <div class="step-num">${s.step}</div>
      <p>${escapeHtml(s.title)}</p>
    </div>`).join('\n');

  const tagsHtml = pattern.tags.map(t =>
    `<span class="tag">${escapeHtml(t)}</span>`).join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pattern.name)} — Architecture Pattern</title>
  <meta name="description" content="${escapeHtml(pattern.description)}">
  <style>${pageStyles()}</style>
</head>
<body>
  <div class="container">
    <a href="index.html" class="back-link">&larr; Back to Pattern Catalog</a>

    <div class="meta">
      <span class="badge" style="background:${matColor}20;color:${matColor};border:1px solid ${matColor}">${escapeHtml(pattern.maturity)}</span>
      <span class="badge" style="background:var(--bg-muted);color:var(--text-muted);border:1px solid var(--border)">${escapeHtml(pattern.exposure)}</span>
      <span class="badge" style="background:var(--bg-muted);color:var(--text-muted);border:1px solid var(--border)">v${escapeHtml(pattern.version)}</span>
    </div>

    <h1>${escapeHtml(pattern.name)}</h1>
    <p style="color:var(--text-muted);font-size:0.95rem;max-width:720px">${escapeHtml(pattern.description)}</p>
    <div style="margin:0.75rem 0 1.5rem">${tagsHtml}</div>

    <h2>Architecture Overview</h2>
    ${overviewParas}

    <h2>Architecture Diagrams</h2>
    ${diagramsHtml}

    <h2>Design Considerations</h2>
    ${designHtml}

    <h2>Products Used</h2>
    <table>
      <thead><tr><th>Product</th><th>Role</th></tr></thead>
      <tbody>${productsHtml}</tbody>
    </table>

    <h2>Non-Functional Requirements</h2>
    <div class="nfr-grid">${nfrHtml}</div>

    <h2>Advantages &amp; Considerations</h2>
    <div class="pros-cons">
      <div class="pros">
        <h3>Advantages</h3>
        <ul class="check-list">${advantagesHtml}</ul>
      </div>
      <div class="cons">
        <h3>Considerations</h3>
        <ul class="warn-list">${considerationsHtml}</ul>
      </div>
    </div>

    <h2>Constraints &amp; Limitations</h2>
    <ul class="constraint-list">${constraintsHtml}</ul>

    <h2>Cost Profile</h2>
    <div class="card">
      <p>${escapeHtml(pattern.costProfile)}</p>
    </div>

    <h2>Getting Started</h2>
    <div class="stepper">${stepsHtml}</div>

    <div class="footer">
      <p>Maintained by <strong>${escapeHtml(pattern.maintainerTeam)}</strong> &middot; v${escapeHtml(pattern.version)}${pattern.docsUrl ? ` &middot; <a href="${escapeHtml(pattern.docsUrl)}" style="color:var(--text-link)">Full Documentation</a>` : ''}</p>
      <p>Generated by the Architecture as Code pipeline.</p>
    </div>
  </div>
</body>
</html>`;
}

function renderIndexPage(patterns: PatternData[]): string {
  const cards = patterns.map(p => {
    const matColor = maturityColor(p.maturity);
    return `
      <a href="${p.id}.html" style="text-decoration:none;color:inherit">
        <div class="card" style="cursor:pointer;transition:border-color 0.15s">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
            <span class="badge" style="background:${matColor}20;color:${matColor};border:1px solid ${matColor}">${escapeHtml(p.maturity)}</span>
            <span class="badge" style="background:var(--bg-muted);color:var(--text-muted);border:1px solid var(--border)">${escapeHtml(p.exposure)}</span>
            <span style="margin-left:auto;font-size:0.75rem;color:var(--text-muted)">v${escapeHtml(p.version)}</span>
          </div>
          <h3 style="font-size:1rem;margin-bottom:0.25rem">${escapeHtml(p.name)}</h3>
          <p style="font-size:0.85rem;color:var(--text-muted);margin:0">${escapeHtml(p.description.slice(0, 160))}${p.description.length > 160 ? '...' : ''}</p>
        </div>
      </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pattern Catalog — Architecture as Code</title>
  <style>${pageStyles()}</style>
</head>
<body>
  <div class="container">
    <h1>Pattern Catalog</h1>
    <p style="color:var(--text-muted);margin-bottom:2rem">${patterns.length} architecture patterns available. Click a pattern for full documentation.</p>
    ${cards}
    <div class="footer">
      <p>Generated by the Architecture as Code pipeline.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  writeln('=== Build Pattern Pages ===\n');

  const patterns = await loadPatterns();
  writeln(`Loaded ${patterns.length} patterns from mock-patterns.ts`);

  ensureDir(OUTPUT_DIR);

  // Generate individual pattern pages
  for (const pattern of patterns) {
    const html = renderPatternPage(pattern);
    const outPath = path.join(OUTPUT_DIR, `${pattern.id}.html`);
    fs.writeFileSync(outPath, html, 'utf-8');
    writeln(`  [OK] ${pattern.id}.html (${(html.length / 1024).toFixed(1)} KB)`);
  }

  // Generate index page
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
