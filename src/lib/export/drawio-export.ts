import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';

const STYLES = {
  person: {
    internal:
      'shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;fillColor=#08427B;strokeColor=#073B6F;fontColor=#ffffff;fontSize=13;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;fillColor=#999999;strokeColor=#8A8A8A;fontColor=#ffffff;fontSize=13;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  softwareSystem: {
    internal:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#1168BD;strokeColor=#0E5AA7;fontColor=#ffffff;fontSize=13;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#999999;strokeColor=#8A8A8A;fontColor=#ffffff;fontSize=13;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  container: {
    internal:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#438DD5;strokeColor=#3C7FC0;fontColor=#ffffff;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#B3B3B3;strokeColor=#A0A0A0;fontColor=#ffffff;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  component: {
    internal:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#85BBF0;strokeColor=#78ACE0;fontColor=#000000;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#CCCCCC;strokeColor=#BABABA;fontColor=#000000;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  deploymentNode: {
    internal:
      'rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#E8F5E9;strokeColor=#388E3C;fontColor=#1B5E20;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#E8F5E9;strokeColor=#388E3C;fontColor=#1B5E20;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  infrastructureNode: {
    internal:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF8E1;strokeColor=#F9A825;fontColor=#E65100;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
    external:
      'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF8E1;strokeColor=#F9A825;fontColor=#E65100;fontSize=11;fontStyle=1;align=center;verticalAlign=middle;arcSize=10;metaEdit=1;resizable=1;points=[];',
  },
  edge:
    'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#707070;fontColor=#585858;fontSize=11;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
} as const;

const NODE_SIZES: Record<string, { w: number; h: number }> = {
  person: { w: 200, h: 180 },
  softwareSystem: { w: 280, h: 160 },
  container: { w: 240, h: 140 },
  component: { w: 220, h: 120 },
  deploymentNode: { w: 340, h: 180 },
  infrastructureNode: { w: 240, h: 100 },
};

function buildLabel(data: C4NodeData): string {
  const parts: string[] = [];
  parts.push(`<b>${escapeHtml(data.label)}</b>`);
  const tag = formatTag(data);
  if (tag) parts.push(`<br/><i style="font-size:10px;">${escapeHtml(tag)}</i>`);
  if (data.description) {
    parts.push(`<br/><span style="font-size:10px;">${escapeHtml(data.description)}</span>`);
  }
  return parts.join('');
}

function formatTag(data: C4NodeData): string {
  switch (data.kind) {
    case 'person':
      return '[Person]';
    case 'softwareSystem':
      return '[Software System]';
    case 'container':
      return data.technology ? `[Container: ${data.technology}]` : '[Container]';
    case 'component':
      return data.technology ? `[Component: ${data.technology}]` : '[Component]';
    case 'deploymentNode':
      return data.technology ? `[${data.technology}]` : '[Deployment Node]';
    case 'infrastructureNode':
      return data.technology ? `[${data.technology}]` : '[Infrastructure]';
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEdgeLabel(data?: C4EdgeData): string {
  const parts: string[] = [];
  if (data?.label) parts.push(escapeHtml(data.label));
  if (data?.protocol) parts.push(`[${escapeHtml(data.protocol)}]`);
  return parts.join('<br/>');
}

export function exportToDrawioXml(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
): string {
  let nextId = 2;
  const idMap = new Map<string, number>();
  for (const node of nodes) idMap.set(node.id, nextId++);
  for (const edge of edges) idMap.set(edge.id, nextId++);

  const doc = document.implementation.createDocument(null, 'mxGraphModel', null);
  const model = doc.documentElement;
  const attrs: Record<string, string> = {
    dx: '1422', dy: '762', grid: '1', gridSize: '10',
    guides: '1', tooltips: '1', connect: '1', arrows: '1',
    fold: '1', page: '1', pageScale: '1', pageWidth: '1169',
    pageHeight: '827', math: '0', shadow: '0',
  };
  for (const [k, v] of Object.entries(attrs)) model.setAttribute(k, v);

  const root = doc.createElement('root');
  model.appendChild(root);

  const cell0 = doc.createElement('mxCell');
  cell0.setAttribute('id', '0');
  root.appendChild(cell0);

  const cell1 = doc.createElement('mxCell');
  cell1.setAttribute('id', '1');
  cell1.setAttribute('parent', '0');
  root.appendChild(cell1);

  for (const node of nodes) {
    const cellId = idMap.get(node.id)!;
    const { kind, boundary } = node.data;
    const style = STYLES[kind]?.[boundary] ?? STYLES.softwareSystem.internal;
    const size = NODE_SIZES[kind] ?? NODE_SIZES.softwareSystem;
    const label = buildLabel(node.data);
    const x = Math.round((node.position?.x ?? 0) + 100);
    const y = Math.round((node.position?.y ?? 0) + 60);
    const parentCellId = node.parentId && idMap.has(node.parentId) ? idMap.get(node.parentId)! : 1;

    const cell = doc.createElement('mxCell');
    cell.setAttribute('id', String(cellId));
    cell.setAttribute('value', label);
    cell.setAttribute('style', style);
    cell.setAttribute('vertex', '1');
    cell.setAttribute('parent', String(parentCellId));

    const geom = doc.createElement('mxGeometry');
    geom.setAttribute('x', String(x));
    geom.setAttribute('y', String(y));
    geom.setAttribute('width', String(size.w));
    geom.setAttribute('height', String(size.h));
    geom.setAttribute('as', 'geometry');
    cell.appendChild(geom);
    root.appendChild(cell);
  }

  for (const edge of edges) {
    const cellId = idMap.get(edge.id)!;
    const sourceId = idMap.get(edge.source);
    const targetId = idMap.get(edge.target);
    if (!sourceId || !targetId) continue;
    const label = buildEdgeLabel(edge.data);

    const cell = doc.createElement('mxCell');
    cell.setAttribute('id', String(cellId));
    cell.setAttribute('value', label);
    cell.setAttribute('style', STYLES.edge);
    cell.setAttribute('edge', '1');
    cell.setAttribute('parent', '1');
    cell.setAttribute('source', String(sourceId));
    cell.setAttribute('target', String(targetId));

    const geom = doc.createElement('mxGeometry');
    geom.setAttribute('relative', '1');
    geom.setAttribute('as', 'geometry');
    cell.appendChild(geom);
    root.appendChild(cell);
  }

  const serializer = new XMLSerializer();
  const xmlStr = serializer.serializeToString(doc);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlStr;
}

export function downloadDrawioXml(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
  filename = 'export.drawio.xml',
): void {
  const xml = exportToDrawioXml(nodes, edges);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
