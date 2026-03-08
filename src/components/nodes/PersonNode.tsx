import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '../../types/c4';
import { C4_COLORS } from '../../constants/colors';

type PersonNodeType = Node<C4NodeData, 'personNode'>;

export function PersonNode({ data }: NodeProps<PersonNodeType>) {
  const colors = C4_COLORS.person;

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        color: colors.text,
        minWidth: 180,
        maxWidth: 220,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <div style={{ marginBottom: 8 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="12" r="8" fill={colors.text} opacity={0.9} />
          <path
            d="M8 36c0-8 5.5-14 12-14s12 6 12 14"
            stroke={colors.text}
            strokeWidth="2"
            fill={colors.text}
            opacity={0.7}
          />
        </svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>[Person]</div>
      {data.description && (
        <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.3 }}>{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
    </div>
  );
}
