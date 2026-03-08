'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { cn } from '@/lib/utils';

type ComponentNodeType = Node<C4NodeData, 'componentNode'>;

export function ComponentNode({ data }: NodeProps<ComponentNodeType>) {
  const isInternal = data.boundary === 'internal';
  const tag = data.technology ? `[Component: ${data.technology}]` : '[Component]';

  return (
    <div
      className={cn(
        'min-w-[180px] max-w-[240px] rounded-lg border-2 px-4 py-3',
        'text-center font-sans shadow-sm',
        isInternal
          ? 'border-[#78ACE0] bg-[#85BBF0] text-black'
          : 'border-[#BABABA] bg-[#CCCCCC] text-black',
      )}
      role="group"
      aria-label={`Component: ${data.label}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(isInternal ? '!bg-[#78ACE0]' : '!bg-[#BABABA]')}
      />
      <div className="text-xs font-bold leading-tight">{data.label}</div>
      <div className="mt-0.5 text-[10px] opacity-80">{tag}</div>
      {data.description && (
        <p className="mt-1 text-[10px] leading-snug opacity-70">
          {data.description}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(isInternal ? '!bg-[#78ACE0]' : '!bg-[#BABABA]')}
      />
    </div>
  );
}
