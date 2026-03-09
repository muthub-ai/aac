// CLI validation script for Architecture Standards YAML files.
//
// Discovers all standards/*.yaml files, validates them against the
// JSON Schema (schema/standards.json) using Ajv, then reports results.
//
// Usage:  npx tsx scripts/validate-standards.ts
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
const STANDARDS_DIR = path.join(ROOT, "standards");
const SCHEMA_PATH = path.join(ROOT, "schema", "standards.json");

// ── Output helpers ───────────────────────────────────────────────────

function writeln(msg: string): void {
  process.stdout.write(msg + "\n");
}

// ── Per-standard result ──────────────────────────────────────────────

interface StandardResult {
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
  if (!fs.existsSync(STANDARDS_DIR)) {
    console.error("No standards/ directory found");
    process.exit(1);
  }

  const files = fs
    .readdirSync(STANDARDS_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  if (files.length === 0) {
    console.error("No YAML files found in standards/");
    process.exit(1);
  }

  const results: StandardResult[] = [];

  for (const file of files) {
    const result: StandardResult = { file, errors: [], passed: true };
    const filePath = path.join(STANDARDS_DIR, file);

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
  writeln("=== Architecture Standards Validation ===");
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
