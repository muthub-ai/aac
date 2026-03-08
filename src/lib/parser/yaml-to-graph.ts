import yaml from 'js-yaml';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import type { YamlArchitecture } from '@/types/yaml-schema';
import { isNewFormat, transformNewToOld } from './new-to-old-transform';

export interface ParseResult {
  nodes: Node<C4NodeData>[];
  edges: Edge<C4EdgeData>[];
}

export function yamlToGraph(yamlText: string): ParseResult {
  const nodes: Node<C4NodeData>[] = [];
  const edges: Edge<C4EdgeData>[] = [];

  let doc: YamlArchitecture;
  try {
    doc = yaml.load(yamlText) as YamlArchitecture;
  } catch {
    return { nodes: [], edges: [] };
  }

  if (!doc || typeof doc !== 'object') {
    return { nodes: [], edges: [] };
  }

  // Detect new schema format and transform to old format for parsing
  if (isNewFormat(doc)) {
    doc = transformNewToOld(doc);
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
