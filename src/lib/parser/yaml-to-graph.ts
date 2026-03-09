import yaml from 'js-yaml';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import type {
  YamlArchitecture,
  NewYamlArchitecture,
  NewYamlDeploymentNode,
  NewYamlDeploymentChild,
  NewYamlInfrastructureNode,
} from '@/types/yaml-schema';
import { isNewFormat, transformNewToOld } from './new-to-old-transform';

export interface ParseResult {
  nodes: Node<C4NodeData>[];
  edges: Edge<C4EdgeData>[];
}

export function yamlToGraph(yamlText: string): ParseResult {
  const nodes: Node<C4NodeData>[] = [];
  const edges: Edge<C4EdgeData>[] = [];

  let rawDoc: unknown;
  try {
    rawDoc = yaml.load(yamlText);
  } catch {
    return { nodes: [], edges: [] };
  }

  if (!rawDoc || typeof rawDoc !== 'object') {
    return { nodes: [], edges: [] };
  }

  let doc: YamlArchitecture;

  // Detect new schema format and transform to old format for parsing
  if (isNewFormat(rawDoc)) {
    const newDoc = rawDoc as NewYamlArchitecture;
    doc = transformNewToOld(newDoc);

    // Also parse deployment nodes into the graph
    if (newDoc.model.deploymentNodes) {
      parseDeploymentNodes(newDoc, nodes, edges);
    }
  } else {
    doc = rawDoc as YamlArchitecture;
  }

  if (doc.actors) {
    for (const [id, actor] of Object.entries(doc.actors)) {
      const kind = actor.type === 'Person' ? 'person' as const : 'softwareSystem' as const;
      nodes.push({
        id,
        type: kind === 'person' ? 'personNode' : 'systemNode',
        position: { x: 0, y: 0 },
        data: {
          kind,
          label: actor.label || id,
          description: actor.description,
          boundary: actor.boundary === 'Internal' ? 'internal' : 'external',
        },
      });
    }
  }

  if (doc.softwareSystems) {
    for (const [sysId, system] of Object.entries(doc.softwareSystems)) {
      nodes.push({
        id: sysId,
        type: 'systemNode',
        position: { x: 0, y: 0 },
        data: {
          kind: 'softwareSystem',
          label: system.label || sysId,
          description: system.description,
          boundary: system.boundary === 'External' ? 'external' : 'internal',
        },
      });

      if (system.containers) {
        for (const [contId, container] of Object.entries(system.containers)) {
          const fullId = `${sysId}.${contId}`;
          nodes.push({
            id: fullId,
            type: 'containerNode',
            position: { x: 0, y: 0 },
            parentId: sysId,
            extent: 'parent',
            data: {
              kind: 'container',
              label: container.label || contId,
              description: container.description,
              technology: container.technology,
              boundary: system.boundary === 'External' ? 'external' : 'internal',
            },
          });

          if (container.components) {
            for (const [compId, component] of Object.entries(container.components)) {
              const compFullId = `${fullId}.${compId}`;
              nodes.push({
                id: compFullId,
                type: 'componentNode',
                position: { x: 0, y: 0 },
                parentId: fullId,
                extent: 'parent',
                data: {
                  kind: 'component',
                  label: component.label || compId,
                  description: component.description,
                  technology: component.technology,
                  boundary: system.boundary === 'External' ? 'external' : 'internal',
                },
              });
            }
          }
        }
      }
    }
  }

  if (doc.relationships) {
    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const rel of doc.relationships) {
      const source = resolveNodeId(rel.from, nodeIds);
      const target = resolveNodeId(rel.to, nodeIds);

      if (source && target) {
        const edgeId = `${source}->${target}`;
        edges.push({
          id: edgeId,
          source,
          target,
          label: rel.label,
          animated: false,
          data: {
            label: rel.label,
            protocol: rel.protocol,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

function resolveNodeId(ref: string, nodeIds: Set<string>): string | null {
  if (nodeIds.has(ref)) return ref;
  for (const id of nodeIds) {
    if (id.endsWith(`.${ref}`)) return id;
  }
  return null;
}

// ── Deployment Node Parsing ──────────────────────────────────────────

/**
 * Build a lookup from containerId (e.g. "DemandForecasting.PredictionPipeline")
 * to the container's display name from the model.
 */
function buildContainerNameMap(doc: NewYamlArchitecture): Map<string, string> {
  const map = new Map<string, string>();
  for (const sys of doc.model.softwareSystems ?? []) {
    for (const cont of sys.containers ?? []) {
      map.set(`${sys.id}.${cont.id}`, cont.name);
    }
  }
  return map;
}

/**
 * Build a lookup from containerId to the deploy:childId that hosts it.
 * Used to resolve infrastructure node relationships targeting containers.
 */
function buildContainerToChildMap(
  deploymentNodes: NewYamlDeploymentNode[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const dn of deploymentNodes) {
    for (const child of dn.children ?? []) {
      const childGraphId = `deploy:${child.id}`;
      for (const ci of child.containerInstances ?? []) {
        // First mapping wins (container might be deployed in multiple regions)
        if (!map.has(ci.containerId)) {
          map.set(ci.containerId, childGraphId);
        }
      }
    }
  }
  return map;
}

/**
 * Parse deployment nodes from a new-format document into graph nodes and edges.
 *
 * Hierarchy:
 *   DeploymentNode (top-level group)  →  type: "deploymentNode"
 *     ├── InfrastructureNode          →  type: "infrastructureNode"
 *     └── DeploymentNodeChild         →  type: "deploymentChildNode"
 *           └── ContainerInstance (rendered as text labels inside the child)
 *
 * Edges come from InfrastructureNode.relationships.
 */
function parseDeploymentNodes(
  doc: NewYamlArchitecture,
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
): void {
  const deploymentNodes = doc.model.deploymentNodes ?? [];
  if (deploymentNodes.length === 0) return;

  const containerNames = buildContainerNameMap(doc);
  const containerToChild = buildContainerToChildMap(deploymentNodes);

  // Collect all infra node IDs for edge resolution
  const infraIds = new Set<string>();
  for (const dn of deploymentNodes) {
    for (const infra of dn.infrastructureNodes ?? []) {
      infraIds.add(infra.id);
    }
  }

  for (const dn of deploymentNodes) {
    const dnId = `deploy:${dn.id}`;

    // Top-level deployment node (rendered as group)
    nodes.push({
      id: dnId,
      type: 'deploymentNode',
      position: { x: 0, y: 0 },
      data: {
        kind: 'deploymentNode',
        label: dn.name,
        technology: dn.technology,
        environment: dn.environment,
        boundary: 'internal',
      },
    });

    // Infrastructure nodes (children of the deployment group)
    for (const infra of dn.infrastructureNodes ?? []) {
      parseInfraNode(infra, dnId, nodes, edges, infraIds, containerToChild);
    }

    // Deployment children (clusters/services)
    for (const child of dn.children ?? []) {
      parseDeploymentChild(child, dnId, nodes, containerNames);
    }
  }
}

function parseInfraNode(
  infra: NewYamlInfrastructureNode,
  parentId: string,
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
  infraIds: Set<string>,
  containerToChild: Map<string, string>,
): void {
  const infraId = `infra:${infra.id}`;
  nodes.push({
    id: infraId,
    type: 'infrastructureNode',
    position: { x: 0, y: 0 },
    parentId,
    extent: 'parent',
    data: {
      kind: 'infrastructureNode',
      label: infra.name,
      technology: infra.technology,
      boundary: 'internal',
      infraType: infra.properties?.type,
    },
  });

  // Edges from infrastructure relationships
  for (const rel of infra.relationships ?? []) {
    let targetId: string;
    if (infraIds.has(rel.destinationId)) {
      targetId = `infra:${rel.destinationId}`;
    } else if (containerToChild.has(rel.destinationId)) {
      targetId = containerToChild.get(rel.destinationId)!;
    } else {
      // Try as a direct node ID (might match a C4 node)
      targetId = rel.destinationId;
    }
    const edgeId = `${infraId}->${targetId}`;
    edges.push({
      id: edgeId,
      source: infraId,
      target: targetId,
      label: rel.description,
      animated: false,
      data: {
        label: rel.description,
        protocol: rel.technology,
      },
    });
  }
}

function parseDeploymentChild(
  child: NewYamlDeploymentChild,
  parentId: string,
  nodes: Node<C4NodeData>[],
  containerNames: Map<string, string>,
): void {
  const childId = `deploy:${child.id}`;
  const instances = (child.containerInstances ?? []).map(
    (ci) => containerNames.get(ci.containerId) ?? ci.containerId,
  );

  nodes.push({
    id: childId,
    type: 'deploymentChildNode',
    position: { x: 0, y: 0 },
    parentId,
    extent: 'parent',
    data: {
      kind: 'deploymentNode',
      label: child.name,
      technology: child.technology,
      boundary: 'internal',
      containerInstances: instances,
    },
  });
}
