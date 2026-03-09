import type { Node, Edge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import type { ViewInfo } from '@/lib/parser/new-to-old-transform';

interface FilteredGraph {
  nodes: Node<C4NodeData>[];
  edges: Edge<C4EdgeData>[];
}

/**
 * Filter nodes/edges to only show elements relevant to a given architecture view.
 *
 * - System Context: focus system + people and external systems connected to it
 * - Container:      containers inside the focus system + people and external systems connected to them
 * - Deployment:     deployment nodes, infrastructure nodes, and their edges
 */
export function filterGraphByView(
  allNodes: Node<C4NodeData>[],
  allEdges: Edge<C4EdgeData>[],
  view: ViewInfo | undefined,
): FilteredGraph {
  if (!view) {
    // No view selected: show only C4 nodes (hide deployment nodes)
    return filterC4Only(allNodes, allEdges);
  }

  switch (view.type) {
    case 'systemContext':
      return filterSystemContext(allNodes, allEdges, view.softwareSystemId);
    case 'container':
      return filterContainer(allNodes, allEdges, view.softwareSystemId);
    case 'deployment':
      return filterDeployment(allNodes, allEdges);
    default:
      return filterC4Only(allNodes, allEdges);
  }
}

/**
 * Default view: show only C4 model nodes (people, systems, containers, components).
 * Excludes deployment/infrastructure nodes which are only shown in deployment views.
 */
function filterC4Only(
  allNodes: Node<C4NodeData>[],
  allEdges: Edge<C4EdgeData>[],
): FilteredGraph {
  const DEPLOYMENT_KINDS = new Set(['deploymentNode', 'infrastructureNode']);
  const nodes = allNodes.filter((n) => !DEPLOYMENT_KINDS.has(n.data.kind));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = allEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return { nodes, edges };
}

/**
 * Deployment View:
 *   Show only deployment nodes, infrastructure nodes, and deployment children.
 *   Edges between them (from infrastructure relationships).
 */
function filterDeployment(
  allNodes: Node<C4NodeData>[],
  allEdges: Edge<C4EdgeData>[],
): FilteredGraph {
  const DEPLOYMENT_KINDS = new Set(['deploymentNode', 'infrastructureNode']);
  const nodes = allNodes.filter((n) => DEPLOYMENT_KINDS.has(n.data.kind));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = allEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return { nodes, edges };
}

/**
 * System Context View:
 *   Show the focus software system as a single box (no containers).
 *   Show people and other software systems that are directly connected.
 */
function filterSystemContext(
  allNodes: Node<C4NodeData>[],
  allEdges: Edge<C4EdgeData>[],
  systemId: string,
): FilteredGraph {
  // Exclude deployment/infra nodes first
  const { nodes: c4Nodes, edges: c4Edges } = filterC4Only(allNodes, allEdges);

  const focusSystemNode = c4Nodes.find(
    (n) => n.id === systemId && n.data.kind === 'softwareSystem',
  );
  if (!focusSystemNode) return { nodes: c4Nodes, edges: c4Edges };

  // IDs that belong to the focus system (the system + its containers/components)
  const focusFamilyIds = new Set(
    c4Nodes
      .filter((n) => n.id === systemId || n.id.startsWith(systemId + '.'))
      .map((n) => n.id),
  );

  // Find all nodes connected to any node in the focus family
  const connectedNodeIds = new Set<string>();
  for (const edge of c4Edges) {
    if (focusFamilyIds.has(edge.source)) connectedNodeIds.add(edge.target);
    if (focusFamilyIds.has(edge.target)) connectedNodeIds.add(edge.source);
  }

  // Visible nodes: the focus system + connected people and external software systems
  const visibleIds = new Set<string>([systemId]);
  for (const id of connectedNodeIds) {
    const node = c4Nodes.find((n) => n.id === id);
    if (!node) continue;
    // Include people and other top-level software systems (not containers of other systems)
    if (node.data.kind === 'person' || node.data.kind === 'softwareSystem') {
      visibleIds.add(id);
    }
    // If connected node is a container/component of another system, include its parent system instead
    if (node.data.kind === 'container' || node.data.kind === 'component') {
      const parentSystemId = id.split('.')[0];
      if (parentSystemId !== systemId) {
        visibleIds.add(parentSystemId);
      }
    }
  }

  const filteredNodes = c4Nodes.filter((n) => visibleIds.has(n.id));

  // Edges: re-map edges that go to/from containers to point at the system level
  const filteredEdges = collectEdgesBetween(c4Edges, c4Nodes, visibleIds, focusFamilyIds, systemId);

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Container View:
 *   Show the focus system's containers.
 *   Show people and external systems that connect to any container.
 *   Show the focus system node itself (as a boundary/group parent).
 */
function filterContainer(
  allNodes: Node<C4NodeData>[],
  allEdges: Edge<C4EdgeData>[],
  systemId: string,
): FilteredGraph {
  // Exclude deployment/infra nodes first
  const { nodes: c4Nodes, edges: c4Edges } = filterC4Only(allNodes, allEdges);

  // Nodes belonging to the focus system (system + containers + components)
  const focusFamilyIds = new Set(
    c4Nodes
      .filter((n) => n.id === systemId || n.id.startsWith(systemId + '.'))
      .map((n) => n.id),
  );

  if (focusFamilyIds.size === 0) return { nodes: c4Nodes, edges: c4Edges };

  // Find external nodes connected to any focus-family node
  const connectedExternalIds = new Set<string>();
  for (const edge of c4Edges) {
    if (focusFamilyIds.has(edge.source) && !focusFamilyIds.has(edge.target)) {
      connectedExternalIds.add(edge.target);
    }
    if (focusFamilyIds.has(edge.target) && !focusFamilyIds.has(edge.source)) {
      connectedExternalIds.add(edge.source);
    }
  }

  // Resolve containers/components of other systems to their parent system
  const visibleIds = new Set<string>(focusFamilyIds);
  for (const id of connectedExternalIds) {
    const node = c4Nodes.find((n) => n.id === id);
    if (!node) continue;
    if (node.data.kind === 'person' || node.data.kind === 'softwareSystem') {
      visibleIds.add(id);
    } else {
      // Container or component of another system — show the parent system instead
      const parentSystemId = id.split('.')[0];
      visibleIds.add(parentSystemId);
    }
  }

  const filteredNodes = c4Nodes.filter((n) => visibleIds.has(n.id));

  // Edges between visible nodes (collapse internal references to visible IDs)
  const filteredEdges = collectEdgesBetween(c4Edges, c4Nodes, visibleIds, focusFamilyIds, systemId);

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * Collect edges between visible nodes. For edges that reference non-visible
 * children of the focus system, re-target them to the focus system node.
 * Deduplicates re-mapped edges.
 */
function collectEdgesBetween(
  allEdges: Edge<C4EdgeData>[],
  allNodes: Node<C4NodeData>[],
  visibleIds: Set<string>,
  focusFamilyIds: Set<string>,
  focusSystemId: string,
): Edge<C4EdgeData>[] {
  const seen = new Set<string>();
  const result: Edge<C4EdgeData>[] = [];

  for (const edge of allEdges) {
    let source = edge.source;
    let target = edge.target;

    // Remap non-visible focus-family nodes to the focus system
    if (!visibleIds.has(source)) {
      if (focusFamilyIds.has(source)) source = focusSystemId;
      else {
        const parentId = source.split('.')[0];
        if (visibleIds.has(parentId)) source = parentId;
        else continue;
      }
    }
    if (!visibleIds.has(target)) {
      if (focusFamilyIds.has(target)) target = focusSystemId;
      else {
        const parentId = target.split('.')[0];
        if (visibleIds.has(parentId)) target = parentId;
        else continue;
      }
    }

    // Skip self-loops created by remapping
    if (source === target) continue;

    // Deduplicate
    const key = `${source}->${target}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (source === edge.source && target === edge.target) {
      result.push(edge);
    } else {
      result.push({
        ...edge,
        id: key,
        source,
        target,
      });
    }
  }

  return result;
}
