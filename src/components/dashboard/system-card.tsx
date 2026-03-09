'use client';

import { useCallback, useState } from 'react';
import {
  GitBranch,
  Clock,
  Users,
  Server,
  Container,
  ArrowRightLeft,
  ChevronRight,
  ExternalLink,
  CircleCheck,
  Code2,
  Download,
} from 'lucide-react';
import type { SystemData } from '@/types/system';
import { cn } from '@/lib/utils';
import { YamlViewerModal } from '@/components/ui/yaml-viewer-modal';

const MAX_VISIBLE_TAGS = 5;

interface SystemCardProps {
  system: SystemData;
  onClick: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1mo ago' : `${months}mo ago`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toLocaleString('en-US');
}

function truncateBranch(name: string, max = 12): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + '\u2026';
}

export function SystemCard({ system, onClick }: SystemCardProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [yamlOpen, setYamlOpen] = useState(false);
  const hiddenCount = system.tags.length - MAX_VISIBLE_TAGS;
  const visibleTags = tagsExpanded ? system.tags : system.tags.slice(0, MAX_VISIBLE_TAGS);

  const handleDownloadYaml = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!system.yamlContent) return;
    const blob = new Blob([system.yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${system.id}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [system.yamlContent, system.id]);

  return (
    <>
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border text-left',
        'bg-card p-5',
        'shadow-sm',
        'transition-all duration-200 ease-out',
        'hover:border-ring/30 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
      aria-label={`Open ${system.name}`}
    >
      {/* Row 1: Group */}
      {system.group && (
        <div className="mb-2">
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {system.group}
          </span>
        </div>
      )}

      {/* Row 2: Title + status */}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="min-w-0 truncate text-[15px] font-semibold text-foreground transition-colors group-hover:text-ring">
          {system.name}
        </h3>
        <span
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success"
          title="All validation checks passed"
        >
          <CircleCheck className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />
          Passing
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ring" />
      </div>

      {/* Row 3: Description */}
      {system.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {system.description}
        </p>
      )}

      {/* Row 4: Tags */}
      {system.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-ring/8 px-1.5 py-0.5 text-[10px] font-medium text-ring/80"
            >
              {tag}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setTagsExpanded(!tagsExpanded); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); setTagsExpanded(!tagsExpanded); } }}
              className="cursor-pointer rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted-foreground/15"
            >
              {tagsExpanded ? 'show less' : `+${hiddenCount} more`}
            </span>
          )}
        </div>
      )}

      {/* Code action row */}
      {system.yamlContent && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <Code2 className="h-3.5 w-3.5 shrink-0 text-ring" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-muted-foreground">architecture.yaml</span>
          <div className="ml-auto flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setYamlOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); setYamlOpen(true); } }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                'border-ring/30 bg-ring/10 text-ring',
                'cursor-pointer transition-all hover:bg-ring/20',
              )}
              title="View YAML source"
            >
              <Code2 className="h-2.5 w-2.5" strokeWidth={2.5} />
              View
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleDownloadYaml}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); handleDownloadYaml(e as unknown as React.MouseEvent); } }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                'border-border bg-muted/50 text-muted-foreground',
                'cursor-pointer transition-all hover:bg-muted hover:text-foreground',
              )}
              title="Download YAML file"
            >
              <Download className="h-2.5 w-2.5" strokeWidth={2} />
              .yaml
            </span>
          </div>
        </div>
      )}

      {/* Row 5: Architecture stats + meta */}
      <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            window.open(
              `https://muthub-ai.github.io/aac/systems/${system.id}.html`,
              '_blank',
              'noopener,noreferrer',
            );
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              window.open(
                `https://muthub-ai.github.io/aac/systems/${system.id}.html`,
                '_blank',
                'noopener,noreferrer',
              );
            }
          }}
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5',
            'text-[10px] font-semibold',
            'border-chart-5/30 bg-chart-5/10 text-chart-5',
            'transition-all hover:border-chart-5/50 hover:bg-chart-5/20',
            'cursor-pointer',
          )}
          title="View documentation on GitHub Pages"
        >
          <ExternalLink className="h-2.5 w-2.5" strokeWidth={2} />
          Docs
        </span>

        <span className="mx-0.5 h-3 w-px bg-border/60" />

        <span className="inline-flex items-center gap-1" title="People">
          <Users className="h-3 w-3 shrink-0 text-blue-500/70" strokeWidth={1.8} />
          {system.peopleCount}
        </span>
        <span className="inline-flex items-center gap-1" title="Software Systems">
          <Server className="h-3 w-3 shrink-0 text-indigo-500/70" strokeWidth={1.8} />
          {system.softwareSystemCount}
        </span>
        <span className="inline-flex items-center gap-1" title="Containers">
          <Container className="h-3 w-3 shrink-0 text-emerald-500/70" strokeWidth={1.8} />
          {system.containerCount}
        </span>
        <span className="inline-flex items-center gap-1" title="Relationships">
          <ArrowRightLeft className="h-3 w-3 shrink-0 text-amber-500/70" strokeWidth={1.8} />
          {system.relationshipCount}
        </span>

        <span className="ml-auto inline-flex shrink-0 items-center gap-2.5 text-[10px] text-muted-foreground/70">
          <span>{formatNumber(system.linesOfCode)} LoC</span>
          <span className="inline-flex items-center gap-0.5" title={system.branchName}>
            <GitBranch className="h-2.5 w-2.5 shrink-0" strokeWidth={1.8} />
            {truncateBranch(system.branchName)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5 shrink-0" strokeWidth={1.8} />
            {timeAgo(system.lastScan)}
          </span>
        </span>
      </div>
    </button>

    {system.yamlContent && (
      <YamlViewerModal
        open={yamlOpen}
        onClose={() => setYamlOpen(false)}
        yamlContent={system.yamlContent}
        fileName={`${system.id}.yaml`}
        title={system.name}
      />
    )}
    </>
  );
}
