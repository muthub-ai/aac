import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

export interface LayoutOptions {
  direction: 'TB' | 'LR';
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 280,
  nodeHeight: 120,
  rankSep: 100,
  nodeSep: 80,
};

// Dimensions vary by node type for better visual hierarchy
const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  personNode: { width: 200, height: 140 },
  systemNode: { width: 300, height: 160 },
  containerNode: { width: 260, height: 130 },
  componentNode: { width: 240, height: 110 },
};

export function applyDagreLayout<T extends Node>(
  nodes: T[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {},
): T[] {
  if (nodes.length === 0) return nodes;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const g = new dagre.graphlib.Graph({ multigraph: true, compound: false });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  });

  // We layout only top-level nodes (no parentId) for the main graph.
  // Child nodes (containers inside systems) are positioned relative to parent.
  const topLevelNodes = nodes.filter((n): n is T => !n.parentId);
  const childNodes = nodes.filter((n): n is T => !!n.parentId);

  for (const node of topLevelNodes) {
    const dims = NODE_DIMENSIONS[node.type || ''] || {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    };
    g.setNode(node.id, { width: dims.width, height: dims.height });
  }

  // Add edges — only between top-level nodes or resolve to their parents
  for (const edge of edges) {
    const sourceTop = findTopLevelId(edge.source, nodes);
    const targetTop = findTopLevelId(edge.target, nodes);
    if (sourceTop && targetTop && sourceTop !== targetTop) {
      if (g.hasNode(sourceTop) && g.hasNode(targetTop)) {
        g.setEdge(sourceTop, targetTop);
      }
    }
  }

  dagre.layout(g);

  const positionedNodes = topLevelNodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - (pos.width ?? 0) / 2,
        y: pos.y - (pos.height ?? 0) / 2,
      },
    };
  });

  // Position child nodes in a simple grid inside their parent
  const childrenByParent = new Map<string, T[]>();
  for (const child of childNodes) {
    const siblings = childrenByParent.get(child.parentId!) || [];
    siblings.push(child);
    childrenByParent.set(child.parentId!, siblings);
  }

  const positionedChildren: T[] = [];
  for (const [, children] of childrenByParent) {
    const cols = Math.ceil(Math.sqrt(children.length));
    children.forEach((child, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positionedChildren.push({
        ...child,
        position: {
          x: 20 + col * 220,
          y: 40 + row * 140,
        },
      });
    });
  }

  return [...positionedNodes, ...positionedChildren];
}

function findTopLevelId(nodeId: string, nodes: Node[]): string | null {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  if (!node.parentId) return node.id;
  return findTopLevelId(node.parentId, nodes);
}
