'use client';

import { GitBranch, Clock, Box, Layers, Hexagon, Zap } from 'lucide-react';
import type { SystemData } from '@/types/system';
import { cn } from '@/lib/utils';

interface SystemCardProps {
  system: SystemData;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

const statFields = [
  { key: 'deployableUnits' as const, label: 'Deployable Units', icon: Box },
  { key: 'domainModules' as const, label: 'Domain Modules', icon: Layers },
  { key: 'domainObjects' as const, label: 'Domain Objects', icon: Hexagon },
  { key: 'domainBehaviors' as const, label: 'Domain Behaviors', icon: Zap },
];

export function SystemCard({ system, onClick }: SystemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full cursor-pointer rounded-xl border border-border p-6 text-left',
        'bg-card',
        'shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-ring/40 hover:bg-muted hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
      aria-label={`Open ${system.name}`}
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-foreground">{system.name}</h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {system.repoCount} {system.repoCount === 1 ? 'repository' : 'repositories'}
          <span className="mx-1.5 text-border">&middot;</span>
          {formatNumber(system.linesOfCode)} lines of code
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {statFields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.key}
              className="flex items-center gap-2.5 rounded-lg bg-muted dark:bg-background px-3 py-2.5"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-ring/70" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[11px] leading-tight text-tertiary-foreground">{field.label}</p>
                <p className="text-sm font-semibold text-foreground">{system[field.key]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-muted pt-4">
        <div className="flex items-center gap-1.5 text-[12px] text-tertiary-foreground">
          <Clock className="h-3 w-3" strokeWidth={1.8} />
          <span>{formatDate(system.lastScan)}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-ring/15 px-2.5 py-1 text-[11px] font-medium text-ring">
          <GitBranch className="h-3 w-3" strokeWidth={2} />
          {system.branchName}
        </div>
      </div>
    </button>
  );
}
