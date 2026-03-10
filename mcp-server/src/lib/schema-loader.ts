/* ── Schema Loader — loads JSON schemas from the repo schema/ directory ── */

import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_FILE_MAP: Record<string, string> = {
  system: 'application-schema.json',
  application: 'application-schema.json',
  pattern: 'pattern-schema.json',
  standard: 'standards.json',
  waiver: 'waivers.json',
};

export const VALID_TYPES = ['system', 'pattern', 'standard', 'waiver'] as const;
export type SchemaType = (typeof VALID_TYPES)[number];

export function isValidType(type: string): type is SchemaType {
  return VALID_TYPES.includes(type as SchemaType);
}

/**
 * Load a JSON Schema object from the repo's schema/ directory.
 */
export function loadSchema(repoRoot: string, type: string): Record<string, unknown> {
  const fileName = SCHEMA_FILE_MAP[type];
  if (!fileName) {
    throw new Error(`Unknown schema type "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
  }

  const schemaPath = path.join(repoRoot, 'schema', fileName);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Get the schema filename for a given type.
 */
export function schemaFileFor(type: string): string | undefined {
  return SCHEMA_FILE_MAP[type];
}
