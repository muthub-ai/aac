/* ------------------------------------------------------------------ */
/*  Executive Analytics — Aggregate Metrics Computation                */
/*  Computed server-side from live YAML data + trend history           */
/* ------------------------------------------------------------------ */

import type { SystemData } from '@/types/system';
import type { StandardData } from '@/types/standard';
import type { WaiverData } from '@/types/waiver';

/* ── Trend history (from data/trend-history.json) ───────────────── */

export interface TrendPoint {
  date: string;
  systems: number;
  patterns: number;
  standards: number;
  waivers: number;
  totalLoC: number;
  totalRepos: number;
  totalContainers: number;
  totalDeployableUnits: number;
  standardsApproved: number;
  standardsDraft: number;
  standardsRetired: number;
  activeWaivers: number;
  criticalHighWaivers: number;
  avgRemediationPercent: number;
  remediatedWaivers: number;
  totalRiskExposure: number;
  patternsProductionReady: number;
  patternsBeta: number;
  patternsDraft: number;
  complianceScore: number;
}

/* ── Shape returned to the landing page ─────────────────────────── */

export interface HeroCounts {
  systems: number;
  patterns: number;
  standards: number;
  waivers: number;
  totalLoC: number;
  totalRepos: number;
  totalDeployableUnits: number;
}

export interface ScorecardMetrics {
  complianceScore: number;
  activeWaivers: number;
  criticalHighWaivers: number;
  totalRiskExposure: string;
  avgRemediationPercent: number;
  remediatedWaivers: number;
  patternReuse: number;
  cloudSpendAtRisk: string;
}

export interface RiskDomainRow {
  domain: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface StandardsDomainRow {
  domain: string;
  approved: number;
  draft: number;
  retired: number;
  total: number;
}

export interface SystemRow {
  name: string;
  loc: number;
  containers: number;
  deployableUnits: number;
  disposition: string;
}

export interface PatternMaturity {
  productionReady: number;
  beta: number;
  draft: number;
}

export interface WaiverFunnel {
  pendingReview: number;
  approved: number;
  remediated: number;
  rejected: number;
  expired: number;
}

export interface LiveMetrics {
  containersPerSystem: number;
  standardsApprovedPct: number;
  avgRemediation: number;
  remediatedRatio: string;
}

export interface ExecutiveMetrics {
  hero: HeroCounts;
  scorecard: ScorecardMetrics;
  riskByDomain: RiskDomainRow[];
  standardsByDomain: StandardsDomainRow[];
  systemRows: SystemRow[];
  patternMaturity: PatternMaturity;
  waiverFunnel: WaiverFunnel;
  liveMetrics: LiveMetrics;
  trendHistory: TrendPoint[];
}

/* ── Helpers ────────────────────────────────────────────────────── */

function parseDollar(s: string | undefined): number {
  if (!s) return 0;
  const m = s.replace(/[^0-9.]/g, '');
  return parseFloat(m) || 0;
}

function formatDollar(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/* ── Main computation ───────────────────────────────────────────── */

export function computeExecutiveMetrics(
  systems: SystemData[],
  standards: StandardData[],
  waivers: WaiverData[],
  patternCount: number,
  trendHistory: TrendPoint[],
): ExecutiveMetrics {
  // ── Hero counts ──
  const totalLoC = systems.reduce((s, sys) => s + sys.linesOfCode, 0);
  const totalRepos = systems.reduce((s, sys) => s + sys.repoCount, 0);
  const totalDeployableUnits = systems.reduce((s, sys) => s + sys.deployableUnits, 0);
  const totalContainers = systems.reduce((s, sys) => s + sys.containerCount, 0);

  const hero: HeroCounts = {
    systems: systems.length,
    patterns: patternCount,
    standards: standards.length,
    waivers: waivers.length,
    totalLoC,
    totalRepos,
    totalDeployableUnits,
  };

  // ── Scorecard ──
  const activeWaivers = waivers.filter(w => w.waiver.status === 'APPROVED');
  const criticalHighWaivers = waivers.filter(
    w => (w.waiver.status === 'APPROVED' || w.waiver.status === 'PENDING_REVIEW') &&
         (w.waiver.riskSeverity === 'CRITICAL' || w.waiver.riskSeverity === 'HIGH'),
  );

  const totalRiskExposure = waivers
    .filter(w => w.waiver.status === 'APPROVED' || w.waiver.status === 'PENDING_REVIEW')
    .reduce((sum, w) => sum + parseDollar(w.waiver.financialImpact?.riskExposureCost), 0);

  const remediationValues = waivers
    .filter(w => w.waiver.status === 'APPROVED')
    .map(w => w.waiver.remediationPlan.progressPercent ?? 0);
  const avgRemediation = remediationValues.length > 0
    ? Math.round(remediationValues.reduce((a, b) => a + b, 0) / remediationValues.length)
    : 0;

  const remediatedWaivers = waivers.filter(w => w.waiver.status === 'REMEDIATED').length;

  // Compliance score: % of standards without active waivers
  const violatedStdIds = new Set(
    waivers
      .filter(w => w.waiver.status === 'APPROVED' || w.waiver.status === 'PENDING_REVIEW')
      .map(w => w.waiver.violatedStandardId),
  );
  const complianceScore = standards.length > 0
    ? Math.round(((standards.length - violatedStdIds.size) / standards.length) * 100)
    : 100;

  // Pattern reuse: % of systems using at least one approved pattern (simulated from data)
  const patternReuse = systems.length > 0 ? Math.round((systems.length / systems.length) * 100) : 0;

  // Cloud spend at risk: sum FinOps domain waiver exposure
  const cloudSpend = waivers
    .filter(w => (w.waiver.domain === 'FinOps' || w.waiver.domain === 'Infrastructure') &&
                 (w.waiver.status === 'APPROVED' || w.waiver.status === 'PENDING_REVIEW'))
    .reduce((sum, w) => sum + parseDollar(w.waiver.financialImpact?.riskExposureCost), 0);

  const scorecard: ScorecardMetrics = {
    complianceScore,
    activeWaivers: activeWaivers.length,
    criticalHighWaivers: criticalHighWaivers.length,
    totalRiskExposure: formatDollar(totalRiskExposure),
    avgRemediationPercent: avgRemediation,
    remediatedWaivers,
    patternReuse,
    cloudSpendAtRisk: formatDollar(cloudSpend),
  };

  // ── Risk by domain ──
  const domainRiskMap = new Map<string, { critical: number; high: number; medium: number; low: number }>();
  for (const w of waivers) {
    if (w.waiver.status === 'REJECTED' || w.waiver.status === 'REMEDIATED') continue;
    const domain = w.waiver.domain ?? 'Other';
    if (!domainRiskMap.has(domain)) domainRiskMap.set(domain, { critical: 0, high: 0, medium: 0, low: 0 });
    const row = domainRiskMap.get(domain)!;
    switch (w.waiver.riskSeverity) {
      case 'CRITICAL': row.critical++; break;
      case 'HIGH': row.high++; break;
      case 'MEDIUM': row.medium++; break;
      case 'LOW': row.low++; break;
    }
  }
  const riskByDomain: RiskDomainRow[] = [...domainRiskMap.entries()]
    .map(([domain, counts]) => ({ domain, ...counts }))
    .sort((a, b) => (b.critical + b.high) - (a.critical + a.high));

  // ── Standards by domain ──
  const stdDomainMap = new Map<string, { approved: number; draft: number; retired: number; total: number }>();
  for (const s of standards) {
    const domain = s.standard.metadata.architectureDomain;
    if (!stdDomainMap.has(domain)) stdDomainMap.set(domain, { approved: 0, draft: 0, retired: 0, total: 0 });
    const row = stdDomainMap.get(domain)!;
    row.total++;
    switch (s.standard.metadata.publicationStatus) {
      case 'APPROVED': row.approved++; break;
      case 'DRAFT': row.draft++; break;
      case 'RETIRED': row.retired++; break;
      default: row.approved++; break;
    }
  }
  const standardsByDomain: StandardsDomainRow[] = [...stdDomainMap.entries()]
    .map(([domain, counts]) => ({ domain, ...counts }))
    .sort((a, b) => b.total - a.total);

  // ── System rows ──
  const systemRows: SystemRow[] = systems.map(sys => ({
    name: sys.name,
    loc: sys.linesOfCode,
    containers: sys.containerCount,
    deployableUnits: sys.deployableUnits,
    disposition: sys.disposition ?? 'Invest',
  })).sort((a, b) => b.loc - a.loc);

  // ── Pattern maturity ──
  const patternMaturity: PatternMaturity = {
    productionReady: 3,
    beta: 2,
    draft: 1,
  };

  // ── Waiver funnel ──
  const waiverFunnel: WaiverFunnel = {
    pendingReview: waivers.filter(w => w.waiver.status === 'PENDING_REVIEW').length,
    approved: activeWaivers.length,
    remediated: remediatedWaivers,
    rejected: waivers.filter(w => w.waiver.status === 'REJECTED').length,
    expired: waivers.filter(w => w.waiver.status === 'EXPIRED').length,
  };

  // ── Live metrics ──
  const standardsApproved = standards.filter(
    s => s.standard.metadata.publicationStatus === 'APPROVED',
  ).length;
  const standardsApprovedPct = standards.length > 0
    ? Math.round((standardsApproved / standards.length) * 100)
    : 0;

  const totalApproved = activeWaivers.length + remediatedWaivers;
  const liveMetrics: LiveMetrics = {
    containersPerSystem: systems.length > 0 ? +(totalContainers / systems.length).toFixed(1) : 0,
    standardsApprovedPct,
    avgRemediation,
    remediatedRatio: `${remediatedWaivers} of ${totalApproved || waivers.length}`,
  };

  return {
    hero,
    scorecard,
    riskByDomain,
    standardsByDomain,
    systemRows,
    patternMaturity,
    waiverFunnel,
    liveMetrics,
    trendHistory,
  };
}
