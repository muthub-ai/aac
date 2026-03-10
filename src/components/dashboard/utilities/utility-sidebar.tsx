'use client';

import { UTILITIES, UTILITY_COLORS } from '@/lib/data/utilities-data';
import { cn } from '@/lib/utils';

interface UtilitySidebarProps {
  active: string;
  onChange: (id: string) => void;
}

export function UtilitySidebar({ active, onChange }: UtilitySidebarProps) {
  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Developer Tools
        </p>
        {UTILITIES.map((utility) => {
          const isActive = active === utility.id;
          const colors = UTILITY_COLORS[utility.color] ?? UTILITY_COLORS.ring;

          return (
            <button
              key={utility.id}
              type="button"
              onClick={() => onChange(utility.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left transition-colors',
                isActive
                  ? 'border-ring bg-ring/8 font-semibold text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <utility.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? colors.text : 'text-muted-foreground',
                )}
                strokeWidth={1.8}
              />
              <span className="min-w-0 flex-1 truncate text-sm">{utility.name}</span>
              {utility.status === 'available' && (
                <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
                  Live
                </span>
              )}
              {utility.status === 'coming-soon' && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Soon
                </span>
              )}
              {utility.status === 'beta' && (
                <span className="shrink-0 rounded-full bg-chart-5/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-chart-5">
                  Beta
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function UtilityMobileStrip({ active, onChange }: UtilitySidebarProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" role="tablist">
      {UTILITIES.map((utility) => {
        const isActive = active === utility.id;

        return (
          <button
            key={utility.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(utility.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'bg-ring text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/15',
            )}
          >
            <utility.icon className="h-3 w-3" strokeWidth={2} />
            {utility.name}
            {utility.status === 'coming-soon' && (
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            )}
          </button>
        );
      })}
    </div>
  );
}
