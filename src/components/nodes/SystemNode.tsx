import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '../../types/c4';
import { C4_COLORS } from '../../constants/colors';

type SystemNodeType = Node<C4NodeData, 'systemNode'>;

export function SystemNode({ data, width, height }: NodeProps<SystemNodeType>) {
  const colors =
    data.boundary === 'internal' ? C4_COLORS.systemInternal : C4_COLORS.systemExternal;

  // When width/height are set, this node is a group (parent with children)
  const isGroup = !!(width && height);

  return (
    <div
      style={{
        background: isGroup ? `${colors.bg}22` : colors.bg,
        border: `2px ${isGroup ? 'dashed' : 'solid'} ${colors.border}`,
        borderRadius: '8px',
        padding: isGroup ? '8px 12px' : '16px 20px',
        color: colors.text,
        width: isGroup ? '100%' : undefined,
        height: isGroup ? '100%' : undefined,
        minWidth: isGroup ? undefined : 220,
        maxWidth: isGroup ? undefined : 300,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <div style={{
        fontWeight: 700,
        fontSize: isGroup ? 13 : 14,
        marginBottom: isGroup ? 2 : 4,
        textAlign: isGroup ? 'left' : 'center',
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: 10,
        opacity: 0.85,
        marginBottom: isGroup ? 0 : 6,
        textAlign: isGroup ? 'left' : 'center',
      }}>
        [Software System]
      </div>
      {!isGroup && data.description && (
        <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.3 }}>{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
    </div>
  );
}
