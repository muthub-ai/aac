'use client';

import {
  Brain,
  BarChart3,
  Globe,
  Server,
  Database,
  MessageSquare,
  Network,
  ShieldCheck,
  HardDrive,
  Download,
  Star,
  Rocket,
  FileCode2,
} from 'lucide-react';
import type { PatternData } from '@/types/pattern';
import { CATEGORY_COLORS } from '@/lib/data/mock-patterns';
import { cn } from '@/lib/utils';

const MAX_VISIBLE_TAGS = 4;

interface PatternCardProps {
  pattern: PatternData;
  isSelected: boolean;
  onClick: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Brain,
  BarChart3,
  Globe,
  Server,
  Database,
  MessageSquare,
  Network,
  ShieldCheck,
  HardDrive,
};

function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function PatternCard({ pattern, isSelected, onClick }: PatternCardProps) {
  const Icon = ICON_MAP[pattern.icon] ?? Server;
  const colors = CATEGORY_COLORS[pattern.category] ?? CATEGORY_COLORS.compute;
  const visibleTags = pattern.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = pattern.tags.length - MAX_VISIBLE_TAGS;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left',
        'bg-card shadow-sm',
        'transition-all duration-200 ease-out',
        'hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isSelected
          ? 'border-ring ring-2 ring-ring/30 shadow-md'
          : 'border-border hover:border-ring/30',
      )}
      aria-label={`View details for ${pattern.name}`}
      aria-pressed={isSelected}
    >
      {/* Color header block */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-4',
          colors.bg,
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            'bg-background/80 shadow-sm',
          )}
        >
          <Icon className={cn('h-5 w-5', colors.text)} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {pattern.name}
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            v{pattern.version}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pt-3.5 pb-4">
        <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {pattern.description}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{hiddenCount}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-3 border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Downloads">
            <Download className="h-3 w-3 shrink-0" strokeWidth={1.8} />
            {formatDownloads(pattern.downloads)}
          </span>
          <span className="inline-flex items-center gap-1" title="Rating">
            <Star className="h-3 w-3 shrink-0 text-warning" strokeWidth={1.8} fill="currentColor" />
            {pattern.stars.toFixed(1)}
          </span>
          {pattern.diagrams.length > 0 && (
            <span className="inline-flex items-center gap-1" title="Architecture diagrams">
              <FileCode2 className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              {pattern.diagrams.length}
            </span>
          )}
          <span
            className={cn(
              'ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold',
              'bg-ring text-white',
              'transition-all group-hover:shadow-sm',
            )}
          >
            <Rocket className="h-3 w-3" strokeWidth={2} />
            Deploy
          </span>
        </div>
      </div>
    </button>
  );
}
