#!/usr/bin/env tsx
// Architecture compliance linter for C4 model YAML files.
//
// Usage:  npx tsx scripts/lint-architecture.ts
//
// Discovers all model/<system>/system.yaml files and inspects the
// architecture for enterprise policy violations.
//
// Exit code 0 = clean, 1 = violations found.

import yaml from 'js-yaml';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  NewYamlArchitecture,
  NewYamlSoftwareSystem,
  NewYamlDeploymentNode,
} from '../src/types/yaml-schema';

// ── Types ───────────────────────────────────────────────────────────

interface Violation {
  modelName: string;
  rule: string;
  description: string;
}

interface ContainerInfo {
  systemId: string;
  containerId: string;
  /** Fully-qualified ID: "SystemId.ContainerId" */
  fullId: string;
  technology: string;
  propertiesType: string;
  tags: string;
  name: string;
  relationships: ReadonlyArray<{
    destinationId: string;
    description?: string;
    technology?: string;
  }>;
}

// ── Detection constants ─────────────────────────────────────────────

const FRONTEND_TYPE_KEYWORDS: readonly string[] = [
  'webapp',
  'mobile',
  'spa',
  'browser',
];
const FRONTEND_TECH_KEYWORDS: readonly string[] = [
  'react',
  'angular',
  'vue',
  'ios',
  'android',
];

const DATABASE_TYPE_KEYWORDS: readonly string[] = [
  'database',
  'db',
  'datastore',
];
const DATABASE_TECH_KEYWORDS: readonly string[] = [
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'firestore',
  'bigquery',
  'spanner',
];

// ── Helpers ─────────────────────────────────────────────────────────

// Discover all model/<system>/system.yaml files under the given directory.
function discoverModelFiles(modelDir: string): string[] {
  const files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(modelDir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const entryPath = join(modelDir, entry);
    try {
      if (!statSync(entryPath).isDirectory()) continue;
    } catch {
      continue;
    }
    const yamlPath = join(entryPath, 'system.yaml');
    try {
      if (statSync(yamlPath).isFile()) {
        files.push(yamlPath);
      }
    } catch {
      // no system.yaml in this subdirectory — skip
    }
  }
  return files.sort();
}

/** Parse a YAML file and return the typed architecture document. */
function parseYaml(filePath: string): NewYamlArchitecture | undefined {
  const raw = readFileSync(filePath, 'utf-8');
  const doc = yaml.load(raw);
  if (
    doc === null ||
    doc === undefined ||
    typeof doc !== 'object' ||
    !('model' in doc)
  ) {
    return undefined;
  }
  return doc as NewYamlArchitecture;
}

/** Case-insensitive check: does `text` contain any keyword from the list? */
function textContainsKeyword(
  text: string,
  keywords: readonly string[],
): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/** Detect whether a container is a frontend/webapp/mobile container. */
function isFrontend(c: ContainerInfo): boolean {
  const typeAndTags = `${c.propertiesType} ${c.tags}`;
  return (
    textContainsKeyword(typeAndTags, FRONTEND_TYPE_KEYWORDS) ||
    textContainsKeyword(c.technology, FRONTEND_TECH_KEYWORDS)
  );
}

/** Detect whether a container is a database/datastore container. */
function isDatabase(c: ContainerInfo): boolean {
  const typeAndTags = `${c.propertiesType} ${c.tags}`;
  return (
    textContainsKeyword(typeAndTags, DATABASE_TYPE_KEYWORDS) ||
    textContainsKeyword(c.technology, DATABASE_TECH_KEYWORDS)
  );
}

/**
 * Determine whether a software system is "external".
 *
 * Mirrors the deriveBoundary logic from the project's parser:
 *   - tags contain "external" → External
 *   - tags contain "internal" → Internal
 *   - has containers → Internal; otherwise → External
 */
function isExternalSystem(sys: NewYamlSoftwareSystem): boolean {
  if (sys.tags) {
    const tagList = sys.tags.split(',').map((t) => t.trim().toLowerCase());
    if (tagList.includes('external')) return true;
    if (tagList.includes('internal')) return false;
  }
  return !sys.containers || sys.containers.length === 0;
}

// ── Data extraction ─────────────────────────────────────────────────

/** Extract a flat list of ContainerInfo from all software systems. */
function extractContainers(doc: NewYamlArchitecture): ContainerInfo[] {
  const result: ContainerInfo[] = [];
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const cont of sys.containers ?? []) {
      result.push({
        systemId: sys.id,
        containerId: cont.id,
        fullId: `${sys.id}.${cont.id}`,
        technology: cont.technology ?? '',
        propertiesType: cont.properties?.type ?? '',
        tags: cont.tags ?? '',
        name: cont.name,
        relationships: cont.relationships ?? [],
      });
    }
  }
  return result;
}

/** Build a Set of all fully-qualified container IDs. */
function buildContainerIdSet(doc: NewYamlArchitecture): Set<string> {
  const ids = new Set<string>();
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const cont of sys.containers ?? []) {
      ids.add(`${sys.id}.${cont.id}`);
    }
  }
  return ids;
}

/** Collect every destinationId from all relationships in the model. */
function collectAllDestinationIds(doc: NewYamlArchitecture): Set<string> {
  const ids = new Set<string>();

  // People relationships
  for (const person of doc.model.people ?? []) {
    for (const rel of person.relationships ?? []) {
      ids.add(rel.destinationId);
    }
  }

  // Software system and container relationships
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const rel of sys.relationships ?? []) {
      ids.add(rel.destinationId);
    }
    for (const cont of sys.containers ?? []) {
      for (const rel of cont.relationships ?? []) {
        ids.add(rel.destinationId);
      }
    }
  }

  // Infrastructure node relationships in deployment nodes
  for (const node of doc.model.deploymentNodes ?? []) {
    for (const infra of node.infrastructureNodes ?? []) {
      for (const rel of infra.relationships ?? []) {
        ids.add(rel.destinationId);
      }
    }
  }

  return ids;
}

/** Collect all containerInstance containerIds from deployment nodes. */
function collectDeploymentContainerRefs(doc: NewYamlArchitecture): string[] {
  const refs: string[] = [];

  function walkNode(node: NewYamlDeploymentNode): void {
    for (const inst of node.containerInstances ?? []) {
      refs.push(inst.containerId);
    }
    for (const child of node.children ?? []) {
      for (const inst of child.containerInstances ?? []) {
        refs.push(inst.containerId);
      }
    }
  }

  for (const node of doc.model.deploymentNodes ?? []) {
    walkNode(node);
  }

  return refs;
}

// ── Rule implementations ────────────────────────────────────────────

/**
 * Rule 1: No frontend-to-database bypass.
 *
 * Frontend/webapp/mobile containers must NOT have direct relationships
 * to database containers.
 */
function checkNoFrontendDbBypass(
  modelName: string,
  containers: ContainerInfo[],
): Violation[] {
  const violations: Violation[] = [];
  const dbIds = new Set(containers.filter(isDatabase).map((c) => c.fullId));

  for (const cont of containers) {
    if (!isFrontend(cont)) continue;
    for (const rel of cont.relationships) {
      if (dbIds.has(rel.destinationId)) {
        violations.push({
          modelName,
          rule: 'no-frontend-db-bypass',
          description:
            `Frontend container "${cont.fullId}" has a direct relationship ` +
            `to database "${rel.destinationId}"`,
        });
      }
    }
  }

  return violations;
}

/**
 * Rule 2: All software systems must have at least one container.
 *
 * Empty systems are likely incomplete models.
 */
function checkNoEmptySystems(
  modelName: string,
  systems: readonly NewYamlSoftwareSystem[],
): Violation[] {
  const violations: Violation[] = [];
  for (const sys of systems) {
    // External systems are outside our boundary — they don't need containers
    if (isExternalSystem(sys)) continue;
    if (!sys.containers || sys.containers.length === 0) {
      violations.push({
        modelName,
        rule: 'no-empty-systems',
        description: `Software system "${sys.id}" has no containers defined`,
      });
    }
  }
  return violations;
}

/**
 * Rule 3: No orphaned external systems.
 *
 * External systems must be referenced in at least one relationship
 * (either as a destination or by having their own outgoing relationships).
 */
function checkNoOrphanedExternals(
  modelName: string,
  doc: NewYamlArchitecture,
): Violation[] {
  const violations: Violation[] = [];
  const destinationIds = collectAllDestinationIds(doc);

  // Collect IDs of systems that have outgoing relationships (system-level or container-level)
  const systemsWithOutgoingRels = new Set<string>();
  for (const sys of doc.model.softwareSystems ?? []) {
    const hasSystemRels = sys.relationships && sys.relationships.length > 0;
    const hasContainerRels = (sys.containers ?? []).some(
      (c) => c.relationships && c.relationships.length > 0,
    );
    if (hasSystemRels || hasContainerRels) {
      systemsWithOutgoingRels.add(sys.id);
    }
  }

  for (const sys of doc.model.softwareSystems ?? []) {
    if (!isExternalSystem(sys)) continue;

    // Referenced as destination: system ID or any container within it
    const referencedAsDestination =
      destinationIds.has(sys.id) ||
      [...destinationIds].some((id) => id.startsWith(`${sys.id}.`));

    // Has its own outgoing relationships
    const hasOutgoing = systemsWithOutgoingRels.has(sys.id);

    if (!referencedAsDestination && !hasOutgoing) {
      violations.push({
        modelName,
        rule: 'no-orphaned-externals',
        description: `External system "${sys.id}" is not referenced in any relationship`,
      });
    }
  }

  return violations;
}

/**
 * Rule 4: Deployment views must reference valid containers.
 *
 * Container instances in deployment nodes must reference containers
 * that actually exist in the model.
 */
function checkValidDeploymentRefs(
  modelName: string,
  doc: NewYamlArchitecture,
  containerIds: Set<string>,
): Violation[] {
  const violations: Violation[] = [];
  const refs = collectDeploymentContainerRefs(doc);
  const seen = new Set<string>();

  for (const containerId of refs) {
    if (!containerIds.has(containerId) && !seen.has(containerId)) {
      seen.add(containerId);
      violations.push({
        modelName,
        rule: 'valid-deployment-refs',
        description:
          `Deployment node references container "${containerId}" ` +
          `which does not exist in the model`,
      });
    }
  }

  return violations;
}

/**
 * Rule 5: All containers must have technology specified.
 *
 * Every container should have a non-empty technology field.
 */
function checkContainerTechnology(
  modelName: string,
  containers: ContainerInfo[],
): Violation[] {
  const violations: Violation[] = [];
  for (const cont of containers) {
    if (!cont.technology.trim()) {
      violations.push({
        modelName,
        rule: 'container-technology-required',
        description: `Container "${cont.fullId}" has no technology specified`,
      });
    }
  }
  return violations;
}

// ── Lint orchestration ──────────────────────────────────────────────

/** Run all policy rules against a single architecture document. */
function lint(filePath: string, doc: NewYamlArchitecture): Violation[] {
  const modelName = doc.name;
  const containers = extractContainers(doc);
  const containerIds = buildContainerIdSet(doc);
  const systems = doc.model.softwareSystems ?? [];

  return [
    ...checkNoFrontendDbBypass(modelName, containers),
    ...checkNoEmptySystems(modelName, systems),
    ...checkNoOrphanedExternals(modelName, doc),
    ...checkValidDeploymentRefs(modelName, doc, containerIds),
    ...checkContainerTechnology(modelName, containers),
  ];
}

// ── Entry point ─────────────────────────────────────────────────────

function main(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(scriptDir, '..');
  const modelDir = join(projectRoot, 'model');

  const files = discoverModelFiles(modelDir);

  if (files.length === 0) {
    console.error('No model/*/system.yaml files found.');
    process.exit(1);
  }

  process.stdout.write(
    `Scanning ${String(files.length)} architecture model(s)\u2026\n\n`,
  );

  const allViolations: Violation[] = [];

  for (const filePath of files) {
    try {
      const doc = parseYaml(filePath);
      if (!doc) {
        console.error(
          `Skipping ${filePath}: not a valid new-format architecture file.`,
        );
        continue;
      }
      allViolations.push(...lint(filePath, doc));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error parsing ${filePath}: ${msg}`);
    }
  }

  // Output each violation
  for (const v of allViolations) {
    process.stdout.write(
      `[POLICY] ${v.modelName}: ${v.rule} \u2014 ${v.description}\n`,
    );
  }

  // Summary
  process.stdout.write(
    `\n${'\u2500'.repeat(60)}\n`,
  );
  process.stdout.write(
    `Summary: ${String(allViolations.length)} violation(s) found across ${String(files.length)} model(s)\n`,
  );

  if (allViolations.length > 0) {
    process.exit(1);
  }
}

main();
