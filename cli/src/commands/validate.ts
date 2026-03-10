/* ── aac validate <filepath> --type <type> ────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import { SchemaManager, VALID_TYPES } from '../schema-manager.js';
import { Validator } from '../validator.js';
import type { ValidationResult } from '../validator.js';
import { readConfig } from '../utils/config.js';
import * as logger from '../utils/logger.js';
import { EXIT_SUCCESS, EXIT_SYSTEM_ERROR, EXIT_VALIDATION_FAILED } from '../utils/exit-codes.js';

interface ValidateOptions {
  type: string;
  output?: string;
  forceRefresh?: boolean;
}

/** Infer the schema type from a file path when --type is not provided */
function inferType(filePath: string): string | null {
  const abs = path.resolve(filePath);
  const parts = abs.split(path.sep);
  // Walk path segments looking for known directory names
  for (const segment of parts) {
    switch (segment) {
      case 'model': return 'system';
      case 'patterns': return 'pattern';
      case 'standards': return 'standard';
      case 'waivers': return 'waiver';
    }
  }
  return null;
}

/** Expand a filepath to multiple files if it's a directory */
function expandFiles(filePath: string): string[] {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${filePath}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) return [resolved];

  // Recursively find all .yaml, .yml, .json files
  const files: string[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ya?ml|json)$/i.test(entry.name) && !entry.name.startsWith('.')) {
        // Skip metadata.json for system validation — those use Zod, not JSON Schema
        if (entry.name === 'metadata.json') continue;
        files.push(full);
      }
    }
  }
  walk(resolved);
  return files.sort();
}

export async function runValidate(filePath: string, opts: ValidateOptions): Promise<void> {
  const type = opts.type || inferType(filePath);
  if (!type || !VALID_TYPES.includes(type)) {
    logger.error(
      `Schema type "${type ?? 'unknown'}" is not valid. Use --type with one of: ${VALID_TYPES.join(', ')}`,
    );
    process.exit(EXIT_SYSTEM_ERROR);
  }

  const jsonOutput = opts.output === 'json';

  // Resolve files
  let files: string[];
  try {
    files = expandFiles(filePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    process.exit(EXIT_SYSTEM_ERROR);
  }

  if (files.length === 0) {
    logger.error(`No validatable files found at "${filePath}".`);
    process.exit(EXIT_SYSTEM_ERROR);
  }

  // Fetch schema
  const config = readConfig();
  const manager = new SchemaManager(config.schemaBaseUrl, config.cacheDirName);
  let schema: Record<string, unknown>;
  try {
    schema = await manager.getSchema(type, opts.forceRefresh ?? false);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to load schema for "${type}": ${msg}`);
    process.exit(EXIT_SYSTEM_ERROR);
  }

  // Validate each file
  const validator = new Validator();
  const results: ValidationResult[] = [];
  let hasFailures = false;

  for (const file of files) {
    try {
      const result = validator.validate(file, schema);
      results.push(result);
      if (!result.valid) hasFailures = true;

      if (!jsonOutput) {
        const relPath = path.relative(process.cwd(), file);
        if (result.valid) {
          logger.validationPass(relPath);
        } else {
          logger.validationFail(relPath);
          for (const err of result.errors) {
            logger.validationError(err.path, err.message);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      hasFailures = true;
      const errorResult: ValidationResult = {
        valid: false,
        filePath: file,
        errors: [{ path: '/', message: msg }],
      };
      results.push(errorResult);

      if (!jsonOutput) {
        const relPath = path.relative(process.cwd(), file);
        logger.validationFail(relPath);
        logger.validationError('/', msg);
      }
    }
  }

  // JSON output mode
  if (jsonOutput) {
    const output = results.map((r) => ({
      file: path.relative(process.cwd(), r.filePath),
      valid: r.valid,
      errors: r.errors,
    }));
    logger.json(output);
  } else {
    const passed = results.filter((r) => r.valid).length;
    const failed = results.filter((r) => !r.valid).length;
    logger.info('');
    logger.info(`Summary: ${passed} passed, ${failed} failed out of ${results.length} file(s)`);
  }

  process.exit(hasFailures ? EXIT_VALIDATION_FAILED : EXIT_SUCCESS);
}
