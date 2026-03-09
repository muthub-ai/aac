/** Architecture Standard types — mirrors schema/standards.json */

export type PublicationStatus = 'APPROVED' | 'DRAFT' | 'RETIRED';

export type LifecycleCategory =
  | 'DRAFT'
  | 'PROVISIONAL'
  | 'STANDARD'
  | 'PROVISIONAL STANDARD'
  | 'RETIRED';

export type Severity = 'MUST' | 'MUST NOT' | 'SHOULD' | 'SHOULD NOT';

export type ArchitecturePrinciple =
  | 'AI-First Mindset'
  | 'Responsible AI by Design'
  | 'Governance with Minimized Friction'
  | 'Human-AI Collaboration'
  | 'Adaptive Customer-Centric Design'
  | 'Security by Design'
  | 'Data-Centric Architecture'
  | 'Modular and Composable Architecture'
  | 'Resilient and Scalable infrastructure'
  | 'Optimize Technology Spend';

export interface RevisionHistoryEntry {
  date?: string;
  version?: string;
  changeType?: string;
  summary?: string;
  changedBy?: string;
  approvedBy?: string;
}

export interface VersionControl {
  repository?: string;
  path?: string;
  semver?: string;
}

export interface StandardMetadata {
  schemaVersion?: 1 | 2;
  standardId: string;
  name: string;
  architectureDomain: string;
  architecturePrinciple?: ArchitecturePrinciple[];
  l4Domain?: string;
  l3Domain?: string;
  l2Domain?: string;
  standardOwner?: string;
  assignedArchitect?: string;
  lifecycleCategory?: LifecycleCategory;
  publicationStatus: PublicationStatus;
  version: string;
  approvalDate: string;
  communicationDate?: string;
  plannedActiveDate?: string | null;
  conformanceMetric?: string;
  relatedChildStandards?: string[];
  tags?: string[];
  versionControl?: VersionControl;
  revisionHistory?: RevisionHistoryEntry[];
}

export interface RequirementAppliesTo {
  platforms?: string[];
  tiers?: string[];
  exceptionsProcess?: string;
}

export interface Requirement {
  id: string;
  statement: string;
  severity?: Severity;
  reportedMetric?: string;
  verification?: string;
  rationale?: string;
  appliesTo?: RequirementAppliesTo;
}

export interface Guideline {
  id: string;
  text: string;
}

export interface Solution {
  id: string;
  name: string;
  link?: string;
  description?: string;
}

export interface AuthoritativeSource {
  id: string;
  source: string;
  issuingAgency: string;
  controlName?: string;
  link?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface Definition {
  id: string;
  term: string;
  definition: string;
}

export interface Reference {
  id: string;
  link?: string;
  description?: string;
}

export interface Scope {
  inScope: string[];
  outOfScope: string[];
}

export interface ArchitectureStandard {
  metadata: StandardMetadata;
  scope: Scope;
  requirements: Requirement[];
  guidelines?: Guideline[];
  solutions?: Solution[];
  authoritativeSources?: AuthoritativeSource[];
  faq?: FaqEntry[];
  definitions?: Definition[];
  references?: Reference[];
}

/** Flattened data shape passed to the catalog UI */
export interface StandardData {
  fileName: string;
  standard: ArchitectureStandard;
  yamlContent: string;
}
