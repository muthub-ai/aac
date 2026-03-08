'use client';

import { Globe, Box, Cloud, Layers } from 'lucide-react';
import { useGraphStore } from '@/store/use-graph-store';
import { cn } from '@/lib/utils';
import type { ViewInfo } from '@/lib/parser/new-to-old-transform';

const VIEW_TYPE_CONFIG = {
  systemContext: {
    icon: Globe,
    label: 'System Context',
    color: 'text-blue-500',
  },
  container: {
    icon: Box,
    label: 'Container',
    color: 'text-emerald-500',
  },
  deployment: {
    icon: Cloud,
    label: 'Deployment',
    color: 'text-purple-500',
  },
} as const;

function ViewItem({ view, isActive, onClick }: { view: ViewInfo; isActive: boolean; onClick: () => void }) {
  const config = VIEW_TYPE_CONFIG[view.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors',
        'hover:bg-muted/80',
        isActive
          ? 'bg-primary/10 text-foreground ring-1 ring-primary/20'
          : 'text-muted-foreground',
      )}
      aria-pressed={isActive}
      title={view.description}
    >
      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', config.color)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">
          {view.title || view.key}
        </div>
        {view.description && (
          <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
            {view.description}
          </div>
        )}
      </div>
    </button>
  );
}

function ViewGroup({ type, views, activeViewKey, onSelect }: {
  type: 'systemContext' | 'container' | 'deployment';
  views: ViewInfo[];
  activeViewKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  if (views.length === 0) return null;
  const config = VIEW_TYPE_CONFIG[type];

  return (
    <div className="space-y-1">
      <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {config.label} Views
      </h3>
      <div className="space-y-0.5">
        {views.map((view) => (
          <ViewItem
            key={view.key}
            view={view}
            isActive={activeViewKey === view.key}
            onClick={() => onSelect(activeViewKey === view.key ? null : view.key)}
          />
        ))}
      </div>
    </div>
  );
}

export function ViewsPane() {
  const availableViews = useGraphStore((s) => s.availableViews);
  const activeViewKey = useGraphStore((s) => s.activeViewKey);
  const setActiveView = useGraphStore((s) => s.setActiveView);

  const systemContextViews = availableViews.filter((v) => v.type === 'systemContext');
  const containerViews = availableViews.filter((v) => v.type === 'container');
  const deploymentViews = availableViews.filter((v) => v.type === 'deployment');

  const hasViews = availableViews.length > 0;

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-semibold tracking-tight">Views</h2>
        {hasViews && (
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {availableViews.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasViews ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Layers className="mb-2 h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              No views defined
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Add a views section to your YAML to see available views here
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {activeViewKey && (
              <button
                onClick={() => setActiveView(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                Show All Elements
              </button>
            )}
            <ViewGroup
              type="systemContext"
              views={systemContextViews}
              activeViewKey={activeViewKey}
              onSelect={setActiveView}
            />
            <ViewGroup
              type="container"
              views={containerViews}
              activeViewKey={activeViewKey}
              onSelect={setActiveView}
            />
            <ViewGroup
              type="deployment"
              views={deploymentViews}
              activeViewKey={activeViewKey}
              onSelect={setActiveView}
            />
          </div>
        )}
      </div>
    </div>
  );
}
