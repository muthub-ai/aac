'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp, Code2, FileText } from 'lucide-react';
import type { StandardData, LifecycleCategory, PublicationStatus } from '@/types/standard';
import { cn } from '@/lib/utils';
import { YamlViewerModal } from '@/components/ui/yaml-viewer-modal';
import { PipelineVisualization } from './pipeline-visualization';

interface StandardsCatalogProps {
  standards: StandardData[];
}

/** Color-coded status badge */
function statusBadge(status: PublicationStatus) {
  switch (status) {
    case 'APPROVED':
      return { dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' };
    case 'DRAFT':
      return { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' };
    case 'RETIRED':
      return { dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

/** Color-coded lifecycle badge */
function lifecycleBadge(lifecycle: LifecycleCategory | undefined) {
  switch (lifecycle) {
    case 'STANDARD':
      return { label: 'Standard', cls: 'bg-ring/10 text-ring border-ring/20' };
    case 'PROVISIONAL STANDARD':
      return { label: 'Prov. Standard', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    case 'PROVISIONAL':
      return { label: 'Provisional', cls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    case 'DRAFT':
      return { label: 'Draft', cls: 'bg-muted text-muted-foreground border-border' };
    case 'RETIRED':
      return { label: 'Retired', cls: 'bg-muted text-muted-foreground/60 border-border line-through' };
    default:
      return { label: 'Unknown', cls: 'bg-muted text-muted-foreground border-border' };
  }
}

/** Format date as "Jan 2025" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Collect unique values from standards */
function collectDomains(standards: StandardData[]): string[] {
  const set = new Set<string>();
  for (const s of standards) set.add(s.standard.metadata.architectureDomain);
  return [...set].sort();
}

function collectStatuses(standards: StandardData[]): PublicationStatus[] {
  const set = new Set<PublicationStatus>();
  for (const s of standards) set.add(s.standard.metadata.publicationStatus);
  return [...set].sort();
}

function collectLifecycles(standards: StandardData[]): string[] {
  const set = new Set<string>();
  for (const s of standards) {
    if (s.standard.metadata.lifecycleCategory) set.add(s.standard.metadata.lifecycleCategory);
  }
  return [...set].sort();
}

export function StandardsCatalog({ standards }: StandardsCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedLifecycle, setSelectedLifecycle] = useState<string | null>(null);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLifecycleDropdown, setShowLifecycleDropdown] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [yamlModal, setYamlModal] = useState<{ open: boolean; content: string; fileName: string; title: string }>({
    open: false, content: '', fileName: '', title: '',
  });

  const allDomains = useMemo(() => collectDomains(standards), [standards]);
  const allStatuses = useMemo(() => collectStatuses(standards), [standards]);
  const allLifecycles = useMemo(() => collectLifecycles(standards), [standards]);

  const filtered = useMemo(() => {
    let result = standards;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.standard.metadata.name.toLowerCase().includes(q) ||
          s.standard.metadata.architectureDomain.toLowerCase().includes(q) ||
          s.standard.metadata.standardId.toLowerCase().includes(q) ||
          (s.standard.metadata.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (selectedDomain) {
      result = result.filter((s) => s.standard.metadata.architectureDomain === selectedDomain);
    }
    if (selectedStatus) {
      result = result.filter((s) => s.standard.metadata.publicationStatus === selectedStatus);
    }
    if (selectedLifecycle) {
      result = result.filter((s) => s.standard.metadata.lifecycleCategory === selectedLifecycle);
    }
    return result;
  }, [standards, searchQuery, selectedDomain, selectedStatus, selectedLifecycle]);

  const uniqueDomainCount = useMemo(
    () => new Set(filtered.map((s) => s.standard.metadata.architectureDomain)).size,
    [filtered],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedDomain(null);
    setSelectedStatus(null);
    setSelectedLifecycle(null);
  }, []);

  const hasActiveFilters = searchQuery.trim() || selectedDomain || selectedStatus || selectedLifecycle;

  const openYaml = (s: StandardData) => {
    setYamlModal({
      open: true,
      content: s.yamlContent,
      fileName: s.fileName,
      title: s.standard.metadata.name,
    });
  };

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowDomainDropdown(false);
    setShowStatusDropdown(false);
    setShowLifecycleDropdown(false);
  };

  return (
    <div onClick={closeDropdowns}>
      {/* Search + Filters Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, domain, ID, or tag..."
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
              onClick={() => { setShowDomainDropdown((o) => !o); setShowStatusDropdown(false); setShowLifecycleDropdown(false); }}
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
              onClick={() => { setShowStatusDropdown((o) => !o); setShowDomainDropdown(false); setShowLifecycleDropdown(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                'hover:bg-muted',
                selectedStatus ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
              )}
            >
              {selectedStatus ?? 'Status'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showStatusDropdown && 'rotate-180')} />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => { setSelectedStatus(null); setShowStatusDropdown(false); }}
                  className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', !selectedStatus ? 'font-medium text-foreground' : 'text-muted-foreground')}
                >
                  All
                </button>
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedStatus(s); setShowStatusDropdown(false); }}
                    className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', selectedStatus === s ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lifecycle dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowLifecycleDropdown((o) => !o); setShowDomainDropdown(false); setShowStatusDropdown(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors',
                'hover:bg-muted',
                selectedLifecycle ? 'border-ring/40 text-foreground' : 'text-muted-foreground',
              )}
            >
              {selectedLifecycle ?? 'Lifecycle'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showLifecycleDropdown && 'rotate-180')} />
            </button>
            {showLifecycleDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => { setSelectedLifecycle(null); setShowLifecycleDropdown(false); }}
                  className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', !selectedLifecycle ? 'font-medium text-foreground' : 'text-muted-foreground')}
                >
                  All
                </button>
                {allLifecycles.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setSelectedLifecycle(l); setShowLifecycleDropdown(false); }}
                    className={cn('block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted', selectedLifecycle === l ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  >
                    {l}
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
              {filtered.length} of {standards.length}{' '}
              {standards.length === 1 ? 'standard' : 'standards'}
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-ring hover:text-ring/80"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {standards.length} {standards.length === 1 ? 'standard' : 'standards'} across {uniqueDomainCount}{' '}
            {uniqueDomainCount === 1 ? 'domain' : 'domains'}
          </p>
        )}
      </div>

      {/* Standards Table */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-12 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Standard</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lifecycle</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved</th>
                  <th className="w-24 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">YAML</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const meta = s.standard.metadata;
                  const sb = statusBadge(meta.publicationStatus);
                  const lb = lifecycleBadge(meta.lifecycleCategory);
                  const isExpanded = expandedRow === meta.standardId;

                  return (
                    <TableRow
                      key={meta.standardId}
                      s={s}
                      idx={idx}
                      sb={sb}
                      lb={lb}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRow(meta.standardId)}
                      onViewYaml={() => openYaml(s)}
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
          <p className="text-sm font-medium text-muted-foreground">No standards match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-ring hover:text-ring/80"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pipeline Visualization */}
      <div className="mt-8">
        <PipelineVisualization />
      </div>

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

/* ── Table Row Component ─────────────────────────────────────────── */

interface TableRowProps {
  s: StandardData;
  idx: number;
  sb: { dot: string; text: string; bg: string };
  lb: { label: string; cls: string };
  isExpanded: boolean;
  onToggle: () => void;
  onViewYaml: () => void;
}

function TableRow({ s, idx, sb, lb, isExpanded, onToggle, onViewYaml }: TableRowProps) {
  const meta = s.standard.metadata;
  const reqCount = s.standard.requirements.length;

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30',
          isExpanded && 'bg-muted/20',
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3.5 text-center text-xs font-medium text-muted-foreground">
          {idx + 1}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground leading-snug">{meta.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {meta.architectureDomain} · v{meta.version} · {reqCount} {reqCount === 1 ? 'requirement' : 'requirements'}
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
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', sb.bg, sb.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', sb.dot)} />
            {meta.publicationStatus}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold', lb.cls)}>
            {lb.label}
          </span>
        </td>
        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(meta.approvalDate)}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onViewYaml}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold',
                'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              )}
              aria-label={`View YAML for ${meta.name}`}
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
          <td colSpan={6} className="bg-muted/10 px-0 py-0">
            <StandardDetailPanel standard={s.standard} onViewYaml={onViewYaml} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Detail Panel ────────────────────────────────────────────────── */

import type { ArchitectureStandard, Severity } from '@/types/standard';

function severityBadge(severity: Severity | undefined) {
  switch (severity) {
    case 'MUST':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'MUST NOT':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'SHOULD':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'SHOULD NOT':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function StandardDetailPanel({ standard, onViewYaml }: { standard: ArchitectureStandard; onViewYaml: () => void }) {
  const meta = standard.metadata;

  return (
    <div className="space-y-5 px-8 py-6">
      {/* Header with ID + metadata pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ring/10 px-2 py-0.5 text-xs font-mono font-semibold text-ring">
          {meta.standardId}
        </span>
        {meta.standardOwner && (
          <span className="text-xs text-muted-foreground">
            Owner: <span className="font-medium text-foreground">{meta.standardOwner}</span>
          </span>
        )}
        {meta.assignedArchitect && (
          <span className="text-xs text-muted-foreground">
            Architect: <span className="font-medium text-foreground">{meta.assignedArchitect}</span>
          </span>
        )}
      </div>

      {/* Tags */}
      {meta.tags && meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ring/10 px-2 py-0.5 text-[10px] font-medium text-ring"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Architecture Principles */}
      {meta.architecturePrinciple && meta.architecturePrinciple.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Architecture Principles
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {meta.architecturePrinciple.map((p) => (
              <span
                key={p}
                className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scope */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">In Scope</h4>
          <ul className="space-y-1">
            {standard.scope.inScope.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Out of Scope</h4>
          <ul className="space-y-1">
            {standard.scope.outOfScope.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Requirements ({standard.requirements.length})
        </h4>
        <div className="space-y-2">
          {standard.requirements.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border border-border/50 bg-card px-4 py-3"
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground">
                  {req.id}
                </span>
                {req.severity && (
                  <span className={cn('shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold', severityBadge(req.severity))}>
                    {req.severity}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{req.statement}</p>
              {req.rationale && (
                <p className="mt-1 text-[11px] italic text-muted-foreground">{req.rationale}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines */}
      {standard.guidelines && standard.guidelines.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guidelines</h4>
          <ul className="space-y-1">
            {standard.guidelines.map((g) => (
              <li key={g.id} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-mono font-semibold text-muted-foreground">{g.id}</span>
                {g.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Solutions */}
      {standard.solutions && standard.solutions.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved Solutions</h4>
          <div className="flex flex-wrap gap-2">
            {standard.solutions.map((sol) => (
              <span
                key={sol.id}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                title={sol.description}
              >
                {sol.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Authoritative Sources */}
      {standard.authoritativeSources && standard.authoritativeSources.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Authoritative Sources</h4>
          <ul className="space-y-1">
            {standard.authoritativeSources.map((src) => (
              <li key={src.id} className="text-xs text-foreground/80">
                <span className="font-medium">{src.source}</span>
                <span className="text-muted-foreground"> — {src.issuingAgency}</span>
                {src.controlName && <span className="text-muted-foreground/60"> ({src.controlName})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
        <button
          onClick={onViewYaml}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
          aria-label="View full YAML source"
        >
          <FileText className="h-3.5 w-3.5" />
          View YAML Source
        </button>
      </div>
    </div>
  );
}
