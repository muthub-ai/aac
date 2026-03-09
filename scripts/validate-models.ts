// CLI validation script for Architecture-as-Code model files.
//
// Discovers all model/<system>/system.yaml and metadata.json files,
// validates them against the JSON Schema (Ajv), Zod metadata schema,
// and cross-reference checks, then reports results per system.
//
// Usage:  npx tsx scripts/validate-models.ts
// Exit:   0 = all pass, 1 = any failure

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import {
  validateMetadata,
  validateNewFormatRelationshipRefs,
} from "../src/lib/validation/system-schema.ts";

// ── Paths ────────────────────────────────────────────────────────────

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, "..");
const MODEL_DIR = path.join(ROOT, "model");
const SCHEMA_PATH = path.join(ROOT, "schema", "application-schema.json");

// ── Output helpers (no console.log) ──────────────────────────────────

function writeln(msg: string): void {
  process.stdout.write(msg + "\n");
}

// ── Per-system result ────────────────────────────────────────────────

interface SystemResult {
  dir: string;
  yamlSchemaErrors: string[];
  metadataErrors: string[];
  referenceErrors: string[];
  passed: boolean;
}

// ── Main ─────────────────────────────────────────────────────────────

function main(): void {
  // Load & compile JSON Schema with Ajv + format validation
  const schemaText = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const schema: Record<string, unknown> = JSON.parse(
    schemaText,
  ) as Record<string, unknown>;

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);

  // Discover model directories
  const entries = fs.readdirSync(MODEL_DIR, { withFileTypes: true });
  const systemDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (systemDirs.length === 0) {
    console.error("No model directories found under model/");
    process.exit(1);
  }

  const results: SystemResult[] = [];

  for (const dir of systemDirs) {
    const result: SystemResult = {
      dir,
      yamlSchemaErrors: [],
      metadataErrors: [],
      referenceErrors: [],
      passed: true,
    };

    const yamlPath = path.join(MODEL_DIR, dir, "system.yaml");
    const metadataPath = path.join(MODEL_DIR, dir, "metadata.json");

    // ── Validate system.yaml ──────────────────────────────────────

    if (!fs.existsSync(yamlPath)) {
      result.yamlSchemaErrors.push("system.yaml not found");
      result.passed = false;
    } else {
      let parsed: unknown;
      try {
        const content = fs.readFileSync(yamlPath, "utf-8");
        parsed = yaml.load(content);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Invalid YAML syntax";
        result.yamlSchemaErrors.push(msg);
        result.passed = false;
        parsed = undefined;
      }

      if (parsed !== undefined && parsed !== null) {
        // JSON Schema validation via Ajv
        const valid = validateSchema(parsed);
        if (!valid && validateSchema.errors) {
          for (const err of validateSchema.errors) {
            const field = err.instancePath || "/";
            const message = err.message ?? "unknown error";
            result.yamlSchemaErrors.push(`${field}: ${message}`);
          }
          result.passed = false;
        }

        // Cross-reference validation
        const refResult = validateNewFormatRelationshipRefs(parsed);
        if (!refResult.success) {
          result.referenceErrors.push(...refResult.errors);
          result.passed = false;
        }
      }
    }

    // ── Validate metadata.json ────────────────────────────────────

    if (!fs.existsSync(metadataPath)) {
      result.metadataErrors.push("metadata.json not found");
      result.passed = false;
    } else {
      try {
        const content = fs.readFileSync(metadataPath, "utf-8");
        const metadata: unknown = JSON.parse(content);
        const metaResult = validateMetadata(metadata);
        if (!metaResult.success) {
          result.metadataErrors.push(...metaResult.errors);
          result.passed = false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid JSON";
        result.metadataErrors.push(msg);
        result.passed = false;
      }
    }

    results.push(result);
  }

  // ── Report ──────────────────────────────────────────────────────

  writeln("");
  writeln("=== Architecture-as-Code Model Validation ===");
  writeln("");

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.passed) {
      writeln(`  \u2713  ${r.dir}`);
      passed++;
    } else {
      writeln(`  \u2717  ${r.dir}`);
      failed++;

      if (r.yamlSchemaErrors.length > 0) {
        writeln("     YAML / Schema errors:");
        for (const e of r.yamlSchemaErrors) {
          writeln(`       - ${e}`);
        }
      }
      if (r.referenceErrors.length > 0) {
        writeln("     Reference errors:");
        for (const e of r.referenceErrors) {
          writeln(`       - ${e}`);
        }
      }
      if (r.metadataErrors.length > 0) {
        writeln("     Metadata errors:");
        for (const e of r.metadataErrors) {
          writeln(`       - ${e}`);
        }
      }
    }
  }

  writeln("");
  writeln(`Summary: ${passed} passed, ${failed} failed`);
  writeln("");

  process.exit(failed > 0 ? 1 : 0);
}

main();
