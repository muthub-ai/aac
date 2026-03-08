import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '../../types/c4';
import { C4_COLORS } from '../../constants/colors';

type SystemNodeType = Node<C4NodeData, 'systemNode'>;

export function SystemNode({ data }: NodeProps<SystemNodeType>) {
  const colors =
    data.boundary === 'internal' ? C4_COLORS.systemInternal : C4_COLORS.systemExternal;

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        color: colors.text,
        minWidth: 220,
        maxWidth: 300,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 6 }}>[Software System]</div>
      {data.description && (
        <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.3 }}>{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
    </div>
  );
}
