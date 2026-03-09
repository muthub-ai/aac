import type { NodeTypes } from '@xyflow/react';
import { PersonNode } from './person-node';
import { SystemNode } from './system-node';
import { ContainerNode } from './container-node';
import { ComponentNode } from './component-node';
import { DeploymentNode, DeploymentChildNode } from './deployment-node';
import { InfrastructureNode } from './infrastructure-node';

export const nodeTypes: NodeTypes = {
  personNode: PersonNode,
  systemNode: SystemNode,
  containerNode: ContainerNode,
  componentNode: ComponentNode,
  deploymentNode: DeploymentNode,
  deploymentChildNode: DeploymentChildNode,
  infrastructureNode: InfrastructureNode,
};
