/* ------------------------------------------------------------------ */
/*  Architecture Waiver / Exception Registry — TypeScript types        */
/*  Mirrors schema/waivers.json (JSON Schema draft 2020-12)           */
/* ------------------------------------------------------------------ */

export type WaiverStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REMEDIATED';

export type RiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ControlEffectiveness = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FinancialImpact {
  complianceCost: string;
  delayCost: string;
  riskExposureCost?: string;
  summary: string;
}

export interface CompensatingControl {
  control: string;
  effectiveness: ControlEffectiveness;
  verificationMethod?: string;
}

export interface RemediationPlan {
  description: string;
  targetDate: string;
  backlogItemUrl?: string;
  assignedTeam?: string;
  progressPercent?: number;
}

export interface RevisionEntry {
  date: string;
  author: string;
  change: string;
}

export interface ArchitectureWaiver {
  exceptionId: string;
  title: string;
  targetAppId: string;
  targetAppName: string;
  violatedStandardId: string;
  violatedStandardName: string;
  violatedRequirementIds?: string[];
  status: WaiverStatus;
  rationale: string;
  financialImpact?: FinancialImpact;
  riskSeverity: RiskSeverity;
  riskDescription?: string;
  compensatingControls: CompensatingControl[];
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvalDate?: string;
  expirationDate?: string;
  remediationPlan: RemediationPlan;
  domain?: string;
  tags?: string[];
  reviewNotes?: string;
  revisionHistory?: RevisionEntry[];
}

/** Shape returned by the data loader for use in catalog components */
export interface WaiverData {
  fileName: string;
  waiver: ArchitectureWaiver;
  yamlContent: string;
}
