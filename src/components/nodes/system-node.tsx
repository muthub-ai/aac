'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { cn } from '@/lib/utils';

type SystemNodeType = Node<C4NodeData, 'systemNode'>;

export function SystemNode({ data, width, height }: NodeProps<SystemNodeType>) {
  const isInternal = data.boundary === 'internal';
  const isGroup = !!(width && height);

  return (
    <div
      className={cn(
        'rounded-xl font-sans shadow-md',
        isGroup
          ? 'box-border h-full w-full border-2 border-dashed p-2'
          : 'min-w-[220px] max-w-[300px] border-2 border-solid px-5 py-4 text-center',
        isInternal
          ? isGroup
            ? 'border-[#0E5AA7] bg-[#1168BD]/15 text-[#0E5AA7] dark:text-white'
            : 'border-[#0E5AA7] bg-[#1168BD] text-white'
          : isGroup
            ? 'border-[#8A8A8A] bg-[#999999]/15 text-[#656d76] dark:text-white'
            : 'border-[#8A8A8A] bg-[#999999] text-white',
      )}
      role="group"
      aria-label={`Software System: ${data.label}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn('!bg-current', isInternal ? '!bg-[#0E5AA7]' : '!bg-[#8A8A8A]')}
      />
      <div
        className={cn(
          'font-bold leading-tight',
          isGroup ? 'text-left text-[13px]' : 'mb-1 text-sm',
        )}
      >
        {data.label}
      </div>
      <div
        className={cn(
          'text-[10px] opacity-80',
          isGroup ? 'text-left' : 'mb-1.5',
        )}
      >
        [Software System]
      </div>
      {!isGroup && data.description && (
        <p className="text-[11px] leading-snug opacity-75">
          {data.description}
        </p>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(isInternal ? '!bg-[#0E5AA7]' : '!bg-[#8A8A8A]')}
      />
    </div>
  );
}
