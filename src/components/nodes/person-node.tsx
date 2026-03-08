'use client';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '@/types/c4';
import { cn } from '@/lib/utils';

type PersonNodeType = Node<C4NodeData, 'personNode'>;

export function PersonNode({ data }: NodeProps<PersonNodeType>) {
  return (
    <div
      className={cn(
        'flex min-w-[180px] max-w-[220px] flex-col items-center rounded-xl',
        'border-2 border-[#073B6F] bg-[#08427B] px-5 py-4',
        'font-sans text-white shadow-md',
      )}
      role="group"
      aria-label={`Person: ${data.label}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#073B6F]"
      />
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="mb-2"
        aria-hidden="true"
      >
        <circle cx="18" cy="10" r="7" fill="white" opacity="0.9" />
        <path
          d="M4 32c0-7.732 6.268-14 14-14s14 6.268 14 14"
          stroke="white"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
      </svg>
      <span className="text-sm font-bold leading-tight">{data.label}</span>
      <span className="mt-0.5 text-[10px] opacity-80">[Person]</span>
      {data.description && (
        <span className="mt-1.5 text-center text-[10px] leading-snug opacity-75">
          {data.description}
        </span>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#073B6F]"
      />
    </div>
  );
}
