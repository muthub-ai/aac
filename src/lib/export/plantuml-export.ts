import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData, C4NodeKind } from '@/types/c4';

const STDLIB_BASE =
  'https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/';

/** Determine the best C4 include file from the node kinds present. */
function detectInclude(kinds: Set<C4NodeKind>): string {
  if (kinds.has('deploymentNode') || kinds.has('infrastructureNode'))
    return 'C4_Deployment.puml';
  if (kinds.has('component')) return 'C4_Component.puml';
  if (kinds.has('container')) return 'C4_Container.puml';
  return 'C4_Context.puml';
}

/** Sanitise an id for PlantUML alias (alphanumeric + underscore). */
function toAlias(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/** Escape a string for use inside PlantUML double-quoted arguments. */
function escapeQuotes(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Return true when the technology string suggests a database. */
function isDatabase(data: C4NodeData): boolean {
  const tech = (data.technology ?? '').toLowerCase();
  return tech.includes('database') || tech.includes('db');
}

/** Return true when the node should be treated as external. */
function isExternal(data: C4NodeData): boolean {
  return data.boundary === 'external';
}

/**
 * Build the PlantUML macro call for a single node.
 * The indent parameter controls nesting (deployment diagrams).
 */
function renderNode(
  node: Node<C4NodeData>,
  indent: string,
): string {
  const { data } = node;
  const alias = toAlias(node.id);
  const label = escapeQuotes(data.label);
  const desc = data.description ? escapeQuotes(data.description) : '';
  const tech = data.technology ? escapeQuotes(data.technology) : '';

  switch (data.kind) {
    case 'person':
      return isExternal(data)
        ? `${indent}Person_Ext(${alias}, "${label}", "${desc}")`
        : `${indent}Person(${alias}, "${label}", "${desc}")`;

    case 'softwareSystem':
      return isExternal(data)
        ? `${indent}System_Ext(${alias}, "${label}", "${desc}")`
        : `${indent}System(${alias}, "${label}", "${desc}")`;

    case 'container':
      if (isDatabase(data)) {
        return isExternal(data)
          ? `${indent}ContainerDb_Ext(${alias}, "${label}", "${tech}", "${desc}")`
          : `${indent}ContainerDb(${alias}, "${label}", "${tech}", "${desc}")`;
      }
      return isExternal(data)
        ? `${indent}Container_Ext(${alias}, "${label}", "${tech}", "${desc}")`
        : `${indent}Container(${alias}, "${label}", "${tech}", "${desc}")`;

    case 'component':
      if (isDatabase(data)) {
        return isExternal(data)
          ? `${indent}ComponentDb_Ext(${alias}, "${label}", "${tech}", "${desc}")`
          : `${indent}ComponentDb(${alias}, "${label}", "${tech}", "${desc}")`;
      }
      return isExternal(data)
        ? `${indent}Component_Ext(${alias}, "${label}", "${tech}", "${desc}")`
        : `${indent}Component(${alias}, "${label}", "${tech}", "${desc}")`;

    case 'infrastructureNode':
      return `${indent}Deployment_Node(${alias}, "${label}", "${tech}") {
${indent}}`;

    // deploymentNode is handled separately via renderDeploymentTree
    case 'deploymentNode':
      return `${indent}Deployment_Node(${alias}, "${label}", "${tech}") {
${indent}}`;
  }
}

/**
 * Render a deployment node and recursively nest its children.
 * Returns an array of output lines.
 */
function renderDeploymentTree(
  node: Node<C4NodeData>,
  childrenMap: Map<string, Node<C4NodeData>[]>,
  indent: string,
): string[] {
  const { data } = node;
  const alias = toAlias(node.id);
  const label = escapeQuotes(data.label);
  const tech = data.technology ? escapeQuotes(data.technology) : '';

  const lines: string[] = [];
  lines.push(`${indent}Deployment_Node(${alias}, "${label}", "${tech}") {`);

  const children = childrenMap.get(node.id) ?? [];
  for (const child of children) {
    if (
      child.data.kind === 'deploymentNode' ||
      child.data.kind === 'infrastructureNode'
    ) {
      lines.push(
        ...renderDeploymentTree(child, childrenMap, indent + '  '),
      );
    } else {
      lines.push(renderNode(child, indent + '  '));
    }
  }

  lines.push(`${indent}}`);
  return lines;
}

/**
 * Export React Flow nodes and edges to C4-PlantUML syntax.
 *
 * Returns a complete `.puml` file as a string, using the
 * C4-PlantUML standard library includes from GitHub.
 */
export function exportToPlantUml(
  nodes: Node<C4NodeData>[],
  edges: Edge<C4EdgeData>[],
): string {
  // Collect the set of node kinds for diagram-type detection.
  const kinds = new Set<C4NodeKind>(nodes.map((n) => n.data.kind));
  const include = detectInclude(kinds);

  // Build a parent → children lookup.
  const childrenMap = new Map<string, Node<C4NodeData>[]>();
  const topLevelNodes: Node<C4NodeData>[] = [];
  const nodeById = new Map<string, Node<C4NodeData>>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
  }
  for (const node of nodes) {
    if (node.parentId && nodeById.has(node.parentId)) {
      const siblings = childrenMap.get(node.parentId) ?? [];
      siblings.push(node);
      childrenMap.set(node.parentId, siblings);
    } else {
      topLevelNodes.push(node);
    }
  }

  const lines: string[] = [];

  // Header
  lines.push('@startuml');
  lines.push(`!include ${STDLIB_BASE}${include}`);
  lines.push('');

  // Nodes
  for (const node of topLevelNodes) {
    if (
      node.data.kind === 'deploymentNode' ||
      node.data.kind === 'infrastructureNode'
    ) {
      lines.push(
        ...renderDeploymentTree(node, childrenMap, ''),
      );
    } else {
      lines.push(renderNode(node, ''));
    }
  }

  // Relationships
  if (edges.length > 0) {
    lines.push('');
    for (const edge of edges) {
      const sourceAlias = toAlias(edge.source);
      const targetAlias = toAlias(edge.target);
      const label = edge.data?.label ? escapeQuotes(edge.data.label) : '';
      const protocol = edge.data?.protocol ? escapeQuotes(edge.data.protocol) : '';
      lines.push(`Rel(${sourceAlias}, ${targetAlias}, "${label}", "${protocol}")`);
    }
  }

  lines.push('');
  lines.push('@enduml');

  return lines.join('\n');
}
