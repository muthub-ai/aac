// build-docs.ts
//
// Generates a static HTML documentation site from AsciiDoc sources
// using Asciidoctor.js. Replaces docToolchain — no Java required.
//
// Usage:  npx tsx scripts/build-docs.ts
// Output: build/microsite/output/index.html

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Asciidoctor from '@asciidoctor/core';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, '..');
const DOCS_DIR = path.join(ROOT, 'src', 'docs');
const OUTPUT_DIR = path.join(ROOT, 'build', 'microsite', 'output');
const INDEX_ADOC = path.join(DOCS_DIR, 'index.adoc');

function writeln(msg: string): void {
  process.stdout.write(msg + '\n');
}

function main(): void {
  writeln('Build Documentation');
  writeln('===================');

  if (!fs.existsSync(INDEX_ADOC)) {
    console.error(`Error: ${INDEX_ADOC} not found`);
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Initialize Asciidoctor
  const asciidoctor = Asciidoctor();

  writeln(`  Source: ${path.relative(ROOT, INDEX_ADOC)}`);
  writeln(`  Output: ${path.relative(ROOT, OUTPUT_DIR)}`);
  writeln('');

  // Convert AsciiDoc to HTML
  const html = asciidoctor.convertFile(INDEX_ADOC, {
    to_file: false,
    safe: 'unsafe', // needed for include:: directives
    base_dir: DOCS_DIR,
    attributes: {
      toc: 'left',
      toclevels: '3',
      sectnums: '',
      icons: 'font',
      'source-highlighter': 'highlight.js',
      stylesheet: '',
    },
  }) as string;

  // Wrap in a full HTML page with embedded styles
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Architecture as Code — Documentation</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
  <style>
    :root {
      --bg: #f6f8fa;
      --card: #ffffff;
      --text: #1f2328;
      --muted: #656d76;
      --border: #d0d7de;
      --accent: #2563eb;
      --code-bg: #f0f3f6;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117;
        --card: #161b22;
        --text: #e6edf3;
        --muted: #8b949e;
        --border: #30363d;
        --accent: #58a6ff;
        --code-bg: #1c2128;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      display: flex;
      min-height: 100vh;
    }
    #toc.toc2 {
      position: fixed;
      left: 0;
      top: 0;
      width: 280px;
      height: 100vh;
      overflow-y: auto;
      padding: 24px 16px;
      background: var(--card);
      border-right: 1px solid var(--border);
      font-size: 13px;
    }
    #toc.toc2 #toctitle {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--text);
    }
    #toc.toc2 ul { list-style: none; padding-left: 0; }
    #toc.toc2 ul ul { padding-left: 14px; }
    #toc.toc2 a {
      color: var(--muted);
      text-decoration: none;
      display: block;
      padding: 3px 8px;
      border-radius: 4px;
    }
    #toc.toc2 a:hover { color: var(--accent); background: var(--code-bg); }
    #content {
      margin-left: 280px;
      max-width: 860px;
      padding: 40px 48px;
      flex: 1;
    }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    h2 { font-size: 22px; font-weight: 600; margin-top: 40px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
    h3 { font-size: 18px; font-weight: 600; margin-top: 28px; margin-bottom: 8px; }
    h4 { font-size: 15px; font-weight: 600; margin-top: 20px; margin-bottom: 6px; }
    p { margin-bottom: 12px; }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 13px;
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    pre code { background: none; padding: 0; }
    .title { font-weight: 600; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
    .sectionbody { margin-bottom: 20px; }
    .sect1 + .sect1 { margin-top: 32px; }
    @media (max-width: 768px) {
      #toc.toc2 { position: static; width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
      #content { margin-left: 0; padding: 24px 16px; }
      body { flex-direction: column; }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;

  // Write output
  const outputPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(outputPath, fullHtml, 'utf-8');

  const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
  writeln(`  Generated: ${path.relative(ROOT, outputPath)} (${sizeKb} KB)`);
  writeln('');
  writeln('Done.');
}

main();
