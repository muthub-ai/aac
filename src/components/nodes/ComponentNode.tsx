import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { C4NodeData } from '../../types/c4';
import { C4_COLORS } from '../../constants/colors';

type ComponentNodeType = Node<C4NodeData, 'componentNode'>;

export function ComponentNode({ data }: NodeProps<ComponentNodeType>) {
  const colors =
    data.boundary === 'internal'
      ? C4_COLORS.componentInternal
      : C4_COLORS.componentExternal;

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '12px 16px',
        color: colors.text,
        minWidth: 180,
        maxWidth: 240,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 4 }}>
        [Component{data.technology ? `: ${data.technology}` : ''}]
      </div>
      {data.description && (
        <div style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.3 }}>{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
    </div>
  );
}
