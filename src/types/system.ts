export interface ViewCounts {
  systemContext: number;
  container: number;
  deployment: number;
}

export interface SystemData {
  id: string;
  name: string;
  description?: string;
  group?: string;
  tags: string[];
  disposition?: string;
  dataClassification?: string;
  peopleCount: number;
  softwareSystemCount: number;
  containerCount: number;
  relationshipCount: number;
  viewCounts: ViewCounts;
  repoCount: number;
  linesOfCode: number;
  deployableUnits: number;
  domainModules: number;
  domainObjects: number;
  domainBehaviors: number;
  lastScan: string;
  branchName: string;
  yamlContent: string;
}
