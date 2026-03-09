import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { SystemData, ViewCounts } from '@/types/system';
import {
  validateArchitecture,
  validateMetadata,
  validateRelationshipRefs,
  isNewSchemaFormat,
  type ValidatedArchitecture,
  type ValidatedNewArchitecture,
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

/** Extract architecture stats from a new-format YAML document. */
function extractArchStats(doc: ValidatedNewArchitecture) {
  const people = doc.model.people ?? [];
  const systems = doc.model.softwareSystems ?? [];

  let containerCount = 0;
  let relationshipCount = 0;
  let tags: string[] = [];
  let disposition: string | undefined;
  let dataClassification: string | undefined;
  let group: string | undefined;

  // Count people relationships
  for (const person of people) {
    relationshipCount += person.relationships?.length ?? 0;
  }

  for (const sys of systems) {
    const containers = sys.containers ?? [];
    containerCount += containers.length;
    relationshipCount += sys.relationships?.length ?? 0;

    for (const cont of containers) {
      relationshipCount += cont.relationships?.length ?? 0;
    }

    // Use first internal system's metadata for card-level fields
    if (!disposition && sys.disposition) {
      disposition = sys.disposition;
    }
    if (!dataClassification && sys.dataClassification) {
      dataClassification = sys.dataClassification;
    }
    if (!group && sys.group) {
      group = sys.group;
    }

    // Collect tags from all systems
    if (sys.tags) {
      const systemTags = sys.tags.split(',').map((t) => t.trim()).filter(Boolean);
      tags.push(...systemTags);
    }
  }

  // Deduplicate tags
  tags = [...new Set(tags)];

  const viewCounts: ViewCounts = {
    systemContext: doc.views?.systemContextViews?.length ?? 0,
    container: doc.views?.containerViews?.length ?? 0,
    deployment: doc.views?.deploymentViews?.length ?? 0,
  };

  return {
    description: doc.description,
    group,
    tags,
    disposition,
    dataClassification,
    peopleCount: people.length,
    softwareSystemCount: systems.length,
    containerCount,
    relationshipCount,
    viewCounts,
  };
}

/** Extract architecture stats from an old-format YAML document. */
function extractOldFormatStats(doc: ValidatedArchitecture) {
  const actors = doc.actors ? Object.keys(doc.actors) : [];
  const systems = doc.softwareSystems ? Object.entries(doc.softwareSystems) : [];

  let containerCount = 0;
  for (const [, sys] of systems) {
    containerCount += sys.containers ? Object.keys(sys.containers).length : 0;
  }

  const relationshipCount = doc.relationships?.length ?? 0;

  return {
    description: undefined,
    group: undefined,
    tags: [] as string[],
    disposition: undefined,
    dataClassification: undefined,
    peopleCount: actors.filter((id) => doc.actors![id].type === 'Person').length,
    softwareSystemCount: systems.length,
    containerCount,
    relationshipCount,
    viewCounts: { systemContext: 0, container: 0, deployment: 0 } as ViewCounts,
  };
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

  // Extract architecture stats from YAML
  const archStats = isNewSchemaFormat(parsed)
    ? extractArchStats(parsed as ValidatedNewArchitecture)
    : extractOldFormatStats(parsed as ValidatedArchitecture);

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
    description: archStats.description,
    group: archStats.group,
    tags: archStats.tags,
    disposition: archStats.disposition,
    dataClassification: archStats.dataClassification,
    peopleCount: archStats.peopleCount,
    softwareSystemCount: archStats.softwareSystemCount,
    containerCount: archStats.containerCount,
    relationshipCount: archStats.relationshipCount,
    viewCounts: archStats.viewCounts,
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
