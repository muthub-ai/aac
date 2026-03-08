'use client';

import { useRef, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CatalogTab {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface CatalogTabsProps {
  tabs: CatalogTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function CatalogTabs({ tabs, activeTab, onTabChange }: CatalogTabsProps) {
  const tablistRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      onTabChange(tabs[nextIndex].id);

      const tabEl = tablistRef.current?.querySelector<HTMLButtonElement>(
        `[data-tab-id="${tabs[nextIndex].id}"]`,
      );
      tabEl?.focus();
    },
    [tabs, activeTab, onTabChange],
  );

  return (
    <nav
      className="border-b border-border"
      aria-label="Catalog navigation"
    >
      <div
        ref={tablistRef}
        className="mx-auto flex max-w-6xl items-center gap-0 overflow-x-auto px-6 sm:px-10"
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              data-tab-id={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-150',
                'border-b-2 -mb-px',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset',
                isActive
                  ? 'border-tab-active font-semibold text-foreground'
                  : 'border-transparent font-normal text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
                strokeWidth={1.8}
              />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-xs font-medium leading-none',
                    'bg-accent',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
