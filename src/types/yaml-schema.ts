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
