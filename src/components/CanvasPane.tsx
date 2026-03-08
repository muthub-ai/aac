import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../store/useGraphStore';
import { nodeTypes } from './nodes/nodeTypes';
import { C4_COLORS } from '../constants/colors';

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
  style: { stroke: C4_COLORS.edge.stroke, strokeWidth: 1.5 },
  labelStyle: { fill: C4_COLORS.edge.label, fontSize: 11 },
  labelBgStyle: { fill: '#f8f8f8', fillOpacity: 0.9 },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 3,
};

export function CanvasPane() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const updateFromCanvas = useGraphStore((s) => s.updateFromCanvas);

  const handleNodeDragStop = () => {
    updateFromCanvas();
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
        <Controls
          style={{ background: '#2a2a2a', borderRadius: 6, border: '1px solid #444' }}
        />
        <MiniMap
          nodeColor={(n) => {
            const boundary = (n.data as Record<string, unknown>)?.boundary;
            return boundary === 'external' ? '#999' : '#1168BD';
          }}
          style={{ background: '#1a1a1a', borderRadius: 6 }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
