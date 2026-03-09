'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Code2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import type {
  WaiverData,
  WaiverStatus,
  RiskSeverity,
  ArchitectureWaiver,
} from '@/types/waiver';
import { cn } from '@/lib/utils';
import { YamlViewerModal } from '@/components/ui/yaml-viewer-modal';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface WaiverRegistryProps {
  waivers: WaiverData[];
}

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                      */
/* ------------------------------------------------------------------ */

function statusConfig(status: WaiverStatus) {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 };
    case 'PENDING_REVIEW':
      return { label: 'Pending', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10', icon: Clock };
    case 'REJECTED':
      return { label: 'Rejected', dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle };
    case 'EXPIRED':
      return { label: 'Expired', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', icon: AlertTriangle };
    case 'REMEDIATED':
      return { label: 'Remediated', dot: 'bg-ring', text: 'text-ring', bg: 'bg-ring/10', icon: CheckCircle2 };
  }
}

function riskConfig(severity: RiskSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return { label: 'Critical', cls: 'bg-destructive/10 text-destructive border-destructive/20' };
    case 'HIGH':
      return { label: 'High', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'MEDIUM':
      return { label: 'Medium', cls: 'bg-warning/10 text-warning border-warning/20' };
    case 'LOW':
      return { label: 'Low', cls: 'bg-success/10 text-success border-success/20' };
  }
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const now = new Date();
  const target = new Date(iso);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Facet collectors                                                   */
/* ------------------------------------------------------------------ */

function collectDomains(waivers: WaiverData[]): string[] {
  const set = new Set<string>();
  for (const w of waivers) if (w.waiver.domain) set.add(w.waiver.domain);
  return [...set].sort();
}

function collectStatuses(waivers: WaiverData[]): WaiverStatus[] {
  const set = new Set<WaiverStatus>();
  for (const w of waivers) set.add(w.waiver.status);
  return [...set].sort();
}

function collectRisks(waivers: WaiverData[]): RiskSeverity[] {
  const set = new Set<RiskSeverity>();
  for (const w of waivers) set.add(w.waiver.riskSeverity);
  return [...set].sort();
}

/* ------------------------------------------------------------------ */
/*  Dashboard metric card                                              */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, subtitle, trend, trendLabel, accent, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={cn('mt-1 text-2xl font-bold', accent)}>{value}</p>
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accent.replace('text-', 'bg-') + '/10')}>
          <Icon className={cn('h-5 w-5', accent)} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && trendLabel && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-[10px] font-semibold',
            trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground',
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const color = percent >= 75 ? 'bg-success' : percent >= 40 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function WaiverRegistry({ waivers }: WaiverRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [yamlModal, setYamlModal] = useState<{ open: boolean; content: string; fileName: string; title: string }>({
    open: false, content: '', fileName: '', title: '',
  });

  const allDomains = useMemo(() => collectDomains(waivers), [waivers]);
  const allStatuses = useMemo(() => collectStatuses(waivers), [waivers]);
  const allRisks = useMemo(() => collectRisks(waivers), [waivers]);

  const filtered = useMemo(() => {
    let result = waivers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.waiver.title.toLowerCase().includes(q) ||
          w.waiver.exceptionId.toLowerCase().includes(q) ||
          w.waiver.targetAppName.toLowerCase().includes(q) ||
          w.waiver.violatedStandardName.toLowerCase().includes(q) ||
          (w.waiver.domain ?? '').toLowerCase().includes(q) ||
          (w.waiver.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (selectedDomain) result = result.filter((w) => w.waiver.domain === selectedDomain);
    if (selectedStatus) result = result.filter((w) => w.waiver.status === selectedStatus);
    if (selectedRisk) result = result.filter((w) => w.waiver.riskSeverity === selectedRisk);
    return result;
  }, [waivers, searchQuery, selectedDomain, selectedStatus, selectedRisk]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDomain(null);
    setSelectedStatus(null);
    setSelectedRisk(null);
  }, []);

  const hasActiveFilters = searchQuery.trim() || selectedDomain || selectedStatus || selectedRisk;

  const openYaml = (w: WaiverData) => {
    setYamlModal({ open: true, content: w.yamlContent, fileName: w.fileName, title: w.waiver.title });
  };

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const closeDropdowns = () => {
    setShowDomainDropdown(false);
    setShowStatusDropdown(false);
    setShowRiskDropdown(false);
  };

  /* ── Dashboard metrics ──────────────────────────────────────────── */

  const metrics = useMemo(() => {
    const activeWaivers = waivers.filter((w) => w.waiver.status === 'APPROVED');
    const pendingWaivers = waivers.filter((w) => w.waiver.status === 'PENDING_REVIEW');
    const expiredWaivers = waivers.filter((w) => w.waiver.status === 'EXPIRED');
    const criticalActive = activeWaivers.filter((w) => w.waiver.riskSeverity === 'CRITICAL' || w.waiver.riskSeverity === 'HIGH');
    const remediatedWaivers = waivers.filter((w) => w.waiver.status === 'REMEDIATED');
    const expiringCount = activeWaivers.filter((w) => {
      const d = daysUntil(w.waiver.expirationDate);
      return d !== null && d <= 90 && d > 0;
    }).length;
    const avgRemediation = activeWaivers.reduce((sum, w) => sum + (w.waiver.remediationPlan.progressPercent ?? 0), 0) / (activeWaivers.length || 1);

    return {
      total: waivers.length,
      active: activeWaivers.length,
      pending: pendingWaivers.length,
      expired: expiredWaivers.length,
      remediated: remediatedWaivers.length,
      criticalHigh: criticalActive.length,
      expiringSoon: expiringCount,
      avgRemediation: Math.round(avgRemediation),
    };
  }, [waivers]);

  return (
    <div onClick={closeDropdowns}>
      {/* ── Executive Dashboard Cards ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="Active Waivers"
          value={metrics.active}
          subtitle={`${metrics.total} total in registry`}
          trend={metrics.active > 3 ? 'up' : 'down'}
          trendLabel={metrics.active > 3 ? '+2 this quarter' : 'Stable'}
          accent="text-warning"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Critical / High Risk"
          value={metrics.criticalHigh}
          subtitle={`${metrics.expiringSoon} expiring within 90 days`}
          trend={metrics.criticalHigh > 2 ? 'up' : 'down'}
          trendLabel={metrics.criticalHigh > 2 ? 'Needs attention' : 'Under control'}
          accent="text-destructive"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Pending Review"
          value={metrics.pending}
          subtitle={`${metrics.expired} expired awaiting action`}
          trend={metrics.pending > 0 ? 'up' : 'neutral'}
          trendLabel={metrics.pending > 0 ? 'Action required' : 'All clear'}
          accent="text-ring"
          icon={Clock}
        />
        <MetricCard
          title="Avg. Remediation"
          value={`${metrics.avgRemediation}%`}
          subtitle={`${metrics.remediated} fully remediated`}
          trend={metrics.avgRemediation >= 40 ? 'down' : 'up'}
          trendLabel={metrics.avgRemediation >= 40 ? 'On track' : 'Behind schedule'}
          accent="text-success"
          icon={CheckCircle2}
        />
      </div>

      {/* ── Risk Heatmap Strip ────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Risk Distribution
        </h3>
        <div className="flex gap-2">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskSeverity[]).map((level) => {
            const count = waivers.filter((w) => w.waiver.riskSeverity === level && (w.waiver.status === 'APPROVED' || w.waiver.status === 'PENDING_REVIEW')).length;
            const rc = riskConfig(level);
            return (
              <div key={level} className="flex-1 text-center">
                <div className={cn('rounded-lg border py-3', rc.cls)}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] font-semibold uppercase">{rc.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Search + Filters ──────────────────────────────────────── */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, ID, app, standard, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/60',
                'focus:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring/20',
                'transition-colors',
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Domain dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowDomainDropdown((o) => !o); setShowStatusDropdown(false); setShowRiskDropdown(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                'hover:bg-muted',
                selectedDomain ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
              )}
            >
              {selectedDomain ?? 'Domain'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDomainDropdown && 'rotate-180')} />
            </button>
            {showDomainDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => { setSelectedDomain(null); setShowDomainDropdown(false); }}
                  className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', !selectedDomain ? 'font-medium text-foreground' : 'text-muted-foreground')}
                >
                  All
                </button>
                {allDomains.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDomain(d); setShowDomainDropdown(false); }}
                    className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', selectedDomain === d ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowStatusDropdown((o) => !o); setShowDomainDropdown(false); setShowRiskDropdown(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                'hover:bg-muted',
                selectedStatus ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
              )}
            >
              {selectedStatus ? statusConfig(selectedStatus as WaiverStatus).label : 'Status'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showStatusDropdown && 'rotate-180')} />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => { setSelectedStatus(null); setShowStatusDropdown(false); }}
                  className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', !selectedStatus ? 'font-medium text-foreground' : 'text-muted-foreground')}
                >
                  All
                </button>
                {allStatuses.map((s) => {
                  const sc = statusConfig(s);
                  return (
                    <button
                      key={s}
                      onClick={() => { setSelectedStatus(s); setShowStatusDropdown(false); }}
                      className={cn('flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-muted', selectedStatus === s ? 'font-medium text-foreground' : 'text-muted-foreground')}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Risk dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowRiskDropdown((o) => !o); setShowDomainDropdown(false); setShowStatusDropdown(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                'hover:bg-muted',
                selectedRisk ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
              )}
            >
              {selectedRisk ?? 'Risk'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showRiskDropdown && 'rotate-180')} />
            </button>
            {showRiskDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => { setSelectedRisk(null); setShowRiskDropdown(false); }}
                  className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', !selectedRisk ? 'font-medium text-foreground' : 'text-muted-foreground')}
                >
                  All
                </button>
                {allRisks.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setSelectedRisk(r); setShowRiskDropdown(false); }}
                    className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', selectedRisk === r ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {waivers.length} {waivers.length === 1 ? 'waiver' : 'waivers'}
            </p>
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-ring hover:text-ring/80">
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {waivers.length} {waivers.length === 1 ? 'waiver' : 'waivers'} across {allDomains.length} {allDomains.length === 1 ? 'domain' : 'domains'}
          </p>
        )}
      </div>

      {/* ── Waivers Table ─────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-12 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Exception</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Risk</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expiration</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remediation</th>
                  <th className="w-20 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">YAML</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, idx) => {
                  const sc = statusConfig(w.waiver.status);
                  const rc = riskConfig(w.waiver.riskSeverity);
                  const isExpanded = expandedRow === w.waiver.exceptionId;

                  return (
                    <WaiverTableRow
                      key={w.waiver.exceptionId}
                      w={w}
                      idx={idx}
                      sc={sc}
                      rc={rc}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRow(w.waiver.exceptionId)}
                      onViewYaml={() => openYaml(w)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
          <Search className="mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No waivers match your filters</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-ring hover:text-ring/80">
            Clear all filters
          </button>
        </div>
      )}

      {/* YAML Viewer Modal */}
      <YamlViewerModal
        open={yamlModal.open}
        onClose={() => setYamlModal((prev) => ({ ...prev, open: false }))}
        yamlContent={yamlModal.content}
        fileName={yamlModal.fileName}
        title={yamlModal.title}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Row                                                          */
/* ------------------------------------------------------------------ */

interface WaiverTableRowProps {
  w: WaiverData;
  idx: number;
  sc: ReturnType<typeof statusConfig>;
  rc: ReturnType<typeof riskConfig>;
  isExpanded: boolean;
  onToggle: () => void;
  onViewYaml: () => void;
}

function WaiverTableRow({ w, idx, sc, rc, isExpanded, onToggle, onViewYaml }: WaiverTableRowProps) {
  const waiver = w.waiver;
  const days = daysUntil(waiver.expirationDate);
  const progress = waiver.remediationPlan.progressPercent ?? 0;

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30',
          isExpanded && 'bg-muted/20',
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3.5 text-center text-xs font-medium text-muted-foreground">{idx + 1}</td>
        <td className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-foreground">{waiver.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {waiver.exceptionId} · {waiver.targetAppName} · {waiver.violatedStandardId}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', sc.bg, sc.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
            {sc.label}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold', rc.cls)}>
            {rc.label}
          </span>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div>
            <p className="text-xs text-muted-foreground">{formatDate(waiver.expirationDate)}</p>
            {days !== null && waiver.status === 'APPROVED' && (
              <p className={cn('text-[10px] font-semibold', days <= 30 ? 'text-destructive' : days <= 90 ? 'text-warning' : 'text-muted-foreground')}>
                {days > 0 ? `${days}d remaining` : 'Overdue'}
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="w-24">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <ProgressBar percent={progress} className="mt-1" />
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onViewYaml}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold',
                'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              )}
              aria-label={`View YAML for ${waiver.title}`}
            >
              <Code2 className="h-3 w-3" />
              View
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail panel */}
      {isExpanded && (
        <tr className="border-b border-border/50">
          <td colSpan={7} className="bg-muted/10 px-0 py-0">
            <WaiverDetailPanel waiver={waiver} onViewYaml={onViewYaml} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Panel                                                       */
/* ------------------------------------------------------------------ */

function WaiverDetailPanel({ waiver, onViewYaml }: { waiver: ArchitectureWaiver; onViewYaml: () => void }) {
  const sc = statusConfig(waiver.status);
  const rc = riskConfig(waiver.riskSeverity);
  const StatusIcon = sc.icon;

  return (
    <div className="px-6 py-5">
      {/* Header strip */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', sc.bg, sc.text)}>
          <StatusIcon className="h-3.5 w-3.5" />
          {sc.label}
        </span>
        <span className={cn('inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold', rc.cls)}>
          {rc.label} Risk
        </span>
        {waiver.domain && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {waiver.domain}
          </span>
        )}
        {(waiver.tags ?? []).map((tag) => (
          <span key={tag} className="rounded-full bg-ring/10 px-2.5 py-1 text-xs font-medium text-ring">
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          {/* Rationale */}
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rationale</h4>
            <p className="text-sm leading-relaxed text-foreground">{waiver.rationale}</p>
          </section>

          {/* Risk Description */}
          {waiver.riskDescription && (
            <section>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Description</h4>
              <p className="text-sm leading-relaxed text-foreground">{waiver.riskDescription}</p>
            </section>
          )}

          {/* Violated Standard */}
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Violated Standard</h4>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-medium text-foreground">{waiver.violatedStandardName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{waiver.violatedStandardId}</p>
              {waiver.violatedRequirementIds && waiver.violatedRequirementIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {waiver.violatedRequirementIds.map((r) => (
                    <span key={r} className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Compensating Controls */}
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compensating Controls ({waiver.compensatingControls.length})
            </h4>
            <div className="space-y-2">
              {waiver.compensatingControls.map((cc, i) => {
                const effColor = cc.effectiveness === 'HIGH' ? 'text-success' : cc.effectiveness === 'MEDIUM' ? 'text-warning' : 'text-destructive';
                return (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground">{cc.control}</p>
                      <span className={cn('shrink-0 text-[10px] font-bold uppercase', effColor)}>{cc.effectiveness}</span>
                    </div>
                    {cc.verificationMethod && (
                      <p className="mt-1 text-xs text-muted-foreground">Verification: {cc.verificationMethod}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Financial Impact */}
          {waiver.financialImpact && (
            <section>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Impact</h4>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Compliance Cost</p>
                    <p className="text-sm font-bold text-foreground">{waiver.financialImpact.complianceCost}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Delay Cost</p>
                    <p className="text-sm font-bold text-foreground">{waiver.financialImpact.delayCost}</p>
                  </div>
                  {waiver.financialImpact.riskExposureCost && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Risk Exposure</p>
                      <p className="text-sm font-bold text-destructive">{waiver.financialImpact.riskExposureCost}</p>
                    </div>
                  )}
                </div>
                <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">{waiver.financialImpact.summary}</p>
              </div>
            </section>
          )}

          {/* Remediation Plan */}
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remediation Plan</h4>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-foreground">{waiver.remediationPlan.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Target Date</p>
                  <p className="font-medium text-foreground">{formatDate(waiver.remediationPlan.targetDate)}</p>
                </div>
                {waiver.remediationPlan.assignedTeam && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Assigned Team</p>
                    <p className="font-medium text-foreground">{waiver.remediationPlan.assignedTeam}</p>
                  </div>
                )}
              </div>
              {waiver.remediationPlan.progressPercent !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-foreground">{waiver.remediationPlan.progressPercent}%</span>
                  </div>
                  <ProgressBar percent={waiver.remediationPlan.progressPercent} className="mt-1" />
                </div>
              )}
              {waiver.remediationPlan.backlogItemUrl && (
                <a
                  href={waiver.remediationPlan.backlogItemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-ring hover:text-ring/80"
                >
                  View backlog item <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h4>
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested</span>
                  <span className="font-medium text-foreground">{formatDate(waiver.requestedDate)} by {waiver.requestedBy}</span>
                </div>
                {waiver.approvalDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span className="font-medium text-foreground">{formatDate(waiver.approvalDate)} by {waiver.approvedBy}</span>
                  </div>
                )}
                {waiver.expirationDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className={cn('font-medium', daysUntil(waiver.expirationDate) !== null && (daysUntil(waiver.expirationDate) ?? 0) <= 30 ? 'text-destructive' : 'text-foreground')}>
                      {formatDate(waiver.expirationDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Review Notes */}
          {waiver.reviewNotes && (
            <section>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review Notes</h4>
              <p className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                {waiver.reviewNotes}
              </p>
            </section>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onViewYaml}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold',
                'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              View YAML
            </button>
          </div>
        </div>
      </div>

      {/* Revision History */}
      {waiver.revisionHistory && waiver.revisionHistory.length > 0 && (
        <section className="mt-5 border-t border-border pt-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Revision History</h4>
          <div className="space-y-1">
            {waiver.revisionHistory.map((rev, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="shrink-0 text-muted-foreground">{formatDate(rev.date)}</span>
                <span className="shrink-0 font-medium text-foreground">{rev.author}</span>
                <span className="text-muted-foreground">{rev.change}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
