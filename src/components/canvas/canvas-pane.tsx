'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { useGraphStore } from '@/store/use-graph-store';
import { nodeTypes } from '@/components/nodes/node-types';
import { C4_COLORS } from '@/lib/constants/colors';
import { useMounted } from '@/hooks/use-mounted';
import { filterGraphByView } from '@/lib/graph/filter-by-view';

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: false,
  style: { stroke: C4_COLORS.edge.stroke, strokeWidth: 1.5 },
  labelStyle: { fill: 'var(--muted-foreground)', fontSize: 11 },
  labelBgStyle: { fill: 'var(--card)', fillOpacity: 0.9 },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 3,
};

export function CanvasPane() {
  const allNodes = useGraphStore((s) => s.nodes);
  const allEdges = useGraphStore((s) => s.edges);
  const activeViewKey = useGraphStore((s) => s.activeViewKey);
  const availableViews = useGraphStore((s) => s.availableViews);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const updateFromCanvas = useGraphStore((s) => s.updateFromCanvas);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const activeView = availableViews.find((v) => v.key === activeViewKey);
  const { nodes, edges } = useMemo(
    () => filterGraphByView(allNodes, allEdges, activeView),
    [allNodes, allEdges, activeView],
  );

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div
      className="h-full w-full"
      role="region"
      aria-label="Architecture Diagram Canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={() => updateFromCanvas()}
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDark ? '#30363d' : 'hsl(0 0% 80%)'}
        />
        <Controls
          className="!rounded-xl !border !border-border !bg-card !shadow-md"
          aria-label="Zoom controls"
        />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as Record<string, unknown>;
            const kind = data?.kind as string;
            if (kind === 'deploymentNode') return '#2EA043';
            if (kind === 'infrastructureNode') return '#D29922';
            return data?.boundary === 'external' ? '#999' : '#1168BD';
          }}
          className="!rounded-xl !border !border-border !bg-card !shadow-md"
          maskColor={isDark ? 'rgba(13,17,23,0.6)' : 'rgba(200,200,200,0.6)'}
          aria-label="Diagram minimap"
        />
      </ReactFlow>
    </div>
  );
}
