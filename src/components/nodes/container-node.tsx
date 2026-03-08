'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { cn } from '@/lib/utils';

type ContainerNodeType = Node<C4NodeData, 'containerNode'>;

export function ContainerNode({ data }: NodeProps<ContainerNodeType>) {
  const isInternal = data.boundary === 'internal';
  const tag = data.technology ? `[Container: ${data.technology}]` : '[Container]';

  return (
    <div
      className={cn(
        'min-w-[200px] max-w-[260px] rounded-xl border-2 px-5 py-3.5',
        'text-center font-sans shadow-md',
        isInternal
          ? 'border-[#3C7FC0] bg-[#438DD5] text-white'
          : 'border-[#A0A0A0] bg-[#B3B3B3] text-white',
      )}
      role="group"
      aria-label={`Container: ${data.label}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(isInternal ? '!bg-[#3C7FC0]' : '!bg-[#A0A0A0]')}
      />
      <div className="text-xs font-bold leading-tight">{data.label}</div>
      <div className="mt-0.5 text-[10px] opacity-80">{tag}</div>
      {data.description && (
        <p className="mt-1 text-[10px] leading-snug opacity-75">
          {data.description}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(isInternal ? '!bg-[#3C7FC0]' : '!bg-[#A0A0A0]')}
      />
    </div>
  );
}
