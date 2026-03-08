export interface YamlArchitecture {
  actors?: Record<string, YamlActor>;
  softwareSystems?: Record<string, YamlSoftwareSystem>;
  relationships?: YamlRelationship[];
}

export interface YamlActor {
  type: 'Person' | 'SoftwareSystem';
  label: string;
  description?: string;
  boundary?: 'Internal' | 'External';
}

export interface YamlSoftwareSystem {
  label: string;
  description?: string;
  boundary?: 'Internal' | 'External';
  containers?: Record<string, YamlContainer>;
}

export interface YamlContainer {
  label: string;
  description?: string;
  technology?: string;
  containerType?: string;
  components?: Record<string, YamlComponent>;
}

export interface YamlComponent {
  label: string;
  description?: string;
  technology?: string;
}

export interface YamlRelationship {
  from: string;
  to: string;
  label?: string;
  protocol?: string;
}

// ── New Schema Format Types ─────────────────────────────────────────
export interface NewYamlRelationship {
  destinationId: string;
  description?: string;
  technology?: string;
}

export interface NewYamlPerson {
  id: string;
  name: string;
  description?: string;
  relationships?: NewYamlRelationship[];
}

export interface NewYamlContainer {
  id: string;
  name: string;
  description?: string;
  technology?: string;
  tags?: string;
  properties?: Record<string, string>;
  relationships?: NewYamlRelationship[];
}

export interface NewYamlSoftwareSystem {
  id: string;
  name: string;
  description?: string;
  group?: string;
  tags?: string;
  disposition?: string;
  dataClassification?: string;
  properties?: Record<string, string>;
  containers?: NewYamlContainer[];
  relationships?: NewYamlRelationship[];
}

export interface NewYamlContainerInstance {
  containerId: string;
  instanceId: number;
}

export interface NewYamlInfrastructureNode {
  id: string;
  name: string;
  technology?: string;
  tags?: string;
  properties?: Record<string, string>;
  relationships?: NewYamlRelationship[];
}

export interface NewYamlDeploymentNode {
  id: string;
  name: string;
  environment?: string;
  technology?: string;
  tags?: string;
  infrastructureNodes?: NewYamlInfrastructureNode[];
  children?: NewYamlDeploymentChild[];
  containerInstances?: NewYamlContainerInstance[];
}

export interface NewYamlDeploymentChild {
  id: string;
  name: string;
  technology?: string;
  tags?: string;
  containerInstances?: NewYamlContainerInstance[];
}

export interface NewYamlViewDefinition {
  key: string;
  softwareSystemId: string;
  title?: string;
  description?: string;
  environment?: string;
}

export interface NewYamlViews {
  systemContextViews?: NewYamlViewDefinition[];
  containerViews?: NewYamlViewDefinition[];
  deploymentViews?: NewYamlViewDefinition[];
}

export interface NewYamlModel {
  people?: NewYamlPerson[];
  softwareSystems?: NewYamlSoftwareSystem[];
  deploymentNodes?: NewYamlDeploymentNode[];
}

export interface NewYamlArchitecture {
  name: string;
  description?: string;
  model: NewYamlModel;
  views?: NewYamlViews;
}
