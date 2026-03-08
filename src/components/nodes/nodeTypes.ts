import type { NodeTypes } from '@xyflow/react';
import { PersonNode } from './PersonNode';
import { SystemNode } from './SystemNode';
import { ContainerNode } from './ContainerNode';
import { ComponentNode } from './ComponentNode';

export const nodeTypes: NodeTypes = {
  personNode: PersonNode,
  systemNode: SystemNode,
  containerNode: ContainerNode,
  componentNode: ComponentNode,
};
