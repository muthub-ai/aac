'use client';

import { create } from 'zustand';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import { yamlToGraph } from '@/lib/parser/yaml-to-graph';
import { graphToYaml } from '@/lib/parser/graph-to-yaml';
import { applyDagreLayout } from '@/lib/layout/dagre-layout';
import { validateYamlContent } from '@/lib/validation/validate-new-system';
import { isNewFormat, extractViews, type ViewInfo } from '@/lib/parser/new-to-old-transform';
import yaml from 'js-yaml';

type SyncSource = 'yaml' | 'canvas' | null;

interface GraphState {
  yamlText: string;
  setYamlText: (text: string) => void;

  nodes: Node<C4NodeData>[];
  edges: Edge<C4EdgeData>[];
  setNodes: (nodes: Node<C4NodeData>[]) => void;
  setEdges: (edges: Edge<C4EdgeData>[]) => void;

  onNodesChange: OnNodesChange<Node<C4NodeData>>;
  onEdgesChange: OnEdgesChange<Edge<C4EdgeData>>;
  onConnect: (connection: Connection) => void;

  syncSource: SyncSource;
  setSyncSource: (source: SyncSource) => void;

  parseError: string | null;
  availableViews: ViewInfo[];
  activeViewKey: string | null;
  setActiveView: (key: string | null) => void;

  updateFromYaml: (yamlText: string) => void;
  updateFromCanvas: () => void;
  runAutoLayout: () => void;
  initialize: (yaml?: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  yamlText: '',
  nodes: [],
  edges: [],
  syncSource: null,
  parseError: null,
  availableViews: [],
  activeViewKey: null,

  setYamlText: (text) => set({ yamlText: text }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSyncSource: (source) => set({ syncSource: source }),
  setActiveView: (key) => set({ activeViewKey: key }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    set((state) => {
      const newEdge: Edge<C4EdgeData> = {
        ...connection,
        id: `${connection.source}->${connection.target}`,
        data: { label: 'Uses', protocol: '' },
        label: 'Uses',
      };
      return {
        edges: addEdge(newEdge, state.edges),
        syncSource: 'canvas',
      };
    });
    setTimeout(() => get().updateFromCanvas(), 0);
  },

  updateFromYaml: (text) => {
    const state = get();
    if (state.syncSource === 'canvas') return;

    set({ syncSource: 'yaml', yamlText: text });

    // Run schema validation
    if (text.trim().length > 0) {
      const validation = validateYamlContent(text);
      if (!validation.success) {
        set({ parseError: validation.errors.join('; '), syncSource: null });
        return;
      }
    }

    const result = yamlToGraph(text);

    // Extract views from new format YAML
    let views: ViewInfo[] = [];
    try {
      const rawDoc = yaml.load(text);
      if (isNewFormat(rawDoc)) {
        views = extractViews(rawDoc);
      }
    } catch {
      // View extraction failure is non-fatal
    }

    if (result.nodes.length === 0 && text.trim().length > 0) {
      set({ parseError: 'Invalid YAML', syncSource: null, availableViews: views });
      return;
    }

    const layouted = applyDagreLayout(result.nodes, result.edges);
    set({
      nodes: layouted,
      edges: result.edges,
      parseError: null,
      syncSource: null,
      availableViews: views,
    });
  },

  updateFromCanvas: () => {
    const state = get();
    if (state.syncSource === 'yaml') return;

    set({ syncSource: 'canvas' });
    const yamlText = graphToYaml(state.nodes, state.edges);
    set({ yamlText, syncSource: null });
  },

  runAutoLayout: () => {
    const state = get();
    const layouted = applyDagreLayout(state.nodes, state.edges);
    set({ nodes: layouted });
  },

  initialize: (yaml?: string) => {
    const content = yaml ?? '';
    set({ yamlText: content });
    get().updateFromYaml(content);
  },
}));
