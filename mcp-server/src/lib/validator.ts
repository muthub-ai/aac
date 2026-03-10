/* ── Validator — AJV-based schema validation engine ── */

import yaml from 'js-yaml';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv') as typeof import('ajv').default;
const Ajv2020 = require('ajv/dist/2020') as typeof import('ajv').default;
const addFormats = require('ajv-formats') as (ajv: InstanceType<typeof Ajv>) => void;

export interface ValidationError {
  path: string;
  message: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Detect whether a schema uses JSON Schema draft 2020-12 */
function is2020Schema(schema: Record<string, unknown>): boolean {
  const s = schema['$schema'] as string | undefined;
  if (!s) return false;
  return s.includes('2020-12') || s.includes('draft/2020');
}

/** Create the appropriate AJV instance for a schema */
function createAjv(schema: Record<string, unknown>): InstanceType<typeof Ajv> {
  const opts = { allErrors: true, strict: false };
  if (is2020Schema(schema)) {
    const ajv = new Ajv2020(opts) as InstanceType<typeof Ajv>;
    addFormats(ajv);
    return ajv;
  }
  const ajv = new Ajv(opts);
  addFormats(ajv);
  return ajv;
}

/**
 * Validate parsed data against a JSON Schema.
 */
export function validateData(
  data: unknown,
  schema: Record<string, unknown>,
): ValidationResult {
  const ajv = createAjv(schema);
  const validateFn = ajv.compile(schema);
  const valid = validateFn(data) as boolean;

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

  return { valid, errors };
}

/**
 * Parse YAML content and validate against a JSON Schema.
 */
export function validateYamlContent(
  yamlContent: string,
  schema: Record<string, unknown>,
): ValidationResult {
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid YAML syntax';
    return { valid: false, errors: [{ path: '/', message: msg }] };
  }

  if (parsed === null || parsed === undefined) {
    return { valid: false, errors: [{ path: '/', message: 'Empty YAML document' }] };
  }

  return validateData(parsed, schema);
}

/**
 * Auto-detect the schema type from YAML content.
 * Returns undefined if detection fails.
 */
export function detectSchemaType(yamlContent: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch {
    return undefined;
  }

  if (parsed === null || typeof parsed !== 'object') return undefined;
  const obj = parsed as Record<string, unknown>;

  if ('model' in obj && typeof obj.model === 'object') return 'system';
  if ('standard_id' in obj || 'standardId' in obj) return 'standard';
  if ('exception_id' in obj || 'exceptionId' in obj) return 'waiver';
  if ('pattern_id' in obj || 'patternId' in obj) return 'pattern';

  return undefined;
}
