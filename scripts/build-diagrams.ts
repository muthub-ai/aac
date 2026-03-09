// build-diagrams.ts
//
// CLI script that generates C4 architecture diagrams (PlantUML + Draw.io XML)
// from YAML model files found under each model/<system>/system.yaml.
//
// Usage:  npx tsx scripts/build-diagrams.ts
//
// Output: src/docs/diagrams/<system-id>/{full,<view-key>}.{puml,drawio.xml}

// ── jsdom bootstrap (must run before drawio-export uses DOM APIs) ────
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document as unknown as Document;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;

// ── Imports ──────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '../src/types/c4';
import type { NewYamlArchitecture } from '../src/types/yaml-schema';
import type { ViewInfo } from '../src/lib/parser/new-to-old-transform';

import { yamlToGraph } from '../src/lib/parser/yaml-to-graph';
import { filterGraphByView } from '../src/lib/graph/filter-by-view';
import { applyDagreLayout } from '../src/lib/layout/dagre-layout';
import { exportToDrawioXml } from '../src/lib/export/drawio-export';
import { exportToPlantUml } from '../src/lib/export/plantuml-export';
import { isNewFormat, extractViews } from '../src/lib/parser/new-to-old-transform';

// ── Constants ────────────────────────────────────────────────────────
const ROOT = process.cwd();
const MODEL_DIR = path.join(ROOT, 'model');
const OUTPUT_BASE = path.join(ROOT, 'src', 'docs', 'diagrams');

// ── Types ────────────────────────────────────────────────────────────
interface DiagramResult {
  name: string;
  pumlOk: boolean;
  drawioOk: boolean;
}

interface SystemSummary {
  systemId: string;
  diagrams: DiagramResult[];
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Recursively create a directory if it doesn't exist. */
function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Scan model/ for subdirectories that contain a system.yaml file.
 * Returns absolute paths to every discovered system.yaml.
 */
function discoverModelFiles(): string[] {
  if (!fs.existsSync(MODEL_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(MODEL_DIR, { withFileTypes: true });
  const modelFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const yamlPath = path.join(MODEL_DIR, entry.name, 'system.yaml');
    if (fs.existsSync(yamlPath)) {
      modelFiles.push(yamlPath);
    }
  }

  return modelFiles.sort();
}

/**
 * Layout the graph, then export to both PlantUML and Draw.io XML.
 * Wraps each export in try/catch so a failure in one format doesn't
 * prevent the other from being generated.
 */
function generateAndSave(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
  outDir: string,
  diagramName: string,
): DiagramResult {
  const result: DiagramResult = { name: diagramName, pumlOk: false, drawioOk: false };

  // Apply dagre layout to get positioned nodes
  const positionedNodes = applyDagreLayout(nodes, edges);

  // ── PlantUML ────────────────────────────────────────────────────
  try {
    const puml = exportToPlantUml(positionedNodes, edges);
    const pumlPath = path.join(outDir, `${diagramName}.puml`);
    fs.writeFileSync(pumlPath, puml, 'utf-8');
    result.pumlOk = true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`    [!] PlantUML export failed for "${diagramName}": ${message}`);
  }

  // ── Draw.io XML ─────────────────────────────────────────────────
  try {
    const drawioXml = exportToDrawioXml(positionedNodes, edges);
    const drawioPath = path.join(outDir, `${diagramName}.drawio.xml`);
    fs.writeFileSync(drawioPath, drawioXml, 'utf-8');
    result.drawioOk = true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`    [!] Draw.io export failed for "${diagramName}": ${message}`);
  }

  return result;
}

/**
 * Extract view definitions from the raw YAML document.
 * Returns an empty array for old-format YAML or if no views are defined.
 */
function extractViewsFromYaml(yamlText: string): ViewInfo[] {
  let rawDoc: unknown;
  try {
    rawDoc = yaml.load(yamlText);
  } catch {
    return [];
  }

  if (rawDoc && isNewFormat(rawDoc)) {
    return extractViews(rawDoc as NewYamlArchitecture);
  }

  return [];
}

/**
 * Process a single model file: parse, generate full diagram, then per-view diagrams.
 */
function processModel(modelPath: string): SystemSummary {
  const systemId = path.basename(path.dirname(modelPath));
  const outDir = path.join(OUTPUT_BASE, systemId);
  ensureDir(outDir);

  console.log(`\n  Processing: ${systemId}`);
  console.log(`    Source: ${path.relative(ROOT, modelPath)}`);
  console.log(`    Output: ${path.relative(ROOT, outDir)}`);

  const diagrams: DiagramResult[] = [];

  // Read and parse the YAML model
  const yamlText = fs.readFileSync(modelPath, 'utf-8');
  const graph = yamlToGraph(yamlText);

  if (graph.nodes.length === 0) {
    console.log('    [!] No nodes found in model, skipping.');
    return { systemId, diagrams };
  }

  console.log(`    Parsed ${graph.nodes.length} node(s), ${graph.edges.length} edge(s)`);

  // ── Full (unfiltered) diagram ───────────────────────────────────
  console.log('    -> full diagram');
  const fullResult = generateAndSave(graph.nodes, graph.edges, outDir, 'full');
  diagrams.push(fullResult);

  // ── Per-view diagrams ───────────────────────────────────────────
  const views = extractViewsFromYaml(yamlText);

  if (views.length === 0) {
    console.log('    No view definitions found.');
  } else {
    console.log(`    Found ${views.length} view(s)`);

    for (const view of views) {
      console.log(`    -> ${view.key} (${view.type})`);

      const filtered = filterGraphByView(graph.nodes, graph.edges, view);

      if (filtered.nodes.length === 0) {
        console.log(`       [!] Empty after filtering, skipping.`);
        continue;
      }

      console.log(`       ${filtered.nodes.length} node(s), ${filtered.edges.length} edge(s)`);
      const viewResult = generateAndSave(filtered.nodes, filtered.edges, outDir, view.key);
      diagrams.push(viewResult);
    }
  }

  return { systemId, diagrams };
}

// ── Main ─────────────────────────────────────────────────────────────
function main(): void {
  console.log('Build Diagrams');
  console.log('==============');

  const modelFiles = discoverModelFiles();

  if (modelFiles.length === 0) {
    console.error('No model files found at model/*/system.yaml');
    process.exit(1);
  }

  console.log(`Found ${modelFiles.length} model file(s)`);

  const summaries: SystemSummary[] = [];

  for (const modelPath of modelFiles) {
    try {
      const summary = processModel(modelPath);
      summaries.push(summary);
    } catch (err: unknown) {
      const systemId = path.basename(path.dirname(modelPath));
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n  [!] Failed to process ${systemId}: ${message}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n==============');
  console.log('Summary\n');

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const summary of summaries) {
    const diagramCount = summary.diagrams.length;
    const pumlCount = summary.diagrams.filter((d) => d.pumlOk).length;
    const drawioCount = summary.diagrams.filter((d) => d.drawioOk).length;

    totalGenerated += pumlCount + drawioCount;
    totalFailed += (diagramCount - pumlCount) + (diagramCount - drawioCount);

    console.log(`  ${summary.systemId}:`);
    console.log(`    ${diagramCount} diagram set(s) | ${pumlCount} .puml | ${drawioCount} .drawio.xml`);

    for (const d of summary.diagrams) {
      const pumlStatus = d.pumlOk ? 'ok' : 'FAIL';
      const drawioStatus = d.drawioOk ? 'ok' : 'FAIL';
      console.log(`      ${d.name}: puml=${pumlStatus}, drawio=${drawioStatus}`);
    }
  }

  console.log(`\n  Total files generated: ${totalGenerated}`);
  if (totalFailed > 0) {
    console.log(`  Total failures: ${totalFailed}`);
  }
  console.log(`  Output: ${path.relative(ROOT, OUTPUT_BASE)}/`);
  console.log('\nDone.');
}

main();
