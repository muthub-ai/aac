export type C4Boundary = 'internal' | 'external';
export type C4NodeKind =
  | 'person'
  | 'softwareSystem'
  | 'container'
  | 'component'
  | 'deploymentNode'
  | 'infrastructureNode';

export interface C4NodeData extends Record<string, unknown> {
  kind: C4NodeKind;
  label: string;
  description?: string;
  technology?: string;
  boundary: C4Boundary;
  /** Deployment environment (e.g. "Production") — deployment nodes only */
  environment?: string;
  /** Container instance labels rendered inside a deployment child node */
  containerInstances?: string[];
  /** Infrastructure type (e.g. "load-balancer", "dns") — infra nodes only */
  infraType?: string;
}

export interface C4EdgeData extends Record<string, unknown> {
  label?: string;
  protocol?: string;
}
