import type { LucideIcon } from 'lucide-react';

export interface GettingStartedStep {
  step: number;
  title: string;
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
}

export interface PatternCategory {
  id: string;
  label: string;
  icon: LucideIcon;
}
