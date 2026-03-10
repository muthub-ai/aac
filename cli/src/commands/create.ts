/* ── aac create <type> [name] — scaffold a boilerplate artifact ─ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as logger from '../utils/logger.js';
import { EXIT_SUCCESS, EXIT_SYSTEM_ERROR } from '../utils/exit-codes.js';

/** Resolve templates dir — works for npm package, dev mode, and compiled binary */
function resolveTemplatesDir(): string {
  // 1. Relative to this module (npm package / dev via tsx)
  const fromModule = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', 'templates',
  );
  if (fs.existsSync(fromModule)) return fromModule;

  // 2. Relative to the executable (compiled binary)
  const fromExec = path.join(path.dirname(process.execPath), 'templates');
  if (fs.existsSync(fromExec)) return fromExec;

  // 3. Fall back to module-relative (will error naturally on missing files)
  return fromModule;
}

const TEMPLATES_DIR = resolveTemplatesDir();

interface TypeConfig {
  dir: string;
  template: string;
  /** Extra files to copy (e.g. metadata.json for systems) */
  extras?: { template: string; filename: string }[];
  /** Whether the artifact lives in its own subdirectory */
  subdirectory: boolean;
  filenameBase: string;
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  system: {
    dir: 'model',
    template: 'system.yaml',
    extras: [{ template: 'metadata.json', filename: 'metadata.json' }],
    subdirectory: true,
    filenameBase: 'system.yaml',
  },
  pattern: {
    dir: 'patterns',
    template: 'pattern.yaml',
    subdirectory: true,
    filenameBase: 'pattern.yaml',
  },
  standard: {
    dir: 'standards',
    template: 'standard.yaml',
    subdirectory: false,
    filenameBase: '', // uses the name directly
  },
  waiver: {
    dir: 'waivers',
    template: 'waiver.yaml',
    subdirectory: false,
    filenameBase: '',
  },
};

export const CREATE_TYPES = Object.keys(TYPE_CONFIGS);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function runCreate(type: string, name?: string): void {
  const config = TYPE_CONFIGS[type];
  if (!config) {
    logger.error(`Unknown type "${type}". Valid types: ${CREATE_TYPES.join(', ')}`);
    process.exit(EXIT_SYSTEM_ERROR);
  }

  const slug = slugify(name ?? `my-${type}`);
  const cwd = process.cwd();

  // Determine target path
  let targetDir: string;
  let targetFile: string;

  if (config.subdirectory) {
    targetDir = path.join(cwd, config.dir, slug);
    targetFile = path.join(targetDir, config.filenameBase);
  } else {
    targetDir = path.join(cwd, config.dir);
    targetFile = path.join(targetDir, `${slug}.yaml`);
  }

  // Check parent directory exists
  const parentDir = path.join(cwd, config.dir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
    logger.dim(`  Created ${config.dir}/`);
  }

  // Check if target already exists
  if (fs.existsSync(targetFile)) {
    logger.error(`File already exists: ${path.relative(cwd, targetFile)}`);
    process.exit(EXIT_SYSTEM_ERROR);
  }

  // Create subdirectory if needed
  if (config.subdirectory) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy template, replacing placeholder names
  const templatePath = path.join(TEMPLATES_DIR, config.template);
  let content = fs.readFileSync(templatePath, 'utf-8');
  content = content.replace(/my-system/g, slug);
  content = content.replace(/My System/g, name ?? slug);
  content = content.replace(/my-pattern/g, slug);
  content = content.replace(/My Architecture Pattern/g, name ?? slug);
  content = content.replace(/My Architecture Standard/g, name ?? slug);

  fs.writeFileSync(targetFile, content, 'utf-8');
  logger.success(`Created ${path.relative(cwd, targetFile)}`);

  // Copy extra files (e.g. metadata.json)
  if (config.extras) {
    for (const extra of config.extras) {
      const extraTemplatePath = path.join(TEMPLATES_DIR, extra.template);
      const extraTargetPath = path.join(targetDir, extra.filename);
      let extraContent = fs.readFileSync(extraTemplatePath, 'utf-8');
      extraContent = extraContent.replace(/my-system/g, slug);
      extraContent = extraContent.replace(/My System/g, name ?? slug);
      fs.writeFileSync(extraTargetPath, extraContent, 'utf-8');
      logger.success(`Created ${path.relative(cwd, extraTargetPath)}`);
    }
  }

  logger.info('');
  logger.info(`Edit the file, then validate with: aac validate ${path.relative(cwd, targetFile)} --type ${type}`);
  process.exit(EXIT_SUCCESS);
}
