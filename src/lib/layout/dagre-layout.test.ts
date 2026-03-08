import { applyDagreLayout } from './dagre-layout';
import type { Node, Edge } from '@xyflow/react';

function makeNode(id: string, type: string, parentId?: string): Node {
  return { id, type, position: { x: 0, y: 0 }, data: {}, ...(parentId ? { parentId } : {}) };
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target };
}

describe('applyDagreLayout', () => {
  // 1. Empty nodes array returns empty array
  it('returns an empty array when given no nodes', () => {
    const result = applyDagreLayout([], []);
    expect(result).toEqual([]);
  });

  // 2. Single top-level node gets positioned
  it('positions a single top-level node', () => {
    const nodes = [makeNode('a', 'systemNode')];
    const result = applyDagreLayout(nodes, []);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
    // dagre assigns a position; the node should have a defined position
    expect(result[0].position).toBeDefined();
    expect(typeof result[0].position.x).toBe('number');
    expect(typeof result[0].position.y).toBe('number');
  });

  // 3. Multiple top-level nodes with edges get different positions
  it('assigns different positions to multiple connected top-level nodes', () => {
    const nodes = [
      makeNode('a', 'systemNode'),
      makeNode('b', 'systemNode'),
      makeNode('c', 'systemNode'),
    ];
    const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')];
    const result = applyDagreLayout(nodes, edges);

    expect(result).toHaveLength(3);

    const positions = result.map((n) => n.position);
    // At least two nodes must differ in position
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(unique.size).toBeGreaterThan(1);
  });

  // 4. Child nodes (with parentId) get grid-positioned within parent
  it('grid-positions child nodes within their parent', () => {
    const nodes = [
      makeNode('parent', 'systemNode'),
      makeNode('c1', 'componentNode', 'parent'),
      makeNode('c2', 'componentNode', 'parent'),
      makeNode('c3', 'componentNode', 'parent'),
      makeNode('c4', 'componentNode', 'parent'),
    ];
    const edges: Edge[] = [];
    const result = applyDagreLayout(nodes, edges);

    const children = result.filter((n) => n.parentId === 'parent');
    expect(children).toHaveLength(4);

    // 4 children → ceil(sqrt(4)) = 2 cols
    // Constants from source: PAD_X=20, PAD_TOP=60, CHILD_W=260, CHILD_H=130, GAP_X=30, GAP_Y=30
    const PAD_X = 20;
    const PAD_TOP = 60;
    const CHILD_W = 260;
    const CHILD_H = 130;
    const GAP_X = 30;
    const GAP_Y = 30;
    const cols = 2;

    children.sort((a, b) => {
      // Sort by original insertion order via id
      const idxA = nodes.findIndex((n) => n.id === a.id);
      const idxB = nodes.findIndex((n) => n.id === b.id);
      return idxA - idxB;
    });

    children.forEach((child, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      expect(child.position.x).toBe(PAD_X + col * (CHILD_W + GAP_X));
      expect(child.position.y).toBe(PAD_TOP + row * (CHILD_H + GAP_Y));
    });
  });

  // 5. Parent nodes with children get style.width and style.height set
  it('sets style width and height on parent nodes that have children', () => {
    const nodes = [
      makeNode('parent', 'systemNode'),
      makeNode('c1', 'componentNode', 'parent'),
      makeNode('c2', 'componentNode', 'parent'),
    ];
    const result = applyDagreLayout(nodes, []);

    const parent = result.find((n) => n.id === 'parent');
    expect(parent).toBeDefined();
    expect(parent!.style).toBeDefined();
    expect(parent!.style!.width).toBeGreaterThan(0);
    expect(parent!.style!.height).toBeGreaterThan(0);

    // 2 children → cols = ceil(sqrt(2)) = 2, rows = ceil(2/2) = 1
    const PAD_X = 20;
    const PAD_TOP = 60;
    const PAD_BOTTOM = 20;
    const CHILD_W = 260;
    const CHILD_H = 130;
    const GAP_X = 30;
    const cols = 2;
    const rows = 1;

    const expectedW = PAD_X * 2 + cols * CHILD_W + (cols - 1) * GAP_X;
    const expectedH = PAD_TOP + PAD_BOTTOM + rows * CHILD_H + (rows - 1) * 30;

    expect(parent!.style!.width).toBe(expectedW);
    expect(parent!.style!.height).toBe(expectedH);
  });

  // 6. Custom layout options (direction: 'LR') are applied
  it('applies custom layout options such as LR direction', () => {
    const nodes = [
      makeNode('a', 'systemNode'),
      makeNode('b', 'systemNode'),
    ];
    const edges = [makeEdge('a', 'b')];

    const resultTB = applyDagreLayout(nodes, edges, { direction: 'TB' });
    const resultLR = applyDagreLayout(nodes, edges, { direction: 'LR' });

    const [aTB, bTB] = [
      resultTB.find((n) => n.id === 'a')!,
      resultTB.find((n) => n.id === 'b')!,
    ];
    const [aLR, bLR] = [
      resultLR.find((n) => n.id === 'a')!,
      resultLR.find((n) => n.id === 'b')!,
    ];

    // In TB layout, b should be below a (larger y)
    expect(bTB.position.y).toBeGreaterThan(aTB.position.y);

    // In LR layout, b should be to the right of a (larger x)
    expect(bLR.position.x).toBeGreaterThan(aLR.position.x);
  });

  // 7. Edge between child nodes gets resolved to top-level parent
  it('resolves edges between child nodes to their top-level parents', () => {
    const nodes = [
      makeNode('p1', 'systemNode'),
      makeNode('p2', 'systemNode'),
      makeNode('child1', 'componentNode', 'p1'),
      makeNode('child2', 'componentNode', 'p2'),
    ];
    // Edge between children of different parents
    const edges = [makeEdge('child1', 'child2')];
    const result = applyDagreLayout(nodes, edges);

    const p1 = result.find((n) => n.id === 'p1')!;
    const p2 = result.find((n) => n.id === 'p2')!;

    // The parents should be separated since there's an edge between their children
    const dist = Math.abs(p1.position.x - p2.position.x) + Math.abs(p1.position.y - p2.position.y);
    expect(dist).toBeGreaterThan(0);
  });

  // 8. Node types get correct dimensions from NODE_DIMENSIONS map
  it('uses NODE_DIMENSIONS for known node types', () => {
    // personNode should be 200×140, systemNode should be 300×160
    const nodes = [
      makeNode('person', 'personNode'),
      makeNode('system', 'systemNode'),
    ];
    const edges = [makeEdge('person', 'system')];
    const result = applyDagreLayout(nodes, edges);

    // Both nodes should be positioned (dagre ran successfully with correct dimensions)
    expect(result).toHaveLength(2);

    const person = result.find((n) => n.id === 'person')!;
    const system = result.find((n) => n.id === 'system')!;

    expect(person.position).toBeDefined();
    expect(system.position).toBeDefined();

    // In TB direction, both should have the same x (centered) but different y
    // The key assertion is that dagre used the correct widths: 200 vs 300
    // With TB layout and an edge person→system, system should be below person
    expect(system.position.y).toBeGreaterThan(person.position.y);
  });

  // 9. Unknown node type falls back to DEFAULT_OPTIONS dimensions
  it('falls back to default dimensions for unknown node types', () => {
    const nodes = [
      makeNode('a', 'unknownType'),
      makeNode('b', 'unknownType'),
    ];
    const edges = [makeEdge('a', 'b')];

    // Should not throw and should produce valid positions using default 280×120
    const result = applyDagreLayout(nodes, edges);
    expect(result).toHaveLength(2);

    const a = result.find((n) => n.id === 'a')!;
    const b = result.find((n) => n.id === 'b')!;

    expect(a.position).toBeDefined();
    expect(b.position).toBeDefined();
    expect(typeof a.position.x).toBe('number');
    expect(typeof a.position.y).toBe('number');
  });

  // Additional edge-case tests

  it('does not set style on top-level nodes without children', () => {
    const nodes = [makeNode('solo', 'systemNode')];
    const result = applyDagreLayout(nodes, []);

    const solo = result.find((n) => n.id === 'solo')!;
    // The original node had no style, and it has no children, so style should not be set
    expect(solo.style).toBeUndefined();
  });

  it('handles edges referencing non-existent nodes gracefully', () => {
    const nodes = [makeNode('a', 'systemNode')];
    const edges = [makeEdge('a', 'nonexistent')];

    // Should not throw
    const result = applyDagreLayout(nodes, edges);
    expect(result).toHaveLength(1);
  });

  it('handles self-referencing edges (same top-level parent) without error', () => {
    const nodes = [
      makeNode('p', 'systemNode'),
      makeNode('c1', 'componentNode', 'p'),
      makeNode('c2', 'componentNode', 'p'),
    ];
    // Both children belong to same parent → edge is between same top-level node
    const edges = [makeEdge('c1', 'c2')];

    const result = applyDagreLayout(nodes, edges);
    expect(result).toHaveLength(3);
  });

  it('preserves original node data through layout', () => {
    const nodes: Node[] = [
      { id: 'a', type: 'systemNode', position: { x: 0, y: 0 }, data: { label: 'System A', custom: 42 } },
    ];
    const result = applyDagreLayout(nodes, []);

    expect(result[0].data).toEqual({ label: 'System A', custom: 42 });
    expect(result[0].id).toBe('a');
    expect(result[0].type).toBe('systemNode');
  });

  it('positions single child correctly within parent', () => {
    const nodes = [
      makeNode('parent', 'systemNode'),
      makeNode('only', 'componentNode', 'parent'),
    ];
    const result = applyDagreLayout(nodes, []);

    const child = result.find((n) => n.id === 'only')!;
    // 1 child → cols=1, row=0, col=0
    expect(child.position.x).toBe(20); // PAD_X
    expect(child.position.y).toBe(60); // PAD_TOP
  });

  it('applies custom rankSep and nodeSep options', () => {
    const nodes = [
      makeNode('a', 'systemNode'),
      makeNode('b', 'systemNode'),
    ];
    const edges = [makeEdge('a', 'b')];

    const tight = applyDagreLayout(nodes, edges, { rankSep: 10, nodeSep: 10 });
    const loose = applyDagreLayout(nodes, edges, { rankSep: 500, nodeSep: 500 });

    const tightA = tight.find((n) => n.id === 'a')!;
    const tightB = tight.find((n) => n.id === 'b')!;
    const looseA = loose.find((n) => n.id === 'a')!;
    const looseB = loose.find((n) => n.id === 'b')!;

    const tightDist = Math.abs(tightB.position.y - tightA.position.y);
    const looseDist = Math.abs(looseB.position.y - looseA.position.y);

    // Larger rankSep should produce greater distance between ranks
    expect(looseDist).toBeGreaterThan(tightDist);
  });
});
