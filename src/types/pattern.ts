import type { LucideIcon } from 'lucide-react';

export interface GettingStartedStep {
  step: number;
  title: string;
}

export interface PatternDiagram {
  label: string;
  plantumlSource: string;
}

export interface ProductUsed {
  name: string;
  role: string;
}

export interface NFR {
  metric: string;
  target: string;
}

export interface DesignConsideration {
  title: string;
  description: string;
}

export interface PatternData {
  id: string;
  version: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  exposure: 'internal' | 'external';
  icon: string;
  color: string;
  advantages: string[];
  considerations: string[];
  gettingStarted: GettingStartedStep[];
  maturity: 'Draft' | 'Beta' | 'Production Ready' | 'Deprecated';
  maintainerTeam: string;
  docsUrl?: string;
  downloads: number;
  stars: number;
  diagrams: PatternDiagram[];
  yamlContent?: string;
  // Rich content fields
  architectureOverview: string;
  designConsiderations: DesignConsideration[];
  productsUsed: ProductUsed[];
  nonFunctionalRequirements: NFR[];
  constraints: string[];
  costProfile: string;
}

export interface PatternCategory {
  id: string;
  label: string;
  icon: LucideIcon;
}
