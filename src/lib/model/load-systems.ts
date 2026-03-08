import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { SystemData } from '@/types/system';
import {
  validateArchitecture,
  validateMetadata,
  validateRelationshipRefs,
  type ValidatedArchitecture,
} from '@/lib/validation/system-schema';

const MODEL_DIR = path.join(process.cwd(), 'model');

/**
 * Load all systems from the model/ directory.
 * Each subdirectory must contain system.yaml and metadata.json.
 * Validates both files with Zod schemas; throws on invalid data.
 */
export function loadSystems(): SystemData[] {
  if (!fs.existsSync(MODEL_DIR)) {
    return [];
  }

  const entries = fs
    .readdirSync(MODEL_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const systems: SystemData[] = [];

  for (const dirName of entries) {
    const system = loadSystemFromDir(dirName);
    systems.push(system);
  }

  return systems;
}

/**
 * Load a single system by its directory name (which is also the system id).
 * Returns null if the directory does not exist.
 */
export function loadSystemById(id: string): SystemData | null {
  const dirPath = path.join(MODEL_DIR, id);
  if (!fs.existsSync(dirPath)) {
    return null;
  }
  return loadSystemFromDir(id);
}

function loadSystemFromDir(dirName: string): SystemData {
  const dirPath = path.join(MODEL_DIR, dirName);
  const yamlPath = path.join(dirPath, 'system.yaml');
  const metaPath = path.join(dirPath, 'metadata.json');

  if (!fs.existsSync(yamlPath)) {
    throw new Error(`Missing system.yaml in model/${dirName}`);
  }
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Missing metadata.json in model/${dirName}`);
  }

  // Load and validate YAML
  const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
  const parsed = yaml.load(yamlContent);
  const archResult = validateArchitecture(parsed);
  if (!archResult.success) {
    throw new Error(
      `Invalid system.yaml in model/${dirName}:\n${archResult.errors.join('\n')}`,
    );
  }

  const refResult = validateRelationshipRefs(parsed as ValidatedArchitecture);
  if (!refResult.success) {
    throw new Error(
      `Invalid relationship references in model/${dirName}/system.yaml:\n${refResult.errors.join('\n')}`,
    );
  }

  // Load and validate metadata
  const metaRaw = fs.readFileSync(metaPath, 'utf-8');
  const metaJson = JSON.parse(metaRaw);
  const metaResult = validateMetadata(metaJson);
  if (!metaResult.success) {
    throw new Error(
      `Invalid metadata.json in model/${dirName}:\n${metaResult.errors.join('\n')}`,
    );
  }

  // Ensure directory name matches metadata id
  if (metaJson.id !== dirName) {
    throw new Error(
      `Directory name "${dirName}" does not match metadata id "${metaJson.id}"`,
    );
  }

  return {
    id: metaJson.id,
    name: metaJson.name,
    repoCount: metaJson.repoCount,
    linesOfCode: metaJson.linesOfCode,
    deployableUnits: metaJson.deployableUnits,
    domainModules: metaJson.domainModules,
    domainObjects: metaJson.domainObjects,
    domainBehaviors: metaJson.domainBehaviors,
    lastScan: metaJson.lastScan,
    branchName: metaJson.branchName,
    yamlContent,
  };
}
