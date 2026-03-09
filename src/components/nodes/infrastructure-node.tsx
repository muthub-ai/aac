'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { C4_COLORS } from '@/lib/constants/colors';

type InfrastructureNodeType = Node<C4NodeData, 'infrastructureNode'>;

/**
 * Infrastructure node (load balancer, DNS, CDN, firewall, etc.)
 * Rendered as a distinctive amber/orange card within a deployment region.
 */
export function InfrastructureNode({ data }: NodeProps<InfrastructureNodeType>) {
  const tag = data.technology ? `[${data.technology}]` : '[Infrastructure]';

  return (
    <div
      className="min-w-[180px] max-w-[260px] rounded-xl border-2 px-4 py-3 text-center font-sans shadow-md"
      style={{
        borderColor: C4_COLORS.infrastructureNode.border,
        backgroundColor: C4_COLORS.infrastructureNode.bg,
        color: C4_COLORS.infrastructureNode.text,
      }}
      role="group"
      aria-label={`Infrastructure: ${data.label}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: C4_COLORS.infrastructureNode.border }} />
      <div className="text-xs font-bold leading-tight">{data.label}</div>
      <div className="mt-0.5 text-[10px] opacity-80">{tag}</div>
      {data.description && (
        <p className="mt-1 text-[10px] leading-snug opacity-75">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: C4_COLORS.infrastructureNode.border }} />
    </div>
  );
}
