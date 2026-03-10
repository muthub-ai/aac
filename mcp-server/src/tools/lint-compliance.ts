/* ── Lint Compliance Tool — enterprise policy rule checker for C4 architecture models ── */

import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { discoverSubdirs, readYaml } from "../lib/repo-resolver.js";

// ── Local types for the YAML architecture shape ──────────────────────

interface YamlRelationship {
  destinationId: string;
  description?: string;
  technology?: string;
}

interface YamlContainer {
  id: string;
  name: string;
  technology?: string;
  tags?: string;
  properties?: { type?: string; [key: string]: unknown };
  relationships?: YamlRelationship[];
}

interface YamlSoftwareSystem {
  id: string;
  name: string;
  tags?: string;
  containers?: YamlContainer[];
  relationships?: YamlRelationship[];
}

interface YamlPerson {
  id: string;
  name: string;
  relationships?: YamlRelationship[];
}

interface YamlContainerInstance {
  containerId: string;
  instanceId?: number;
}

interface YamlDeploymentChild {
  id: string;
  name?: string;
  containerInstances?: YamlContainerInstance[];
}

interface YamlInfrastructureNode {
  id: string;
  name?: string;
  relationships?: YamlRelationship[];
}

interface YamlDeploymentNode {
  id: string;
  name?: string;
  containerInstances?: YamlContainerInstance[];
  children?: YamlDeploymentChild[];
  infrastructureNodes?: YamlInfrastructureNode[];
}

interface YamlModel {
  softwareSystems?: YamlSoftwareSystem[];
  people?: YamlPerson[];
  deploymentNodes?: YamlDeploymentNode[];
}

interface YamlArchitecture {
  name: string;
  model: YamlModel;
}

// ── Container info flattened for rule evaluation ─────────────────────

interface ContainerInfo {
  systemId: string;
  containerId: string;
  fullId: string; // "SystemId.ContainerId"
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

// ── Violation and result types ───────────────────────────────────────

interface Violation {
  [key: string]: unknown;
  system: string;
  rule: string;
  description: string;
}

interface LintResult {
  [key: string]: unknown;
  systemsChecked: number;
  violationCount: number;
  violations: Violation[];
}

// ── Detection constants ──────────────────────────────────────────────

const FRONTEND_TYPE_KEYWORDS: readonly string[] = [
  "webapp",
  "mobile",
  "spa",
  "browser",
];
const FRONTEND_TECH_KEYWORDS: readonly string[] = [
  "react",
  "angular",
  "vue",
  "ios",
  "android",
];

const DATABASE_TYPE_KEYWORDS: readonly string[] = [
  "database",
  "db",
  "datastore",
];
const DATABASE_TECH_KEYWORDS: readonly string[] = [
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "firestore",
  "bigquery",
  "spanner",
];

// ── Helpers ──────────────────────────────────────────────────────────

function textContains(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function isFrontend(c: ContainerInfo): boolean {
  const typeAndTags = `${c.propertiesType} ${c.tags}`;
  return (
    textContains(typeAndTags, FRONTEND_TYPE_KEYWORDS) ||
    textContains(c.technology, FRONTEND_TECH_KEYWORDS)
  );
}

function isDatabase(c: ContainerInfo): boolean {
  const typeAndTags = `${c.propertiesType} ${c.tags}`;
  return (
    textContains(typeAndTags, DATABASE_TYPE_KEYWORDS) ||
    textContains(c.technology, DATABASE_TECH_KEYWORDS)
  );
}

function isExternalSystem(sys: YamlSoftwareSystem): boolean {
  if (sys.tags) {
    const tagList = sys.tags.split(",").map((t) => t.trim().toLowerCase());
    if (tagList.includes("external")) return true;
    if (tagList.includes("internal")) return false;
  }
  return !sys.containers || sys.containers.length === 0;
}

// ── Data extraction ──────────────────────────────────────────────────

function extractContainers(doc: YamlArchitecture): ContainerInfo[] {
  const result: ContainerInfo[] = [];
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const cont of sys.containers ?? []) {
      result.push({
        systemId: sys.id,
        containerId: cont.id,
        fullId: `${sys.id}.${cont.id}`,
        technology: cont.technology ?? "",
        propertiesType: cont.properties?.type ?? "",
        tags: cont.tags ?? "",
        name: cont.name,
        relationships: cont.relationships ?? [],
      });
    }
  }
  return result;
}

function buildContainerIdSet(doc: YamlArchitecture): Set<string> {
  const ids = new Set<string>();
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const cont of sys.containers ?? []) {
      ids.add(`${sys.id}.${cont.id}`);
    }
  }
  return ids;
}

function collectAllDestinationIds(doc: YamlArchitecture): Set<string> {
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

function collectDeploymentContainerRefs(doc: YamlArchitecture): string[] {
  const refs: string[] = [];

  function walkNode(node: YamlDeploymentNode): void {
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

// ── Rule implementations ─────────────────────────────────────────────

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
          system: modelName,
          rule: "no-frontend-db-bypass",
          description:
            `Frontend container "${cont.fullId}" has a direct relationship ` +
            `to database "${rel.destinationId}"`,
        });
      }
    }
  }

  return violations;
}

function checkNoEmptySystems(
  modelName: string,
  systems: readonly YamlSoftwareSystem[],
): Violation[] {
  const violations: Violation[] = [];
  for (const sys of systems) {
    if (isExternalSystem(sys)) continue;
    if (!sys.containers || sys.containers.length === 0) {
      violations.push({
        system: modelName,
        rule: "no-empty-systems",
        description: `Software system "${sys.id}" has no containers defined`,
      });
    }
  }
  return violations;
}

function checkNoOrphanedExternals(
  modelName: string,
  doc: YamlArchitecture,
): Violation[] {
  const violations: Violation[] = [];
  const destinationIds = collectAllDestinationIds(doc);

  // Collect IDs of systems that have outgoing relationships
  const systemsWithOutgoingRels = new Set<string>();
  for (const sys of doc.model.softwareSystems ?? []) {
    const hasSystemRels =
      sys.relationships !== undefined && sys.relationships.length > 0;
    const hasContainerRels = (sys.containers ?? []).some(
      (c) => c.relationships !== undefined && c.relationships.length > 0,
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

    const hasOutgoing = systemsWithOutgoingRels.has(sys.id);

    if (!referencedAsDestination && !hasOutgoing) {
      violations.push({
        system: modelName,
        rule: "no-orphaned-externals",
        description: `External system "${sys.id}" is not referenced in any relationship`,
      });
    }
  }

  return violations;
}

function checkValidDeploymentRefs(
  modelName: string,
  doc: YamlArchitecture,
  containerIds: Set<string>,
): Violation[] {
  const violations: Violation[] = [];
  const refs = collectDeploymentContainerRefs(doc);
  const seen = new Set<string>();

  for (const containerId of refs) {
    if (!containerIds.has(containerId) && !seen.has(containerId)) {
      seen.add(containerId);
      violations.push({
        system: modelName,
        rule: "valid-deployment-refs",
        description:
          `Deployment node references container "${containerId}" ` +
          `which does not exist in the model`,
      });
    }
  }

  return violations;
}

function checkContainerTechnology(
  modelName: string,
  containers: ContainerInfo[],
): Violation[] {
  const violations: Violation[] = [];
  for (const cont of containers) {
    if (!cont.technology.trim()) {
      violations.push({
        system: modelName,
        rule: "container-technology-required",
        description: `Container "${cont.fullId}" has no technology specified`,
      });
    }
  }
  return violations;
}

// ── Lint orchestration ───────────────────────────────────────────────

function lintDocument(doc: YamlArchitecture): Violation[] {
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

function parseArchDoc(raw: unknown): YamlArchitecture | undefined {
  if (
    raw === null ||
    raw === undefined ||
    typeof raw !== "object" ||
    !("model" in raw) ||
    !("name" in raw)
  ) {
    return undefined;
  }
  return raw as YamlArchitecture;
}

// ── Tool registration ────────────────────────────────────────────────

export function registerLintComplianceTool(
  server: McpServer,
  repoRoot: string,
): void {
  server.registerTool(
    "lint_compliance",
    {
      title: "Lint Architecture Compliance",
      description:
        "Run enterprise policy rules against architecture models. " +
        "Checks 5 rules: no-frontend-db-bypass, no-empty-systems, " +
        "no-orphaned-externals, valid-deployment-refs, and " +
        "container-technology-required. Optionally scope to a single system.",
      inputSchema: {
        systemId: z
          .string()
          .optional()
          .describe(
            "System directory name to lint (e.g. 'ecommerce-platform'). If omitted, lints all systems.",
          ),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args) => {
      try {
        const modelDir = path.join(repoRoot, "model");

        // Determine which system directories to scan
        let systemDirs: string[];
        if (args.systemId) {
          systemDirs = [args.systemId];
        } else {
          systemDirs = discoverSubdirs(modelDir);
        }

        const allViolations: Violation[] = [];
        let systemsChecked = 0;

        for (const dir of systemDirs) {
          const yamlPath = path.join(modelDir, dir, "system.yaml");

          let raw: unknown;
          try {
            raw = readYaml(yamlPath);
          } catch {
            // No system.yaml in this directory — skip
            continue;
          }

          const doc = parseArchDoc(raw);
          if (!doc) continue;

          systemsChecked += 1;
          allViolations.push(...lintDocument(doc));
        }

        const result: LintResult = {
          systemsChecked,
          violationCount: allViolations.length,
          violations: allViolations,
        };

        const summary =
          allViolations.length === 0
            ? `All ${String(systemsChecked)} system(s) passed compliance checks.`
            : `Found ${String(allViolations.length)} violation(s) across ${String(systemsChecked)} system(s):\n` +
              allViolations
                .map((v) => `  [${v.rule}] ${v.system}: ${v.description}`)
                .join("\n");

        return {
          content: [{ type: "text" as const, text: summary }],
          structuredContent: result,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errResult: LintResult = {
          systemsChecked: 0,
          violationCount: 0,
          violations: [],
        };
        return {
          content: [{ type: "text" as const, text: `Error: ${msg}` }],
          structuredContent: errResult,
          isError: true,
        };
      }
    },
  );
}
