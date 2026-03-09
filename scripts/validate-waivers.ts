// CLI validation script for Architecture Waiver YAML files.
//
// Discovers all waivers/*.yaml files, validates them against the
// JSON Schema (schema/waivers.json) using Ajv, then reports results.
//
// Usage:  npx tsx scripts/validate-waivers.ts
// Exit:   0 = all pass, 1 = any failure

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// ── Paths ────────────────────────────────────────────────────────────

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, "..");
const WAIVERS_DIR = path.join(ROOT, "waivers");
const SCHEMA_PATH = path.join(ROOT, "schema", "waivers.json");

// ── Output helpers ───────────────────────────────────────────────────

function writeln(msg: string): void {
  process.stdout.write(msg + "\n");
}

// ── Per-waiver result ────────────────────────────────────────────────

interface WaiverResult {
  file: string;
  errors: string[];
  passed: boolean;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  // Load & compile JSON Schema with Ajv + format validation
  const schemaText = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const schema: Record<string, unknown> = JSON.parse(schemaText) as Record<string, unknown>;

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  // Discover YAML files
  if (!fs.existsSync(WAIVERS_DIR)) {
    console.error("No waivers/ directory found");
    process.exit(1);
  }

  const files = fs
    .readdirSync(WAIVERS_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  if (files.length === 0) {
    console.error("No YAML files found in waivers/");
    process.exit(1);
  }

  const results: WaiverResult[] = [];

  for (const file of files) {
    const result: WaiverResult = { file, errors: [], passed: true };
    const filePath = path.join(WAIVERS_DIR, file);

    let parsed: unknown;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      parsed = yaml.load(content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid YAML syntax";
      result.errors.push(msg);
      result.passed = false;
      parsed = undefined;
    }

    if (parsed !== undefined && parsed !== null) {
      const valid = validateSchema(parsed);
      if (!valid && validateSchema.errors) {
        for (const err of validateSchema.errors) {
          const field = err.instancePath || "/";
          const message = err.message ?? "unknown error";
          result.errors.push(`${field}: ${message}`);
        }
        result.passed = false;
      }
    }

    results.push(result);
  }

  // ── Report ──────────────────────────────────────────────────────

  writeln("");
  writeln("=== Architecture Waiver Validation ===");
  writeln("");

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.passed) {
      writeln(`  \u2713  ${r.file}`);
      passed++;
    } else {
      writeln(`  \u2717  ${r.file}`);
      failed++;
      for (const e of r.errors) {
        writeln(`       - ${e}`);
      }
    }
  }

  writeln("");
  writeln(`Summary: ${passed} passed, ${failed} failed`);
  writeln("");

  process.exit(failed > 0 ? 1 : 0);
}

main();
