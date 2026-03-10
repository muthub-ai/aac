/* ── Repo Resolver — find the AaC repo root and discover files ── */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * Resolve the AaC repository root directory.
 * If `rootArg` is given, use it directly.
 * Otherwise walk up from `cwd` looking for `schema/` + `model/` directories.
 */
export function resolveRepoRoot(rootArg?: string): string {
  if (rootArg) {
    const resolved = path.resolve(rootArg);
    if (!isRepoRoot(resolved)) {
      throw new Error(`Not an AaC repository: ${resolved} (missing schema/ or model/ directory)`);
    }
    return resolved;
  }

  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (isRepoRoot(dir)) return dir;
    dir = path.dirname(dir);
  }

  throw new Error(
    'Could not find AaC repository root. Run from within the repo or pass --root <path>.',
  );
}

function isRepoRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, 'schema')) &&
    fs.existsSync(path.join(dir, 'model'))
  );
}

/**
 * Discover subdirectories under a given directory.
 * Returns just the directory names (not full paths).
 */
export function discoverSubdirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/**
 * Discover YAML files in a flat directory.
 * Returns just the filenames (not full paths).
 */
export function discoverYamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();
}

/**
 * Read and parse a YAML file from disk.
 */
export function readYaml(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Read a file as raw text.
 */
export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Write text content to a file, creating parent directories if needed.
 */
export function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}
