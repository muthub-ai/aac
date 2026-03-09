'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { cn } from '@/lib/utils';
import { C4_COLORS } from '@/lib/constants/colors';

type DeploymentNodeType = Node<C4NodeData, 'deploymentNode'>;

/**
 * Top-level deployment node rendered as a group box (region / global).
 * When it has children it stretches via width/height; otherwise renders as a card.
 */
export function DeploymentNode({ data, width, height }: NodeProps<DeploymentNodeType>) {
  const isGroup = !!(width && height);
  const tag = data.technology ? `[${data.technology}]` : '[Deployment Node]';

  return (
    <div
      className={cn('rounded-xl font-sans shadow-md', isGroup
        ? 'box-border h-full w-full border-2 border-dashed p-2'
        : 'min-w-[220px] max-w-[300px] border-2 border-solid px-5 py-4 text-center',
      )}
      style={{
        borderColor: C4_COLORS.deploymentNode.border,
        backgroundColor: isGroup
          ? `${C4_COLORS.deploymentNode.bg}20`
          : C4_COLORS.deploymentNode.bg,
        color: isGroup ? C4_COLORS.deploymentNode.border : C4_COLORS.deploymentNode.text,
      }}
      role="group"
      aria-label={`Deployment Node: ${data.label}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: C4_COLORS.deploymentNode.border }} />
      <div className={cn('font-bold leading-tight', isGroup ? 'text-left text-[13px]' : 'mb-1 text-sm')}>
        {data.label}
      </div>
      <div className={cn('text-[10px] opacity-80', isGroup ? 'text-left' : 'mb-1')}>
        {tag}
      </div>
      {!isGroup && data.environment && (
        <div className="mt-0.5 text-[10px] opacity-70">{data.environment}</div>
      )}
      {!isGroup && data.description && (
        <p className="mt-1 text-[11px] leading-snug opacity-75">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: C4_COLORS.deploymentNode.border }} />
    </div>
  );
}

type DeploymentChildNodeType = Node<C4NodeData, 'deploymentChildNode'>;

/**
 * Nested deployment child node (cluster / service within a region).
 * Shows container instance labels inside it.
 */
export function DeploymentChildNode({ data }: NodeProps<DeploymentChildNodeType>) {
  const tag = data.technology ? `[${data.technology}]` : '[Cluster]';
  const instances = (data.containerInstances ?? []) as string[];

  return (
    <div
      className="min-w-[200px] max-w-[280px] rounded-xl border-2 px-5 py-3.5 text-center font-sans shadow-md"
      style={{
        borderColor: C4_COLORS.deploymentChild.border,
        backgroundColor: C4_COLORS.deploymentChild.bg,
        color: C4_COLORS.deploymentChild.text,
      }}
      role="group"
      aria-label={`Deployment Child: ${data.label}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: C4_COLORS.deploymentChild.border }} />
      <div className="text-xs font-bold leading-tight">{data.label}</div>
      <div className="mt-0.5 text-[10px] opacity-80">{tag}</div>
      {instances.length > 0 && (
        <div className="mt-1.5 space-y-0.5 text-left">
          {instances.map((inst) => (
            <div key={inst} className="text-[10px] leading-snug opacity-85">
              &bull; {inst}
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: C4_COLORS.deploymentChild.border }} />
    </div>
  );
}
