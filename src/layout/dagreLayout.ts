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

// Child layout constants
const CHILD_W = 260;
const CHILD_H = 130;
const GAP_X = 30;
const GAP_Y = 30;
const PAD_X = 20;
const PAD_TOP = 60; // extra top padding for parent label
const PAD_BOTTOM = 20;

export function applyDagreLayout<T extends Node>(
  nodes: T[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {},
): T[] {
  if (nodes.length === 0) return nodes;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Split into top-level and child nodes
  const topLevelNodes = nodes.filter((n): n is T => !n.parentId);
  const childNodes = nodes.filter((n): n is T => !!n.parentId);

  // Group children by parent
  const childrenByParent = new Map<string, T[]>();
  for (const child of childNodes) {
    const siblings = childrenByParent.get(child.parentId!) || [];
    siblings.push(child);
    childrenByParent.set(child.parentId!, siblings);
  }

  // Pre-compute parent sizes based on the number of children
  const parentSizes = new Map<string, { width: number; height: number }>();
  for (const [parentId, children] of childrenByParent) {
    const cols = Math.ceil(Math.sqrt(children.length));
    const rows = Math.ceil(children.length / cols);
    const totalW = PAD_X * 2 + cols * CHILD_W + (cols - 1) * GAP_X;
    const totalH = PAD_TOP + PAD_BOTTOM + rows * CHILD_H + (rows - 1) * GAP_Y;
    parentSizes.set(parentId, { width: totalW, height: totalH });
  }

  // Create Dagre graph with correct dimensions (using parent sizes where applicable)
  const g = new dagre.graphlib.Graph({ multigraph: true, compound: false });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  });

  for (const node of topLevelNodes) {
    // Use pre-computed parent size if this node has children
    const parentSize = parentSizes.get(node.id);
    const dims = parentSize || NODE_DIMENSIONS[node.type || ''] || {
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

  // Position top-level nodes using Dagre output
  const positionedNodes = topLevelNodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;

    const result = {
      ...node,
      position: {
        x: pos.x - (pos.width ?? 0) / 2,
        y: pos.y - (pos.height ?? 0) / 2,
      },
    };

    // Apply explicit size for parent nodes
    const size = parentSizes.get(node.id);
    if (size) {
      result.style = { ...((node as any).style || {}), width: size.width, height: size.height };
    }

    return result;
  });

  // Position child nodes in a grid inside their parent
  const positionedChildren: T[] = [];
  for (const [, children] of childrenByParent) {
    const cols = Math.ceil(Math.sqrt(children.length));
    children.forEach((child, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positionedChildren.push({
        ...child,
        position: {
          x: PAD_X + col * (CHILD_W + GAP_X),
          y: PAD_TOP + row * (CHILD_H + GAP_Y),
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
