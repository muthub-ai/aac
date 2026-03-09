import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import type { ViewInfo } from '@/lib/parser/new-to-old-transform';
import { filterGraphByView } from './filter-by-view';

/* ─── helpers ─── */
function makeNode(id: string, kind: C4NodeData['kind'], boundary: 'internal' | 'external' = 'internal'): Node<C4NodeData> {
  return {
    id,
    type: kind === 'person' ? 'personNode' : kind === 'softwareSystem' ? 'systemNode' : 'containerNode',
    position: { x: 0, y: 0 },
    data: { kind, label: id, boundary },
    ...(kind === 'container' ? { parentId: id.split('.')[0] } : {}),
  };
}

function makeEdge(source: string, target: string, label = 'Uses'): Edge<C4EdgeData> {
  return { id: `${source}->${target}`, source, target, data: { label } };
}

/* ─── test data ─── */
const nodes: Node<C4NodeData>[] = [
  makeNode('User', 'person'),
  makeNode('Admin', 'person'),
  makeNode('ECommerce', 'softwareSystem'),
  makeNode('ECommerce.WebApp', 'container'),
  makeNode('ECommerce.API', 'container'),
  makeNode('ECommerce.DB', 'container'),
  makeNode('Inventory', 'softwareSystem', 'external'),
  makeNode('Inventory.Service', 'container'),
  makeNode('PaymentGateway', 'softwareSystem', 'external'),
];

const edges: Edge<C4EdgeData>[] = [
  makeEdge('User', 'ECommerce.WebApp', 'Visits'),
  makeEdge('Admin', 'ECommerce.WebApp', 'Manages'),
  makeEdge('ECommerce.WebApp', 'ECommerce.API', 'Calls'),
  makeEdge('ECommerce.API', 'ECommerce.DB', 'Reads/Writes'),
  makeEdge('ECommerce.API', 'Inventory.Service', 'Checks stock'),
  makeEdge('ECommerce.API', 'PaymentGateway', 'Processes payment'),
];

/* ─── tests ─── */
describe('filterGraphByView', () => {
  describe('no view selected', () => {
    it('returns all nodes and edges when view is undefined', () => {
      const result = filterGraphByView(nodes, edges, undefined);
      expect(result.nodes).toHaveLength(nodes.length);
      expect(result.edges).toHaveLength(edges.length);
    });
  });

  describe('system context view', () => {
    const view: ViewInfo = {
      key: 'ECommerce-SystemContext',
      type: 'systemContext',
      softwareSystemId: 'ECommerce',
    };

    it('includes the focus software system', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('ECommerce');
    });

    it('includes people connected to the focus system containers', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('User');
      expect(ids).toContain('Admin');
    });

    it('includes external systems connected to the focus system', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('Inventory');
      expect(ids).toContain('PaymentGateway');
    });

    it('excludes containers (they are internal details)', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).not.toContain('ECommerce.WebApp');
      expect(ids).not.toContain('ECommerce.API');
      expect(ids).not.toContain('ECommerce.DB');
      expect(ids).not.toContain('Inventory.Service');
    });

    it('produces edges between visible nodes only', () => {
      const result = filterGraphByView(nodes, edges, view);
      for (const edge of result.edges) {
        const nodeIds = result.nodes.map((n) => n.id);
        expect(nodeIds).toContain(edge.source);
        expect(nodeIds).toContain(edge.target);
      }
    });

    it('remaps container-level edges to the system level', () => {
      const result = filterGraphByView(nodes, edges, view);
      // User->ECommerce.WebApp should become User->ECommerce
      expect(result.edges.some((e) => e.source === 'User' && e.target === 'ECommerce')).toBe(true);
      // ECommerce.API->PaymentGateway should become ECommerce->PaymentGateway
      expect(result.edges.some((e) => e.source === 'ECommerce' && e.target === 'PaymentGateway')).toBe(true);
      // ECommerce.API->Inventory.Service should become ECommerce->Inventory
      expect(result.edges.some((e) => e.source === 'ECommerce' && e.target === 'Inventory')).toBe(true);
    });

    it('does not produce self-loop edges from internal container edges', () => {
      const result = filterGraphByView(nodes, edges, view);
      for (const edge of result.edges) {
        expect(edge.source).not.toBe(edge.target);
      }
    });
  });

  describe('container view', () => {
    const view: ViewInfo = {
      key: 'ECommerce-Containers',
      type: 'container',
      softwareSystemId: 'ECommerce',
    };

    it('includes the focus system node (as parent/boundary)', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('ECommerce');
    });

    it('includes all containers of the focus system', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('ECommerce.WebApp');
      expect(ids).toContain('ECommerce.API');
      expect(ids).toContain('ECommerce.DB');
    });

    it('includes people connected to focus system containers', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toContain('User');
      expect(ids).toContain('Admin');
    });

    it('includes external systems connected to focus system containers', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      // Inventory.Service is connected, should be resolved to Inventory system
      expect(ids).toContain('Inventory');
      expect(ids).toContain('PaymentGateway');
    });

    it('excludes containers of other systems', () => {
      const result = filterGraphByView(nodes, edges, view);
      const ids = result.nodes.map((n) => n.id);
      expect(ids).not.toContain('Inventory.Service');
    });

    it('preserves internal container-to-container edges', () => {
      const result = filterGraphByView(nodes, edges, view);
      expect(
        result.edges.some((e) => e.source === 'ECommerce.WebApp' && e.target === 'ECommerce.API'),
      ).toBe(true);
      expect(
        result.edges.some((e) => e.source === 'ECommerce.API' && e.target === 'ECommerce.DB'),
      ).toBe(true);
    });

    it('remaps edges to external containers to their parent system', () => {
      const result = filterGraphByView(nodes, edges, view);
      // ECommerce.API->Inventory.Service should become ECommerce.API->Inventory
      expect(
        result.edges.some((e) => e.source === 'ECommerce.API' && e.target === 'Inventory'),
      ).toBe(true);
    });

    it('produces edges between visible nodes only', () => {
      const result = filterGraphByView(nodes, edges, view);
      const nodeIds = new Set(result.nodes.map((n) => n.id));
      for (const edge of result.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    });
  });

  describe('deployment view', () => {
    const view: ViewInfo = {
      key: 'ECommerce-GCP-Production',
      type: 'deployment',
      softwareSystemId: 'ECommerce',
      environment: 'GCP Production',
    };

    it('returns all nodes and edges (not yet supported)', () => {
      const result = filterGraphByView(nodes, edges, view);
      expect(result.nodes).toHaveLength(nodes.length);
      expect(result.edges).toHaveLength(edges.length);
    });
  });

  describe('edge cases', () => {
    it('returns all if focus system not found', () => {
      const view: ViewInfo = {
        key: 'NonExistent-SystemContext',
        type: 'systemContext',
        softwareSystemId: 'NonExistent',
      };
      const result = filterGraphByView(nodes, edges, view);
      expect(result.nodes).toHaveLength(nodes.length);
      expect(result.edges).toHaveLength(edges.length);
    });

    it('handles empty nodes/edges', () => {
      const view: ViewInfo = {
        key: 'ECommerce-SystemContext',
        type: 'systemContext',
        softwareSystemId: 'ECommerce',
      };
      const result = filterGraphByView([], [], view);
      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('deduplicates remapped edges', () => {
      // Both User and Admin connect to ECommerce.WebApp; in system-context
      // these both become X->ECommerce so they should be distinct
      const view: ViewInfo = {
        key: 'ECommerce-SystemContext',
        type: 'systemContext',
        softwareSystemId: 'ECommerce',
      };
      const result = filterGraphByView(nodes, edges, view);
      const edgeKeys = result.edges.map((e) => `${e.source}->${e.target}`);
      const uniqueKeys = new Set(edgeKeys);
      expect(edgeKeys.length).toBe(uniqueKeys.size);
    });
  });
});
