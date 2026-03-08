'use client';

import { create } from 'zustand';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '@/types/c4';
import { yamlToGraph } from '@/lib/parser/yaml-to-graph';
import { graphToYaml } from '@/lib/parser/graph-to-yaml';
import { applyDagreLayout } from '@/lib/layout/dagre-layout';
import { SAMPLE_YAML } from '@/lib/constants/sample-yaml';

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

  updateFromYaml: (yamlText: string) => void;
  updateFromCanvas: () => void;
  runAutoLayout: () => void;
  initialize: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  yamlText: SAMPLE_YAML,
  nodes: [],
  edges: [],
  syncSource: null,
  parseError: null,

  setYamlText: (text) => set({ yamlText: text }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSyncSource: (source) => set({ syncSource: source }),

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

    const result = yamlToGraph(text);
    if (result.nodes.length === 0 && text.trim().length > 0) {
      set({ parseError: 'Invalid YAML', syncSource: null });
      return;
    }

    const layouted = applyDagreLayout(result.nodes, result.edges);
    set({
      nodes: layouted,
      edges: result.edges,
      parseError: null,
      syncSource: null,
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

  initialize: () => {
    get().updateFromYaml(SAMPLE_YAML);
  },
}));
