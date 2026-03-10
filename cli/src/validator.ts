/* ── Validator — AJV-based schema validation engine ──────────── */

import fs from 'node:fs';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

export interface ValidationError {
  path: string;
  message: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  filePath: string;
  errors: ValidationError[];
}

/** Detect whether a schema uses JSON Schema draft 2020-12 */
function is2020Schema(schema: Record<string, unknown>): boolean {
  const s = schema['$schema'] as string | undefined;
  if (!s) return false;
  return s.includes('2020-12') || s.includes('draft/2020');
}

export class Validator {
  /** Validate a local file against a JSON Schema object */
  validate(filePath: string, schema: Record<string, unknown>): ValidationResult {
    // Parse the target file
    const parsed = this.parseFile(filePath);

    // Create the appropriate AJV instance
    const ajv = this.createAjv(schema);
    const validateFn = ajv.compile(schema);

    const valid = validateFn(parsed) as boolean;

    const errors: ValidationError[] = [];
    if (!valid && validateFn.errors) {
      for (const err of validateFn.errors) {
        errors.push({
          path: err.instancePath || '/',
          message: err.message ?? 'unknown error',
          params: err.params as Record<string, unknown> | undefined,
        });
      }
    }

    return { valid, filePath, errors };
  }

  /** Parse YAML or JSON file from disk */
  private parseFile(filePath: string): unknown {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (filePath.endsWith('.json')) {
      return JSON.parse(content);
    }

    // YAML (default for .yaml, .yml, or unknown extensions)
    return yaml.load(content);
  }

  /** Create AJV instance matching the schema's JSON Schema draft */
  private createAjv(schema: Record<string, unknown>): Ajv {
    const opts = { allErrors: true, strict: false };

    if (is2020Schema(schema)) {
      const ajv = new Ajv2020(opts);
      addFormats(ajv);
      return ajv as unknown as Ajv;
    }

    const ajv = new Ajv(opts);
    addFormats(ajv);
    return ajv;
  }
}
