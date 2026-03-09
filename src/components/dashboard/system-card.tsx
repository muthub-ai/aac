'use client';

import { useState } from 'react';
import {
  GitBranch,
  Clock,
  Users,
  Server,
  Container,
  ArrowRightLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import type { SystemData } from '@/types/system';
import { cn } from '@/lib/utils';

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
  const hiddenCount = system.tags.length - MAX_VISIBLE_TAGS;
  const visibleTags = tagsExpanded ? system.tags : system.tags.slice(0, MAX_VISIBLE_TAGS);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer flex-col rounded-xl border border-border text-left',
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

      {/* Row 2: Title */}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="min-w-0 truncate text-[15px] font-semibold text-foreground transition-colors group-hover:text-ring">
          {system.name}
        </h3>
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
            'ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5',
            'text-[10px] font-medium text-muted-foreground/50',
            'transition-colors hover:bg-ring/10 hover:text-ring',
            'cursor-pointer',
          )}
          title="View documentation"
        >
          <BookOpen className="h-2.5 w-2.5" strokeWidth={1.8} />
          Docs
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

      {/* Row 5: Architecture stats + meta — single line */}
      <div className="mt-auto flex items-center gap-x-2.5 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
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
  );
}
