export interface SystemData {
  id: string;
  name: string;
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
