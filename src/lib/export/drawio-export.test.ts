// @vitest-environment jsdom
import { exportToDrawioXml } from './drawio-export';
import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';

function makeNode(
  id: string,
  kind: C4NodeData['kind'],
  boundary: C4NodeData['boundary'],
  opts?: Partial<C4NodeData> & { parentId?: string; x?: number; y?: number },
): Node<C4NodeData> {
  return {
    id,
    type:
      kind === 'person'
        ? 'personNode'
        : kind === 'softwareSystem'
          ? 'systemNode'
          : kind === 'container'
            ? 'containerNode'
            : 'componentNode',
    position: { x: opts?.x ?? 100, y: opts?.y ?? 200 },
    ...(opts?.parentId ? { parentId: opts.parentId } : {}),
    data: {
      kind,
      label: opts?.label ?? `Test ${id}`,
      boundary,
      description: opts?.description,
      technology: opts?.technology,
    },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  data?: C4EdgeData,
): Edge<C4EdgeData> {
  return { id, source, target, data };
}

/** Parse the XML string (without the declaration) into a Document */
function parseXml(xml: string): Document {
  const body = xml.replace(/^<\?xml[^?]*\?>\n?/, '');
  return new DOMParser().parseFromString(body, 'application/xml');
}

describe('exportToDrawioXml', () => {
  // ---------------------------------------------------------------
  // 1. Empty nodes and edges produces valid XML with root cells
  // ---------------------------------------------------------------
  describe('empty input', () => {
    it('returns valid XML containing root cells id=0 and id=1', () => {
      const xml = exportToDrawioXml([], []);
      const doc = parseXml(xml);

      const cells = doc.querySelectorAll('mxCell');
      expect(cells.length).toBeGreaterThanOrEqual(2);

      const ids = Array.from(cells).map((c) => c.getAttribute('id'));
      expect(ids).toContain('0');
      expect(ids).toContain('1');
    });

    it('cell id=1 has parent=0', () => {
      const xml = exportToDrawioXml([], []);
      const doc = parseXml(xml);
      const cell1 = doc.querySelector('mxCell[id="1"]');
      expect(cell1?.getAttribute('parent')).toBe('0');
    });

    it('has no vertex or edge cells', () => {
      const xml = exportToDrawioXml([], []);
      const doc = parseXml(xml);
      const vertices = doc.querySelectorAll('mxCell[vertex="1"]');
      const edges = doc.querySelectorAll('mxCell[edge="1"]');
      expect(vertices.length).toBe(0);
      expect(edges.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // 2. Single person node produces mxCell with correct style & geometry
  // ---------------------------------------------------------------
  describe('single person node', () => {
    const nodes = [makeNode('p1', 'person', 'internal')];
    const xml = exportToDrawioXml(nodes, []);

    it('creates a vertex mxCell for the person', () => {
      const doc = parseXml(xml);
      const vertices = doc.querySelectorAll('mxCell[vertex="1"]');
      expect(vertices.length).toBe(1);
    });

    it('applies the person internal style', () => {
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('shape=mxgraph.c4.person2');
      expect(style).toContain('fillColor=#08427B');
    });

    it('sets geometry with person dimensions (200x180)', () => {
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[vertex="1"] > mxGeometry');
      expect(geom).not.toBeNull();
      expect(geom?.getAttribute('width')).toBe('200');
      expect(geom?.getAttribute('height')).toBe('180');
    });

    it('sets parent to 1 (default layer)', () => {
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      expect(vertex?.getAttribute('parent')).toBe('1');
    });
  });

  // ---------------------------------------------------------------
  // 3. Single software system node with internal boundary
  // ---------------------------------------------------------------
  describe('software system node (internal)', () => {
    const nodes = [makeNode('sys1', 'softwareSystem', 'internal')];
    const xml = exportToDrawioXml(nodes, []);

    it('applies the software system internal style', () => {
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('fillColor=#1168BD');
      expect(style).toContain('strokeColor=#0E5AA7');
    });

    it('sets geometry with softwareSystem dimensions (280x160)', () => {
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[vertex="1"] > mxGeometry');
      expect(geom?.getAttribute('width')).toBe('280');
      expect(geom?.getAttribute('height')).toBe('160');
    });
  });

  // ---------------------------------------------------------------
  // 4. External boundary uses external style
  // ---------------------------------------------------------------
  describe('external boundary style', () => {
    it('uses external style for a person with external boundary', () => {
      const nodes = [makeNode('ep1', 'person', 'external')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('fillColor=#999999');
      expect(style).toContain('strokeColor=#8A8A8A');
    });

    it('uses external style for a softwareSystem with external boundary', () => {
      const nodes = [makeNode('es1', 'softwareSystem', 'external')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('fillColor=#999999');
      expect(style).toContain('strokeColor=#8A8A8A');
    });

    it('uses external style for a container with external boundary', () => {
      const nodes = [makeNode('ec1', 'container', 'external')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('fillColor=#B3B3B3');
      expect(style).toContain('strokeColor=#A0A0A0');
    });

    it('uses external style for a component with external boundary', () => {
      const nodes = [makeNode('ecomp1', 'component', 'external')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const style = vertex?.getAttribute('style') ?? '';
      expect(style).toContain('fillColor=#CCCCCC');
      expect(style).toContain('strokeColor=#BABABA');
    });
  });

  // ---------------------------------------------------------------
  // 5. Container node with parentId gets correct parent cell reference
  // ---------------------------------------------------------------
  describe('container node with parentId', () => {
    it('sets parent to the mapped id of the parent node', () => {
      const nodes = [
        makeNode('sys1', 'softwareSystem', 'internal'),
        makeNode('c1', 'container', 'internal', { parentId: 'sys1' }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);

      // sys1 gets id=2, c1 gets id=3
      const container = doc.querySelector('mxCell[id="3"]');
      expect(container).not.toBeNull();
      expect(container?.getAttribute('parent')).toBe('2');
    });

    it('falls back to parent=1 when parentId is not in the node list', () => {
      const nodes = [
        makeNode('c1', 'container', 'internal', { parentId: 'nonexistent' }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      expect(vertex?.getAttribute('parent')).toBe('1');
    });
  });

  // ---------------------------------------------------------------
  // 6. Edges produce mxCell with source and target references
  // ---------------------------------------------------------------
  describe('edges', () => {
    it('creates an edge mxCell linking source and target node ids', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b', { label: 'Uses' })];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);

      // a → id 2, b → id 3, e1 → id 4
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      expect(edgeCell).not.toBeNull();
      expect(edgeCell?.getAttribute('source')).toBe('2');
      expect(edgeCell?.getAttribute('target')).toBe('3');
    });

    it('applies edge style', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b')];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);

      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      const style = edgeCell?.getAttribute('style') ?? '';
      expect(style).toContain('edgeStyle=orthogonalEdgeStyle');
      expect(style).toContain('strokeColor=#707070');
    });

    it('sets parent=1 on edge cells', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b')];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      expect(edgeCell?.getAttribute('parent')).toBe('1');
    });

    it('has relative geometry on edge', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b')];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[edge="1"] > mxGeometry');
      expect(geom).not.toBeNull();
      expect(geom?.getAttribute('relative')).toBe('1');
      expect(geom?.getAttribute('as')).toBe('geometry');
    });

    it('skips edges whose source or target node is missing', () => {
      const nodes = [makeNode('a', 'person', 'internal')];
      const edges = [makeEdge('e1', 'a', 'nonexistent')];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCells = doc.querySelectorAll('mxCell[edge="1"]');
      expect(edgeCells.length).toBe(0);
    });

    it('includes edge label in value attribute', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [makeEdge('e1', 'a', 'b', { label: 'Makes API calls' })];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      expect(edgeCell?.getAttribute('value')).toContain('Makes API calls');
    });

    it('includes protocol in edge label', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [
        makeEdge('e1', 'a', 'b', { label: 'Uses', protocol: 'HTTPS' }),
      ];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      const value = edgeCell?.getAttribute('value') ?? '';
      expect(value).toContain('Uses');
      expect(value).toContain('[HTTPS]');
    });
  });

  // ---------------------------------------------------------------
  // 7. Edge labels are properly HTML-escaped
  // ---------------------------------------------------------------
  describe('HTML escaping', () => {
    it('escapes special characters in edge labels', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [
        makeEdge('e1', 'a', 'b', { label: 'Reads <data> & "writes"' }),
      ];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      const value = edgeCell?.getAttribute('value') ?? '';
      expect(value).toContain('&amp;');
      expect(value).toContain('&lt;');
      expect(value).toContain('&gt;');
      expect(value).toContain('&quot;');
      expect(value).not.toContain('<data>');
    });

    it('escapes special characters in node labels', () => {
      const nodes = [
        makeNode('n1', 'person', 'internal', {
          label: 'User <Admin> & "Root"',
        }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('&amp;');
      expect(value).toContain('&lt;');
      expect(value).toContain('&gt;');
      expect(value).toContain('&quot;');
    });

    it('escapes special characters in protocol', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
      ];
      const edges = [
        makeEdge('e1', 'a', 'b', { label: 'Calls', protocol: 'JSON/HTTPS & REST' }),
      ];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const edgeCell = doc.querySelector('mxCell[edge="1"]');
      const value = edgeCell?.getAttribute('value') ?? '';
      expect(value).toContain('&amp;');
    });
  });

  // ---------------------------------------------------------------
  // 8. Output starts with XML declaration
  // ---------------------------------------------------------------
  describe('XML declaration', () => {
    it('starts with <?xml version="1.0" encoding="UTF-8"?>', () => {
      const xml = exportToDrawioXml([], []);
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it('has a newline after the declaration before the document body', () => {
      const xml = exportToDrawioXml([], []);
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<mxGraphModel/);
    });
  });

  // ---------------------------------------------------------------
  // 9. Output contains <mxGraphModel root element
  // ---------------------------------------------------------------
  describe('mxGraphModel root element', () => {
    it('contains <mxGraphModel as the root element', () => {
      const xml = exportToDrawioXml([], []);
      expect(xml).toContain('<mxGraphModel');
    });

    it('has expected attributes on mxGraphModel', () => {
      const xml = exportToDrawioXml([], []);
      const doc = parseXml(xml);
      const model = doc.documentElement;
      expect(model.tagName).toBe('mxGraphModel');
      expect(model.getAttribute('grid')).toBe('1');
      expect(model.getAttribute('page')).toBe('1');
      expect(model.getAttribute('pageWidth')).toBe('1169');
      expect(model.getAttribute('pageHeight')).toBe('827');
    });

    it('has a <root> child inside mxGraphModel', () => {
      const xml = exportToDrawioXml([], []);
      const doc = parseXml(xml);
      const roots = doc.getElementsByTagName('root');
      expect(roots.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------
  // 10. Node positions are offset (x+100, y+60)
  // ---------------------------------------------------------------
  describe('position offset', () => {
    it('offsets x by +100 and y by +60', () => {
      const nodes = [makeNode('n1', 'person', 'internal', { x: 100, y: 200 })];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[vertex="1"] > mxGeometry');
      expect(geom?.getAttribute('x')).toBe('200'); // 100 + 100
      expect(geom?.getAttribute('y')).toBe('260'); // 200 + 60
    });

    it('offsets position (0,0) to (100,60)', () => {
      const nodes = [makeNode('n1', 'person', 'internal', { x: 0, y: 0 })];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[vertex="1"] > mxGeometry');
      expect(geom?.getAttribute('x')).toBe('100');
      expect(geom?.getAttribute('y')).toBe('60');
    });

    it('rounds fractional positions', () => {
      const nodes = [makeNode('n1', 'person', 'internal', { x: 33.7, y: 44.3 })];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const geom = doc.querySelector('mxCell[vertex="1"] > mxGeometry');
      expect(geom?.getAttribute('x')).toBe('134'); // Math.round(33.7 + 100)
      expect(geom?.getAttribute('y')).toBe('104'); // Math.round(44.3 + 60)
    });
  });

  // ---------------------------------------------------------------
  // 11. Node labels include bold name and description
  // ---------------------------------------------------------------
  describe('node labels', () => {
    it('includes bold label name', () => {
      const nodes = [makeNode('n1', 'softwareSystem', 'internal', { label: 'My System' })];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('<b>My System</b>');
    });

    it('includes description when provided', () => {
      const nodes = [
        makeNode('n1', 'softwareSystem', 'internal', {
          label: 'API',
          description: 'Serves data to clients',
        }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('Serves data to clients');
      expect(value).toContain('font-size:10px');
    });

    it('omits description span when description is undefined', () => {
      const nodes = [makeNode('n1', 'person', 'internal', { label: 'Alice' })];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('<b>Alice</b>');
      // Only bold + tag, no trailing span
      expect(value).not.toContain('<span');
    });

    it('includes [Person] tag for person nodes', () => {
      const nodes = [makeNode('n1', 'person', 'internal')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('[Person]');
    });

    it('includes [Software System] tag for softwareSystem nodes', () => {
      const nodes = [makeNode('n1', 'softwareSystem', 'internal')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('[Software System]');
    });

    it('includes [Container: tech] tag when technology is set', () => {
      const nodes = [
        makeNode('n1', 'container', 'internal', { technology: 'Spring Boot' }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('[Container: Spring Boot]');
    });

    it('includes [Container] tag without technology', () => {
      const nodes = [makeNode('n1', 'container', 'internal')];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('[Container]');
    });

    it('includes [Component: tech] tag when technology is set', () => {
      const nodes = [
        makeNode('n1', 'component', 'internal', { technology: 'React' }),
      ];
      const xml = exportToDrawioXml(nodes, []);
      const doc = parseXml(xml);
      const vertex = doc.querySelector('mxCell[vertex="1"]');
      const value = vertex?.getAttribute('value') ?? '';
      expect(value).toContain('[Component: React]');
    });
  });

  // ---------------------------------------------------------------
  // Bonus: multiple nodes & edges integration
  // ---------------------------------------------------------------
  describe('integration – multiple nodes and edges', () => {
    it('assigns sequential ids starting from 2', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'internal'),
        makeNode('c', 'container', 'internal'),
      ];
      const edges = [
        makeEdge('e1', 'a', 'b', { label: 'Uses' }),
        makeEdge('e2', 'b', 'c', { label: 'Contains' }),
      ];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);

      // nodes: a=2, b=3, c=4; edges: e1=5, e2=6
      expect(doc.querySelector('mxCell[id="2"][vertex="1"]')).not.toBeNull();
      expect(doc.querySelector('mxCell[id="3"][vertex="1"]')).not.toBeNull();
      expect(doc.querySelector('mxCell[id="4"][vertex="1"]')).not.toBeNull();
      expect(doc.querySelector('mxCell[id="5"][edge="1"]')).not.toBeNull();
      expect(doc.querySelector('mxCell[id="6"][edge="1"]')).not.toBeNull();
    });

    it('total mxCell count equals 2 root + nodes + edges', () => {
      const nodes = [
        makeNode('a', 'person', 'internal'),
        makeNode('b', 'softwareSystem', 'external'),
      ];
      const edges = [makeEdge('e1', 'a', 'b')];
      const xml = exportToDrawioXml(nodes, edges);
      const doc = parseXml(xml);
      const allCells = doc.querySelectorAll('mxCell');
      expect(allCells.length).toBe(2 + 2 + 1); // root cells + nodes + edges
    });
  });
});
