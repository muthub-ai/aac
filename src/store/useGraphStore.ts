import { create } from 'zustand';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { C4NodeData, C4EdgeData } from '../types/c4';
import { yamlToGraph } from '../parser/yamlToGraph';
import { graphToYaml } from '../parser/graphToYaml';
import { applyDagreLayout } from '../layout/dagreLayout';
import { SAMPLE_YAML } from '../utils/sampleYaml';

type SyncSource = 'yaml' | 'canvas' | null;

interface GraphState {
  // YAML source (left pane)
  yamlText: string;
  setYamlText: (text: string) => void;

  // Graph state (right pane)
  nodes: Node<C4NodeData>[];
  edges: Edge<C4EdgeData>[];
  setNodes: (nodes: Node<C4NodeData>[]) => void;
  setEdges: (edges: Edge<C4EdgeData>[]) => void;

  // React Flow change handlers
  onNodesChange: OnNodesChange<Node<C4NodeData>>;
  onEdgesChange: OnEdgesChange<Edge<C4EdgeData>>;
  onConnect: (connection: Connection) => void;

  // Sync control
  syncSource: SyncSource;
  setSyncSource: (source: SyncSource) => void;

  // Parse error tracking
  parseError: string | null;

  // Actions
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
    // Serialize back to YAML after adding edge
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
